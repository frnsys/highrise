import $ from 'jquery';
import _ from 'lodash';
import io from 'socket.io-client';
import moment from 'moment';

import './personalityquiz.sass';
import Question from './Question';


var socket = io();
window.socket = socket; // fer debugging
socket.on('message', function(data) {
  console.log(data);
});


var clearInput = function() {
	$("input:checked").prop("checked", false)
	$(".text_question input").val("");
}

var check_and_disable_cancelconfirm = () => {

	var nonemptyText = $('.text_question input[type="text"]').filter(function () {
    return this.value.length > 0
	}).length;
	var nonemptyCheckboxes = $(".checkboxes_question").has("input:checked").length; 
	var nonemptyLikert = $(".likert_question input:checked").length; 
	var nonemptyMultiple = $(".multiple_choice_question input:checked").length; 

if ((nonemptyText + nonemptyLikert + nonemptyCheckboxes + nonemptyMultiple) == $(".question").length) {
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
narcissism



careless/easygoingconscientiousness / personal


high walls
social


social ease low
tech & non-personal
tech & personal

social ease high:
tech & non-personal
tech & personal

attitude




|
|
|
V



*PartyGoer.js personality axes: *

bladder tolerance
conversation tolerance

sociability
topic preference




*/

  allQuestions.push(new Question({
	"type": "text",
	"qid": "name",
	"question": "What's your name?"
   }))

  allQuestions.push(new Question({
	"type": "text",
	"qid": "twitter_handle",
	"question": "What's your Twitter handle? (optional)"
   }))

  allQuestions.push(new Question({
	"type": "likert",
	"qid": "meeting_cancel_elated",
	"question": "You feel secretly elated when a meeting is canceled.",
	"func": function(ans) { return {'extraversion': -20 * ans} }
   }))

  allQuestions.push(new Question({
	"type": "likert",
	"qid": "cats_over_dogs",
	"question": "I prefer cats over dogs.",
	"func": function(ans) { return {'openness': -10 * ans, 'extraversion': -10 * ans, 'neuroticism': 10 * ans } }
   }))

  allQuestions.push(new Question({
	"type": "likert",
	"qid": "self_discomfort",
	"question": "You enjoy talking about issues that make yourself uncomfortable.",
	"func": function(ans) { return {'openness': 20 * ans, 'extraversion': 20 * ans, 'agreeableness': 10 * ans } }
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
	"type": "checkboxes",
	"qid": "geek_topic",
	"question": "What topics would you want to geek-out about?",
	"answers": {
		"The latest and freshest Javascript library": ["#javascript_library#"],
		"The latest and freshest literary theory": ["#literary_theory#"],
		"The latest and freshest meme theory": ["#meme_theory#"],
		"The latest and freshest hole-in-the-wall restaurants": ["#restaurants#"],
		"The latest and freshest CRISPR projects": ["#crispr#"],
		"The latest and freshest political gossip": ["#political_gossip#"],
	},
   }))



  allQuestions.push(new Question({
	"type": "multipleChoice",
	"qid": "favorite_test",
	"question": "What's your favorite test?",
	"answers": {
		"The Bechdel test": ["#bechdel_test#"],
		"The Voight-Kampff test": ["#voight_kampff_test#"],
		"The Turing test": ["#turing_test"],
		"The Myers-Briggs Test": ["#myers_briggs_test#"],
		"The Purity Test": ["#purity_test#"]
	},
   }))



/*******************************/
/* END    QUESTIONS HEREEE */////
/*******************************/


  _.each(allQuestions, function(q) {
	  $("#questions").append(q.getHtml());
  })

  // FOR DEBUGGINg
  $("#question_name input").val("Dan"); 
  $("#question_twitter_handle input").val("dantaeyoung"); 
  $("input").prop("checked", "checked");
  check_and_disable_cancelconfirm();
//

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

    var data = {};
    data.sender = "personalityquiz";
    data.time = {'mode': 'personality_quiz', 'value': moment().format() };
    data.quizResults = allResults;

    // send data
		socket.emit('broadcast', data);

		$("#twitterprofile").attr("src", "https://twitter.com/" + allResults.twitter_handle + "/profile_image?size=original");
		$("#personname").html(allResults.name);
		$("#thankyou").fadeIn(1000);

  });

	$("button#thankyoumessage").click(function() {
		clearInput();
    check_and_disable_cancelconfirm();
		$("#thankyou").fadeOut(1000);
	})	


});

