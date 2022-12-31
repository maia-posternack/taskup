//..............Include Express..................................//
const express = require('express');
const fs = require('fs');
const ejs = require('ejs');

//..............Create an Express server object..................//
const app = express();

//..............Apply Express middleware to the server object....//
app.use(express.json()); //Used to parse JSON bodies (needed for POST requests)
app.use(express.urlencoded());
app.use(express.static('public')); //specify location of static assests
app.set('views', __dirname + '/views'); //specify location of templates
app.set('view engine', 'ejs'); //specify templating library

//.............Define server routes..............................//
//Express checks routes in the order in which they are defined

app.get('/', function(request, response) {
  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("index", {
    allAss: JSON.parse(fs.readFileSync('data/assignments.json'))
  });
});


app.get('/today', function(request, response) {
  let d = new Date();
  let str = (d.getFullYear() + "-")
  if (d.getMonth() + 1 < 10) {
    str += 0;
  }
  str += (d.getMonth() + 1) + "-";
  if (d.getDate() < 10) {
    str += 0;
  }
  str += d.getDate();

  let task = JSON.parse(fs.readFileSync('data/tasks.json'));
  let assignment = JSON.parse(fs.readFileSync('data/assignments.json'));
  let tsk = []

  for (todo in task) {
    if (task[todo]["due"] == str) {
      tsk.push(task[todo]);
    }
  }

  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("tasks", {
    assignments: assignment,
    tasks: tsk,
    day: "today",
    allAss: JSON.parse(fs.readFileSync('data/assignments.json'))
  });

});

app.post('/today', function(request, response) {
  let newDate = request.body.newDate;


  if (newDate) {
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.redirect("/date/" + newDate.toString());
  } else {
    response.status(400);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      allAss: JSON.parse(fs.readFileSync('data/assignments.json')),
      "errorCode": "400"
    });
    console.log("error")

  }

})

app.post('/doneFromCal', function(request, response) {

  let tasks = JSON.parse(fs.readFileSync('data/tasks.json'));

  //let id = request.params.done.value;
  for (let i in request.body) {
    let parts = i.split(":")
    let pin = parts[0];
    let date = parts[1]

    console.log(pin, date)



    for (let hey in tasks) {
      if (hey == pin) {
        tasks[hey]["done"] = true;
        fs.writeFileSync('data/tasks.json', JSON.stringify(tasks));

        if (date == "today") {
          response.status(200);
          response.setHeader('Content-Type', 'text/html')
          response.redirect("/today");
        } else {
          response.status(200);
          response.setHeader('Content-Type', 'text/html')
          response.redirect("/date/" + date);
        }
      }
    }
  }
})

app.post('/doneFromPage', function(request, response) {

  let tasks = JSON.parse(fs.readFileSync('data/tasks.json'));

  //let id = request.params.done.value;
  for (let i in request.body) {
    let parts = i.split(":")
    let pin = parts[0];
    let assPin = parts[1]

    for (let hey in tasks) {
      if (hey == pin) {
        tasks[hey]["done"] = true;
        fs.writeFileSync('data/tasks.json', JSON.stringify(tasks));


        response.status(200);
        response.setHeader('Content-Type', 'text/html')
        response.redirect("/assignment/" + assPin);
      }
    }
  }
})

app.get("/deleted", function(request, response) {
  let assignments = JSON.parse(fs.readFileSync('data/assignments.json'));
  let tasks = JSON.parse(fs.readFileSync('data/tasks.json'));

  if (Object.keys(request.query).length > 0){

  for (let i in request.query) {
    for(let taskPin of assignments[i]["tasks"]){
      delete tasks[taskPin];

    }
    delete assignments[i];
    console.log(i)
    console.log(assignments)
    console.log(assignments[i])

}
  fs.writeFileSync('data/assignments.json', JSON.stringify(assignments));
  fs.writeFileSync('data/tasks.json', JSON.stringify(tasks));


  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("deleted", {
    allAss: JSON.parse(fs.readFileSync('data/assignments.json'))
  });

}else{
  response.status(400);
  response.setHeader('Content-Type', 'text/html')
  response.render("error", {
    allAss: JSON.parse(fs.readFileSync('data/assignments.json')),
    "errorCode": "400"
  });
}




})

app.get("/edit", function(request, response) {
  let assignments = JSON.parse(fs.readFileSync('data/assignments.json'));
  let tasks = JSON.parse(fs.readFileSync('data/tasks.json'));
  let myTasks = {}

  if (Object.keys(request.query).length > 0){
  let myAss;
  for (let pin in request.query) {
    myAss = assignments[pin]
  }
  if (myAss["tasks"]) {
    for (let taskPin of myAss["tasks"]) { // gets pin of all tasks in myAss
      myTasks[taskPin] = tasks[taskPin] // copy over to myTasks
    }
  }
  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("edit", {
    ass: myAss,
    tasks: myTasks,
    allAss: JSON.parse(fs.readFileSync('data/assignments.json'))
  });
}// if query length >0
else{

  response.status(400);
  response.setHeader('Content-Type', 'text/html')
  response.render("error", {
    allAss: JSON.parse(fs.readFileSync('data/assignments.json')),
    "errorCode": "400"
  });
}



})


