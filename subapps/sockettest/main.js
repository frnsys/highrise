import $ from 'jquery';
import _ from 'underscore';
import io from 'socket.io-client';


console.log("scokettesfddtc");

var socket = io();

socket.on('message', function(data) {
  console.log(data);
});

window.test = function() {
  socket.emit('echo', {'data': 'foo!'});
}

window.test2 = function() {
  socket.emit('broadcast', {'data': 'foo!'});
}


window.socket = socket;
