import '~/css/reset.sass';
import './ui.sass';
import $ from 'jquery';
import _ from 'underscore';
import io from 'socket.io-client';
import moment from 'moment';

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

var check_and_disable_cancelconfirm = () => {
	if($(".selected").length) { 
		$("button#cancel").removeAttr("disabled"); 
	}  else {
		$("button#cancel").attr("disabled", "disabled"); 
	}
	
	if($("#actions .selected").length) {
 		$("button#confirm").removeAttr("disabled"); 
	}  else {
		$("button#confirm").attr("disabled", "disabled"); 
	}
   
}

var updateStatusScroll = () => {
    $("#statuses").scrollTop($("#statuses")[0].scrollHeight);
}

$(function() {
  check_and_disable_cancelconfirm();

  $("#users .button").click((event) => {
    $(event.currentTarget).toggleClass("selected");
    check_and_disable_cancelconfirm();
  });

  $("#actions .button").click((event) => {
    $("#actions .button").not(event.currentTarget).removeClass("selected");
    $(event.currentTarget).toggleClass("selected");
    check_and_disable_cancelconfirm();
	});

  $("button#cancel").click((event) => {
    $(".selected").removeClass("selected");
    check_and_disable_cancelconfirm();
  });

  $("button#confirm").click((event) => {

    var data = {};
    data.sender = "ui";
    data.action = $("#actions .button.selected").attr("id");
    data.users = [];
    data.dataentry_time = moment().format();


		$("#users .button.selected").each((i, e) => {
			data.users.push($(e).attr("id"));
		});

		socket.emit('broadcast', data);

    $("#statuses").append("<li>" 
      + moment(data.dataentry_time).format("YYYY MMM Do h:mm:ss a") + " --- " 
      + data.action + " :: " 
      + data.users.join(", ") 
    + "</li>")
    updateStatusScroll();

    $(".selected").removeClass("selected");
    check_and_disable_cancelconfirm();
  });



});