app.post('/edit', function(request, response) {

  let assignmentName = request.body.assignmentName;
  let assignmentSubject = request.body.assignmentSubject;
  let assignmentDesc = request.body.assignmentDesc;
  let assignmentDue = request.body.assignmentDue;
  let allTaskDesc = request.body.taskDesc // string if this is first task, arr ottherwise
  let allTaskDate = request.body.taskDue// string if this is first task, arr ottherwise



  let assPin = request.body.assId;
  let oldTaskPin = request.body.taskPin; // string if this is exactly second task, arr ottherwise
  let oldTaskDone = request.body.taskDone;// string if this is exactly second task, arr ottherwise
  let secret = JSON.parse(fs.readFileSync('data/secrets.json'))
  let nextTaskPin = secret["taskPin"];

  if (assignmentDesc && assignmentDue) {
    console.log("heyyyo")
    let asses = JSON.parse(fs.readFileSync('data/assignments.json'));
    let updatedAss = {
      "name": assignmentName,
      "subject": assignmentSubject,
      "desc": assignmentDesc.toString(),
      "due": assignmentDue,
      "id": parseInt(assPin),
      "tasks": []
    } //end object

    let tasks = JSON.parse(fs.readFileSync('data/tasks.json'));

    if (typeof allTaskDesc === 'string') { //if there is only one task in total
      console.log("only one tasks")

      if (oldTaskPin !== undefined) { //if there are previous tasks aka this is just an edit
        console.log("edited one existing task, " + parseInt(oldTaskPin))
        let updatedTask = {
          "pin": parseInt(oldTaskPin),
          "due": allTaskDate,
          "desc": allTaskDesc,
          "done": JSON.parse(oldTaskDone)
        }
        tasks[oldTaskPin] = updatedTask;
        updatedAss["tasks"].push(oldTaskPin)
      } else {
        console.log("first task ever, " + parseInt(nextTaskPin))

        let newTask = {
          "pin": parseInt(nextTaskPin),
          "due": allTaskDate,
          "desc": allTaskDesc,
          "done": false
        }
        tasks[nextTaskPin] = newTask;
        updatedAss["tasks"].push(nextTaskPin)
        nextTaskPin += 1
      }
    } else { //more than one task
      if ((oldTaskPin !== undefined)&&(typeof oldTaskPin == 'string')){      //if exactly two tasks total


        console.log("u have exaactly two tasks, " + parseInt(oldTaskPin) + " and " + nextTaskPin)
        let updatedTask1 = {
        "pin": parseInt(oldTaskPin),
        "due": allTaskDate[0],
        "desc": allTaskDesc[0],
        "done": JSON.parse(oldTaskDone)
        } //end object
      let updatedTask2 = {
      "pin": nextTaskPin,
      "due": allTaskDate[1],
      "desc": allTaskDesc[1],
      "done": false
    } //end object
      tasks[oldTaskPin] = updatedTask1;
      tasks[nextTaskPin] = updatedTask2;

      updatedAss["tasks"].push(oldTaskPin)
      updatedAss["tasks"].push(nextTaskPin)
      nextTaskPin++

    } // if not exacly the second
      for (let index in allTaskDesc) {
        if (oldTaskPin !== undefined) { // if there are some old tasks in general
          if (index < oldTaskPin.length) { // if this is one of the old tasks, keep same pin
            if(typeof oldTaskPin !== 'string'){ // if not exactly the second
              console.log("more than two tasks in (existing), " + parseInt(oldTaskPin[index]))
            let updatedTask = {
              "pin": parseInt(oldTaskPin[index]),
              "due": allTaskDate[index],
              "desc": allTaskDesc[index],
              "done": JSON.parse(oldTaskDone[index])
            } //end object
            tasks[oldTaskPin[index]] = updatedTask;
            updatedAss["tasks"].push(oldTaskPin[index])
          } // if not exacly the second


        } //if this is an old task
        else {
          console.log("brand new task a lot later, " + nextTaskPin)

          let newTask = {
            "pin": nextTaskPin,
            "due": allTaskDate[index],
            "desc": allTaskDesc[index],
            "done": false
          } //end object
          tasks[nextTaskPin] = newTask;
          updatedAss["tasks"].push(nextTaskPin)
          nextTaskPin += 1

        } //if adding a new task but there are old tasks
      } //if some ecisting old tasks in general
      else{//all brand new tasks and > 1 of these
        console.log("all brand new tasks, " + nextTaskPin)

        let newTask = {
          "pin": nextTaskPin,
          "due": allTaskDate[index],
          "desc": allTaskDesc[index],
          "done": false
        } //end object
        tasks[nextTaskPin] = newTask;
        updatedAss["tasks"].push(nextTaskPin)
        nextTaskPin += 1



      } //all brand new tasks and > 1 of these




    } //going through all tasks
  } //more than one task being added

    console.log(tasks)
    fs.writeFileSync('data/tasks.json', JSON.stringify(tasks));

    secret["taskPin"] = nextTaskPin
    fs.writeFileSync('data/secrets.json', JSON.stringify(secret));


    asses[assPin] = updatedAss;
    fs.writeFileSync('data/assignments.json', JSON.stringify(asses));
  } //if there is data


  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.redirect("/assignment/" + assPin.toString());

});







