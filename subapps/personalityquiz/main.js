import '~/css/reset.sass';
import './personalityquiz.sass';
import $ from 'jquery';
import _ from 'underscore';
import io from 'socket.io-client';
import moment from 'moment';


var socket = io();
window.socket = socket; // fer debugging
socket.on('message', function(data) {
  console.log(data);
});

var check_and_disable_cancelconfirm = () => {

	var nonemptyText = $('.text_question input[type="text"]').filter(function () {
    return this.value.length > 0
	}).length;
	var nonemptyLikert = $(".likert_question input:checked").length; 
	var nonemptyMultiple = $(".multiple_choice_question input:checked").length; 

if ((nonemptyText + nonemptyLikert + nonemptyMultiple) == $(".question").length) {
 		$("button#confirm").removeAttr("disabled"); 
	} else {
		$("button#confirm").attr("disabled", "disabled"); 
	}

if ($(".question").length) {
 		$("button#cancel").removeAttr("disabled"); 
	} else {
		$("button#cancel").attr("disabled", "disabled"); 
	}


}

var addTextQuestion = (elem, name, question) =>  {
	$(elem).append(''
+'   <div class="text_question question">'
+'    <div class="statement">' + question + '</div> '
+'			<input type="text" name="' + name + '" required />'
+'    </div>'
+'   </div>');
}

var addLikertQuestion = (elem, name, question) =>  {
	$(elem).append(''
+'   <div class="likert_question question">'
+'    <div class="statement">' + question + '</div> '
+'			<ul class="options">'
+'				<li class="wider"><input type="radio" name="likert_' + name + '" value="strongly_disagree"><label>Strongly disagree</label></li>'
+'				<li><input type="radio" name="likert_' + name + '" value="disagree"><label>Disagree</label></li>'
+'				<li><input type="radio" name="likert_' + name + '" value="neutral"><label>Neutral</label></li>'
+'				<li><input type="radio" name="likert_' + name + '" value="agree"><label>Agree</label></li>'
+'				<li class="wider"><input type="radio" name="likert_' + name + '" value="strongly_agree"><label>Strongly agree</label></li>'
+'			</ul>'
+'   </div>');
}

var addMultipleChoiceQuestion = (elem, name, question, answers) =>  {
	var mcq_html = ''
+'   <div class="multiple_choice_question question">'
+'    <div class="statement">' + question + '</div> '
+'			<ul class="options">';

	_.each(answers, (ans) => {
		var aname = ans.toLowerCase().replace(/ /g,"_");

		mcq_html += '				<li><input type="radio" name="multiplechoice_' + name + '" value="' + aname + '"><label>' + ans + '</label></li>';
	});

	mcq_html += '			</ul>'
+'   </div>';
	$(elem).append(mcq_html);
}

$(function() {
	addTextQuestion("#questions", "name", "What's your name?");
  addLikertQuestion("#questions", "marshmallow", "You like marshmallows.");
  addLikertQuestion("#questions", "meeting_cancel_elated",  "You feel secretly elated when a meeting is canceled.");
  addLikertQuestion("#questions",  "self_discomfort", "You enjoy talking about issues that make yourself uncomfortable.");
  addMultipleChoiceQuestion("#questions", "small_talk_topic", "What's your favorite small-talk topic?", [
		"The weather and global warming",
		"The latest in blockchain technology",
		"Gentrification in Brooklyn",
		"A critique of Jacobin Magazine"]);


  $("input").change((event) => {
    check_and_disable_cancelconfirm();
  });

  // 'cancel' button
  $("button#cancel").click((event) => {
		$("input[type=radio]:checked").prop("checked", false)
		$(".text_question input").val("")
  });


  // confirm button
  $("button#confirm").click((event) => {

    var data = {};
    data.sender = "personalityquiz";
    data.action = $("#actions .button.selected").attr("id").replace("action_", "");
    data.time = {'mode': 'manual_entry', 'value': moment().format() }
    data.users = [];
		$("#users .button.selected").each((i, e) => {
			data.users.push($(e).attr("id").replace("user_",""));
		});

    // send data
		socket.emit('broadcast', data);

    // show status
    $("#statuses").append("<li>" 
      + moment(data.time.value).format("YYYY MMM Do h:mm:ss a") + " --- " 
      + data.action + " :: " 
      + data.users.join(", ") 
    + "</li>")

    $(".selected").removeClass("selected");
    check_and_disable_cancelconfirm();
  });


});

