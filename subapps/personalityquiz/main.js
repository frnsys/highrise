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


var clearInput = function() {
	$("input[type=radio]:checked").prop("checked", false)
	$(".text_question input").val("");
}

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


/*******************************/
/* WRITE QUESTIONS HEREEE */////
/*******************************/

/*


*Human being personality axes:*

openness
conscientiousness
extraversion
agreeableness
neuroticism


|
|
|
V



*PartyGoer.js personality axes: *

bladder tolerance
conversation tolerance




*/

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
	"type": "likert",
	"qid": "self_discomfort",
	"question": "You enjoy talking about issues that make yourself uncomfortable.",
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
  	clearInput();
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
    data.time = {'mode': 'personality_quiz', 'value': moment().format() };
    data.quizResults = allResults;

    // send data
	socket.emit('broadcast', data);

	clearInput();
    check_and_disable_cancelconfirm();
  });


});