app.get('/date/:newDate', function(request, response) {
  let newDate = request.params.newDate;

  let task = JSON.parse(fs.readFileSync('data/tasks.json'));
  let assignment = JSON.parse(fs.readFileSync('data/assignments.json'));
  let tsk = []

  for (todo in task) {
    if (task[todo]["due"] == newDate) {
      tsk.push(task[todo]);
    }
  }


  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("tasks", {
    assignments: assignment,
    tasks: tsk,
    day: newDate,
    allAss: JSON.parse(fs.readFileSync('data/assignments.json'))
  });


})


app.get('/assignmentCreate', function(request, response) {
  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("assignmentCreate", {
    allAss: JSON.parse(fs.readFileSync('data/assignments.json'))
  });
});

app.post('/assignmentCreate', function(request, response) {
  let assignmentName = request.body.assignmentName;
  let assignmentSubject = request.body.assignmentSubject;
  let assignmentDesc = request.body.assignmentDesc;
  let assignmentDue = request.body.assignmentDue;
  let allTaskDesc = (request.body.taskDesc)
  let allTaskDate = (request.body.taskDue)

  let assPin = JSON.parse(fs.readFileSync('data/secrets.json'))["assPin"];
  let taskPin = JSON.parse(fs.readFileSync('data/secrets.json'))["taskPin"];



  if (assignmentDesc && assignmentDue) {

    let asses = JSON.parse(fs.readFileSync('data/assignments.json'));
    let newAss = {
      "name": assignmentName,
      "subject": assignmentSubject,
      "desc": assignmentDesc.toString(),
      "due": assignmentDue,
      "id": assPin,
      "tasks": []
    }
    let tasks = JSON.parse(fs.readFileSync('data/tasks.json'));


    if (typeof allTaskDesc === 'string') { //if there is only one task in total
      console.log("only one tasks")

        let newTask = {
          "pin": taskPin,
          "due": allTaskDate,
          "desc": allTaskDesc,
          "done": false
        }
        tasks[taskPin] = newTask;
        newAss["tasks"].push(taskPin)
        taskPin += 1
      } else {
    for (let index in allTaskDesc) {
      let newTask = {
        "pin": taskPin,
        "due": allTaskDate[index],
        "desc": allTaskDesc[index],
        "done": false
      }
      tasks[taskPin] = newTask;
      newAss["tasks"].push(taskPin)
      taskPin += 1
    }
  } //end else of sting
    fs.writeFileSync('data/tasks.json', JSON.stringify(tasks));

    asses[assPin] = newAss;
    assPin += 1

    let secret = {
      "assPin": assPin,
      "taskPin": taskPin
    }
    fs.writeFileSync('data/secrets.json', JSON.stringify(secret));
    fs.writeFileSync('data/assignments.json', JSON.stringify(asses));

    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.redirect("/assignment/" + (newAss["id"]).toString());
  } else {
    response.status(400);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      allAss: JSON.parse(fs.readFileSync('data/assignments.json')),
      "errorCode": "400"
    });
  }
});


app.get('/assignment/:assignmentId', function(request, response) {
  let asses = JSON.parse(fs.readFileSync('data/assignments.json'));
  let tasks = JSON.parse(fs.readFileSync('data/tasks.json'));




  // using dynamic routes to specify resource request information
  let assignmentId = request.params.assignmentId;
  let tsk = {}

  if (asses[assignmentId]) {
    if (asses[assignmentId]["tasks"]) {
      for (let i of asses[assignmentId]["tasks"]) {
        tsk[i.toString()] = tasks[i.toString()]
      }
    }


    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("assignmentDetails", {
      assignment: asses[assignmentId],
      tasks: tsk,
      allAss: JSON.parse(fs.readFileSync('data/assignments.json'))
    });

  } else {
    response.status(404);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      allAss: JSON.parse(fs.readFileSync('data/assignments.json')),
      "errorCode": "404"
    });
  }
});




// Because routes/middleware are applied in order,
// this will act as a default error route in case of
// a request fot an invalid route
app.use("", function(request, response) {
  response.status(404);
  response.setHeader('Content-Type', 'text/html')
  response.render("error", {
    allAss: JSON.parse(fs.readFileSync('data/assignments.json')),
    "errorCode": "404"
  });
});

//..............Start the server...............................//
const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server started at http://localhost:' + port + '.')
});
