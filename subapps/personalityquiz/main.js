import '~/css/reset.sass';
import './personalityquiz.sass';
import $ from 'jquery';
import _ from 'lodash';
import io from 'socket.io-client';
import moment from 'moment';
import Question from './Question';


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


$(function() {

	var allQuestions = [];


	/*
	addTextQuestion("#questions", "name", "What's your name?");
  addLikertQuestion("#questions", "dogs_over_cats", "I prefer dogs over cats.");
  addLikertQuestion("#questions", "meeting_cancel_elated",  "You feel secretly elated when a meeting is canceled.");
  addLikertQuestion("#questions",  "self_discomfort", "You enjoy talking about issues that make yourself uncomfortable.");
  addMultipleChoiceQuestion("#questions", "small_talk_topic", "What's your favorite small-talk topic?", [
		"The weather and global warming",
		"The latest in blockchain technology",
		"Gentrification in Brooklyn",
		"A critique of Jacobin Magazine"]);
*/

/*******************************/
/* WRITE QUESTIONS HEREEE */////
/*******************************/

  allQuestions.push(new Question({
	"type": "text",
	"qid": "name",
	"question": "What's your name?"
   }))


  allQuestions.push(new Question({
	"type": "likert",
	"qid": "meeting_cancel_elated",
	"question": "You feel secretly elated when a meeting is canceled.",
	"func": function(ans) { return {'openness': 100 * ans} }
   }))


  allQuestions.push(new Question({
	"type": "likert",
	"qid": "dogs_over_cats",
	"question": "I prefer dogs over cats.",
	"func": function(ans) { return {'openness': 20 * ans} }
   }))


  allQuestions.push(new Question({
	"type": "multipleChoice",
	"qid": "small_talk_topic",
	"question": "What's your favorite small-talk topic?",
	"answers": {
		"The weather and global warming": ["#weather_convo#"],
		"The latest in blockchain technology": ["#blockchain#", "#silicon_valley#"],
		"Gentrification in Brooklyn": ["#real_estate#", "#race#"],
		"A critique of Jacobin Magazine": ["#radical#", "#twitter#"]
	},
   }))


  allQuestions.push(new Question({
	"type": "multipleChoice",
	"qid": "small_talk_topic2",
	"question": "What's your second-favorite small-talk topic?",
	"answers": {
		"Memes and whether or not they are inherently political": ["#political_memes#"],
		"test": ["#blockchain#", "#silicon_bbbvalley#"],
		"Gentrification in Brooklyn": ["#real_estddate#", "#raccce#"],
		"A critique of Jacobin Magazine": ["#radiee3cal#", "#twi33tter#"]
	},
   }))

/*******************************/
/* END    QUESTIONS HEREEE */////
/*******************************/


  _.each(allQuestions, function(q) {
	  $("#questions").append(q.getHtml());
  })




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

	  var allResults = Question.mergeResults(_.map(allQuestions, function(q) {
		  return q.getResult();
	  }));

	  console.log(allResults);

////

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

