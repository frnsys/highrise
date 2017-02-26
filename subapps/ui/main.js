import '~/css/reset.sass';
import './ui.sass';
import $ from 'jquery';
import _ from 'underscore';
import io from 'socket.io-client';

console.log("I'm a lil ui! whee");

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


$(function() {

  $("#users .button").click((event) => {
    $(event.currentTarget).toggleClass("selected");
  });

  $("#actions .button").click((event) => {
    console.log($(event.currentTarget).attr("id"));
    $("#users .button.selected").each((i, e) => {
      console.log($(e).attr("id"));
    });

    var s=""
    s += $(event.currentTarget).attr("id");
    $("#users .button.selected").each((i, e) => {
      s += $(e).attr("id");
    });

    socket.emit('broadcast', {'data': s});

    // TODO: make compatible and do bidirectional communication

    console.log(s)


  });
});

