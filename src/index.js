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
var ss = require('socket.io-stream');
var logger = require('express-logger');
var fs = require('fs');

//var Database = require("./Database/mongooseConnect.js");

var globalCount = 0;
var port = 3332;  // declare port here so changes to the port are reflected in code below
				 // must be on port 3332 on excalibur for the grader
var server = require("http").Server(app);
var io = require("socket.io")(server);
var clients = [];
var client_map = {};
var connection_map = {};
var stream = ss.createStream();
var Files = {};

function generateUID() {
    return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4);
}

var handleClient = function (socket) {
	var tweet = {user: "nodesource", text: "Hello, world!"};
	var id = generateUID();
    // to make things interesting, have it send every second
	console.info('New client connected (id=' + socket.id + ').');
	client_map[id] = socket.id;
	io.to(socket.id).emit('session_start', id);

    socket.on("disconnect", function () {
    	 var index = clients.indexOf(socket);
         if (index !== -1) {
             clients.splice(index, 1);
             console.info('Client gone (id=' + socket.id + ').');
         }
    });
    
    socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
        var Name = data['Name'];
        var user = data['User'];
        var enduser = client_map[user]
       
        Files[Name] = {  //Create a new Entry in The Files Variable
            FileSize : data['Size'],
            Data     : "",
            Downloaded : 0
        }
        var Place = 0;
        try{
            var Stat = fs.statSync('./Temp/' +  Name);
            if(Stat.isFile())
            {
                Files[Name]['Downloaded'] = Stat.size;
                Place = Stat.size / 524288;
                
                
            }
        }
        catch(er){} //It's a New File
        fs.open("./Temp/" + Name, "a", 0755, function(err, fd){
            if(err)
            {
                console.log(err);
            }
            else
            {
                Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
                socket.emit('MoreData', { 'Size' : data['Size'],'Place' : Place, Percent : 0 });
                console.log(enduser);
                console.log(user);
                io.to(enduser).emit('New Download', { 'Size' : data['Size'], 'Place' : Place, 'Percent' :  0, 'Name' : Name} );
                
            }
        });
    });
    
    socket.on('Upload', function (data){
        var Name = data['Name'];
        var user = data['User'];
        var enduser = client_map[user]
        Files[Name]['Downloaded'] += data['Data'].length;
        Files[Name]['Data'] += data['Data'];
        if(Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
        {
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
                //Get Thumbnail Here
            	var input = fs.createReadStream("./Temp/" + Name);
                var output = fs.createWriteStream("./Temp/" + Name);
                
               var Place = Files[Name]['Downloaded'] / 524288;
               var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
               console.log("Finished Uploading The File");
               io.to(enduser).emit('Final Data', { 'Name' : Name, 'Size' : Files[Name]['FileSize'], 'Place' : Place, 'Percent' :  Percent, 'Data' : Files[Name]['Data']} );
                           
                input.pipe(output);
                input.on("end", function() {
                	socket.emit('Done', { 'Size' : Files[Name]['FileSize'] ,  'Place' : Place, 'Percent' :  Percent});
                });
           
            });
        }
        else if(Files[Name]['Data'].length > 10485760){ //If the Data Buffer reaches 10MB
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
                
                var Place = Files[Name]['Downloaded'] / 524288;
                var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                io.to(enduser).emit('New Data', { 'Size' : Files[Name]['FileSize'], 'Place' : Place, 'Percent' :  Percent, 'Data' : Files[Name]['Data']} );
                socket.emit('MoreData', { 'Size' : Files[Name]['FileSize'] ,  'Place' : Place, 'Percent' :  Percent});
                Files[Name]['Data'] = ""; //Reset The Buffer
            });
        }
        else
        {
            var Place = Files[Name]['Downloaded'] / 524288;
            var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            io.to(enduser).emit('New Data', { 'Size' : Files[Name]['FileSize'] , 'Place' : Place, 'Percent' :  Percent, 'Data' : Files[Name]['Data']} );
            socket.emit('MoreData', { 'Size' : Files[Name]['FileSize'] , 'Place' : Place, 'Percent' :  Percent});
            
        }
    });
    
    
    
    socket.on('new_transfer', function(msg){
    	var enduser = client_map[msg.enduser];
    	var startuser = client_map[msg.startuser];
    	connection_map[enduser] = startuser;
    	connection_map[startuser] = enduser;
    	
    	if(enduser !== null){
    		console.log('Now Connected to ' + msg.startuser);
    		io.to(enduser).emit('Connected Now',  msg.startuser);
    		io.to(startuser).emit('Connected Now',  msg.enduser);
    	}else{
    		console.log('Connection failed with' + msg.enduser);
    		io.to(startuser).emit('Logs', 'Connection failed with ' + msg.enduser);
    	}
    });
};
 

io.on("connection", handleClient);

server.listen(3000, function(){
	  console.log('listening on *:3000');
	});

app.use(logger({path: "../logfile.txt"}));  // logger

/* does this get moved into the createSimulation.js module too? */


/*
 * Routes call for the homepage of our website.
 */
app.get('/', function(request,response){
	response.sendFile("./index.html", {"root": __dirname});	
}); 
/*
 * Routes call for the homepage of our website.
 */
app.get('/index', function(request,response){
	response.sendFile("./index.html", {"root": __dirname});
	
}); 

app.get('/css/bootstrap.min.css', function(request,response){
	response.sendFile("/css/bootstrap.min.css", {"root": __dirname});
	
});
app.get('/css/main.css', function(request,response){
	response.sendFile("/Client/css/main.css", {"root": __dirname});
	
});

app.get('/socket/socket.io.js', function(request,response){
	response.sendFile("/socket/socket.io.js", {"root": __dirname});
	
});

app.get('/img/img.png', function(request,response){
	response.sendFile("/img/img.png", {"root": __dirname});
	
});

app.get('/img/search.png', function(request,response){
	response.sendFile("/img/search.png", {"root": __dirname});
	
});
app.get('/js/main.js', function(request,response){
	response.sendFile("/Client/js/main.js", {"root": __dirname});
	
}); 

app.get("/socket/socket.io-stream", function( request, response){
	response.sendFile("/socket/socket.io-stream.js", {"root": __dirname});
});

app.get('/js/require.js', function(request,response){
	response.sendFile("/Client/js/require.js", {"root": __dirname});
	
}); 
//exports.globalCount = globalCount;  // use globalCount in other modules under routes/
