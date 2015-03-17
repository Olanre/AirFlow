/**
 * New node file
 */
var ss = '';
var socket = io.connect();
var user = '';


require(['/socket/socket.io-stream'], function(ss){
	console.log("here");
	var stream = ss.createBlobReadStream(new Blob([1, 2, 3]));
	//ss(socket).emit('foo', stream);
	fs.createReadStream('foo.txt').pipe(stream);
	
	
});

socket.on('profile-image', function(stream, data) {
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename));
 });

var connectionid = '';

socket.on("session_start", function(tweet) {
    // todo: add the tweet as a DOM node
	connectionid = tweet;
    console.log("My id is", tweet);
    document.getElementById('MyId').innerHTML = "My Id is " + tweet;
}); 

socket.on('Logs', function(msg){
	console.log(msg);
});

socket.on('Connected Now', function(msg){
	var input_connection = document.getElementById('ConnectedTo');
	//console.log(msg);
	user = msg;
	msg = '<h3> You are not connected to ' + msg + '</h3>';
	input_connection.innerHTML = msg;
	
	refreshUploadView();
	Ready();
	
	
});

function refreshUploadView(){
	var box = document.getElementById('Uploader');
	var template = document.getElementById('upload template');
	box.innerHTML = template.innerHTML;
	
}

function newConnection(){

	user = document.getElementById('m').value;
	if(user !== null){
		socket.emit ('new_transfer', {enduser: user, startuser: connectionid});
	}else{
		console.log('User field is empty');
	}
}


var SelectedFile;
function FileChosen(evnt) {
    SelectedFile = evnt.target.files[0];
    document.getElementById('NameBox').value = SelectedFile.name;
}

var FReader;
var FWriter;
var Name;

function StartUpload(){
    if(document.getElementById('FileBox').value !== "")
    {
        FReader = new FileReader();
        Name = document.getElementById('NameBox').value;
        var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
        Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
        Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
        document.getElementById('UploadArea').innerHTML = Content;
        console.log(user);
        FReader.onload = function(evnt){
            socket.emit('Upload', { 'Name' : Name, Data : evnt.target.result, 'User': user });
        }
        socket.emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size, 'User': user });
    }
    else
    {
        alert("Please Select A File");
    }
}
var SelectedFile;
socket.on('MoreData', function (data){
    UpdateBar(data['Percent'], data['Size']);
    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
    var NewFile; //The Variable that will hold the new Block of Data
    if(SelectedFile.slice) 
        NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
    else
        NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
    FReader.readAsBinaryString(NewFile);
});

function downloadSection(Name ){
	
	//Name = document.getElementById('NameBox').value;
    var Content = "<span id='NameArea'>Downloading " +  Name + "</span>";
    Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
    Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + "MB</span>";
    document.getElementById('UploadArea').innerHTML = Content;
}

socket.on('New Download', function(data){
	downloadSection(data['Name']);
	UpdateBar(data['Percent'], data['Size']);
});

var download_data;
socket.on('New Data', function (data){
	
    UpdateBar(data['Percent'], data['Size']);
    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
    download_data = data['Data'];
    console.log('Downloading new Data');
});

socket.on('Final Data', function (data){
	
    UpdateBar(data['Percent'], data['Size']);
    var Place = data['Place'] * 524288; //The Next Blocks Starting Position
    download_data = data['Data'];
    var Content = "File " + data['Name'] + " Successfully  Downloaded !!"
     Content += "<br><br><a id  = 'downloadfile' href='javascript:onDownload();'>Download</a>";
    Content += "<br><br><button  type='button' name='Upload' value='' id='Restart' class='Button'>Upload A File</button>";
    document.getElementById('UploadArea').innerHTML = Content;
    document.getElementById('Restart').addEventListener('click', Refresh);
    console.log('Downloaded new Data');
    
});

function onDownload() {
	var File
	var data = new Blob([download_data], {type: 'application/octet-binary'});
	if (File !== null) {
	      window.URL.revokeObjectURL(File);
	  }

	 File = window.URL.createObjectURL(data);
	var a = document.getElementById('downloadfile'); 
	  a.href =  File;

	
}

socket.on('Done', function (data){
    var Content = "File Successfully Uploaded !!"
    Content += "<br><br><button  type='button' name='Upload' value='' id='Restart' class='Button'>Upload Another</button>";
    document.getElementById('UploadArea').innerHTML = Content;
    document.getElementById('Restart').addEventListener('click', Refresh);
});

socket.on('new file', function(data){
	
});

function Refresh(){
    location.reload(true);
}
 
function UpdateBar(percent, size){
    document.getElementById('ProgressBar').style.width = percent + '%';
    document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
    var MBDone = Math.round(((percent/100.0) * size) / 1048576);
    document.getElementById('MB').innerHTML = MBDone;
}

//window.addEventListener("load", Ready); 

function Ready(){ 
    if(window.File && window.FileReader){ //These are the relevant HTML5 objects that we are going to use 
        document.getElementById('UploadButton').addEventListener('click', StartUpload);  
        document.getElementById('FileBox').addEventListener('change', FileChosen);
    }
    else
    {
        document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
    }
}

