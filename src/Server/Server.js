/***
 * This module is responsible for server-related actions and calls.
 * Please note that the routing javascript code is located under
 * the routes folder within src.
 * @Author: Noah
 * @editedBy Ryan (Jan. 30)
 */

var express = require('express');
var app = express();
var path = require('path');
var logger = require('express-logger');

//var Database = require("./Database/mongooseConnect.js");

var globalCount = 0;
var port = 3332;  // declare port here so changes to the port are reflected in code below
				 // must be on port 3332 on excalibur for the grader
var server = require("http").Server(app);
var io = require("socket.io")(server);


var handleClient = function (socket) {
	var tweet = {user: "nodesource", text: "Hello, world!"};

    // to make things interesting, have it send every second
    var interval = setInterval(function () {
        socket.emit("tweet", tweet);
    }, 1000);

    socket.on("disconnect", function () {
        clearInterval(interval);
    });
};

io.on("connection", handleClient);
app.listen(3000, function(){
	  console.log('listening on *:3000');
	});

app.use(logger({path: "../logfile.txt"}));  // logger

/* does this get moved into the createSimulation.js module too? */


/*
 * Routes call for the homepage of our website.
 */
app.get('/', function(request,response){
	response.sendFile("../index.html", {"root": __dirname});	
}); 
/*
 * Routes call for the homepage of our website.
 */
app.get('/index', function(request,response){
	response.sendFile("../index.html", {"root": __dirname});
	
}); 

app.get('/css/dashboard.css', function(request,response){
	response.sendFile("css/dashboard.css", {"root": __dirname});
	
}); 
app.get('/css/bootstrap.min.css', function(request,response){
	response.sendFile("/css/bootstrap.min.css", {"root": __dirname});
	
});
app.get('/css/main.css', function(request,response){
	response.sendFile("/css/main.css", {"root": __dirname});
	
});

app.get('/img/img.png', function(request,response){
	response.sendFile("/img/img.png", {"root": __dirname});
	
});

app.get('/img/search.png', function(request,response){
	response.sendFile("/img/search.png", {"root": __dirname});
	
});
 

//exports.globalCount = globalCount;  // use globalCount in other modules under routes/
