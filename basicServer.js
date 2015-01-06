/*global require, __dirname, console*/
var express = require('express'),
    bodyParser = require('body-parser'),
    errorhandler = require('errorhandler'),
    morgan = require('morgan'),
    net = require('net'),
    N = require('./nuve'),
    fs = require("fs"),
    https = require("https"),
        config = require('./../../licode_config');
var swig = require('swig');

var options = {
    key: fs.readFileSync('cert/key.pem').toString(),
    cert: fs.readFileSync('cert/cert.pem').toString()
};

var app = express();

// app.configure ya no existe
"use strict";
app.use(errorhandler({
    dumpExceptions: true,
    showStack: true
}));
app.use(morgan('dev'));
// assign the template engine to .html files
app.engine('html', swig.renderFile);

// set .html as the default extension
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//app.set('views', __dirname + '/../views/');
//disable layout
//app.set("view options", {layout: false});

N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, 'http://localhost:3000/');

var myRoom;
var rooms_;

N.API.getRooms(function(roomlist) {
    "use strict";
    var rooms = JSON.parse(roomlist);
    console.log(rooms.length);
    if (rooms.length === 0) {
        N.API.createRoom('myRoom', function(roomID) {
            myRoom = roomID._id;
            console.log('Created room ', myRoom);
        });
    } else {
        myRoom = rooms[0]._id;
        console.log('Using room ', myRoom);
    }
});

var room1_, room2_, audioroom1_, audioroom2_, screensharing_, screensharingaudio_, classroom_;

N.API.getRooms(function(roomlist) {
    "use strict";
    rooms_ = JSON.parse(roomlist);
    console.log('get room', rooms_.length);
    for(var room in rooms_) {
        var room_ = rooms_[room];
        console.log(room_);
        if(room_['name'] === 'Room1') {
            room1_ = room_._id;
            room_.type = 'videoconference';
        } else if(room_['name'] === 'Room2') {
            room2_ = room_._id;
            room_.type = 'videoconference';
        } else if(room_['name'] === 'AudioRoom1') {
            audioroom1_ = room_._id;
            room_.type = 'audioconference';
        } else if(room_['name'] === 'AudioRoom2') {
            audioroom2_ = room_._id;
            room_.type = 'audioconference';
        } else if(room_['name'] === 'ScreenSharing') {
            screensharing_ = room_._id;
            room_.type = 'screen';
        } else if(room_['name'] === 'ScreenSharingAudio') {
            screensharingaudio_ = room_._id;
            room_.type = 'screenaudio';
        } else if(room_['name'] === 'ClassRoom') {
            classroom_ = room_._id;
            room_.type = 'classroomaudio';
        }
    }
});


app.get('/getRooms/', function(req, res) {
    "use strict";
    N.API.getRooms(function(rooms) {
        res.send(rooms);
    });
});

app.get('/getUsers/:room', function(req, res) {
    "use strict";
    var room = req.params.room;
    N.API.getUsers(room, function(users) {
        res.send(users);
    });
});


app.post('/createToken/', function(req, res) {
    "use strict";
    var room = myRoom,
        username = req.body.username,
        role = req.body.role;
    console.log('xjma createToken', username, role);
    N.API.createToken(room, username, role, function(token) {
        console.log(token);
        res.send(token);
    });
});

app.get('/room/:roomid', function(req,res) {
    var roomid = req.param('roomid');
    var room_type;

    for(var room in rooms_) {
        var room_ = rooms_[room];
        if(room_._id === roomid) {
            room_type = room_.type;
            console.log(room_type);
            break;
        }
    }

    res.render('room', {room_type: room_type});
});


app.get('/', function(req,res) {
    res.render('rooms', { room1: room1_, room2: room2_, audioroom1: audioroom1_, audioroom2: audioroom2_,
        screensharing: screensharing_, screensharingaudio: screensharingaudio_, classroom: classroom_ });
});

app.post('/token/', function(req, res) {
    "use strict";
    
    var username = req.body.username,
        role = req.body.role,
        room_id = req.body.roomId;
        
    //var room = myRoom;
    
    console.log('pony get token', username, role, room_id);
    N.API.createToken(room_id, username, role, function(token) {
        console.log(token);
        res.send(token);
    });
});


app.use(function(req, res, next) {
    "use strict";
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'origin, content-type');

    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
	console.log('********** filter');
        next();
    }
});



app.listen(80);

var server = https.createServer(options, app);
server.listen(443);
