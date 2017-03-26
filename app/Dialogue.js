import $ from 'jquery';
import _ from 'underscore';
import tracery from 'tracery-grammar';
import DialogueScoreSpace from '~/app/DialogueScoreSpace';


var Dialogue = {};

Dialogue.grammar = tracery.createGrammar({
    'animal': ['panda','fox','capybara','iguana'],
    "emotion_mellowly" : "thoughtfully sadly slowly reflectively morosely gently quietly calmly tenderly".split(" "),
    "emotion_upbeat" : "happy sad reflective morose proud".split(" "),
    "emotion_anticipation" : "nervous excited curious hesitant annoyed grumpy tired".split(" "),
    "kinda-really": ["kinda", "somewhat", "maybe", "just a little", "very", "ridiculously", "totally", "really"],
    
    "talk_verb": "chatting|gabbing|speaking|talking|shooting the shit".split("|"),

    'feeling':'like|hate|impassioned|disturbed'.split("|"),
    'superlatives': 'best|pretty okay|not bad|worst'.split("|"),
    'surprised': "OMG|Holy shit|Wow|You aren't gonna believe it but".split("|"),
    'topics': 'Justin Bieber|Chino Kim|Joi Ito|Calvin Klein|Jake Tapper|Glenn Greenwald|Trump'.split("|"),
    'weather': 'snow|rain|cloudy day|sunshine'.split("|"),
    "material": 'pic|selfie|text|tweet'.split("|"),

    "talk_greetings": ["#greetings#!"],
    'greetings': 'Yo Sup Hey Hello'.split(" "),

    "talk_normal": ["How's the #topics# project going?"],
    'talk_medium': ["Wow I can't believe that happened"],
    'talk_gossip_tech': ["Wow I can't believe #topics# did that in front of everybody at the office!"],
    'talk_dating': ["We broke up"],
    'talk_weather_tech': ["The cloud cover today is unprecedented"],
    'talk_weather_feeling': ["The weather makes me want to die"],
    'talk_insult': ["F U bro"],
    'talk_normal_tech': ["How's the #topics# project going?"],

    "eat": ["I'm #kinda-really# hungry. I'm eating."],

    'drink_alcohol':['I am #drinking_emotions# drinking from a #drinking_size# #drinking_vessel# of #drinking_alcohol#.'],
    "drinking_size": "thimble-sized large huge ample generous tiny petite".split(" "),
    "drinking_vessel": "bottle cup mug flask flagon".split(" "),
    "drinking_alcohol": "wine tequila beer cider".split(" "),
    "drinking_emotions": ["#emotion_mellowly#"],
    
    'drink_water':['I am #drinking_emotions# drinking from a #drinking_size# #drinking_vessel# of #drinking_water#.'],
    "drinking_water": ["smartwater", "tapwater", "#seltzer#"],
    "seltzer": ["la croix", "perrier"],

    'bathroom':["I'm a little busy #bathroom_activity#."],
    'bathroom_activity': ["taking a shit", "doing number two", "taking a piss", "adjusting my hair", "taking some deep breaths in a toilet stall by myself", "checking my phone while pretending to take a shit", "dropping some kids off at the pool", "answering the call of nature"],

    'entered':["I #entered_arrival#. I'm #kinda-really# #emotion_anticipation#."],
    "entered_arrival": ["just got here", "arrived", "am finally at the party"],

    'left':['The party was #kinda-really# #party_review#. I just had to #left_leave#.'],
    'party_review': 'boring exciting ho-hum fun weird uncomfortable'.split(' '),
    'left_leave': ['do an Irish goodbye', 'head home', 'go to my next party of the night', 'take a walk by myself', 'grab a bite to eat', 'escape from society']
});


// scores can be floats, too, and you can have multiple topics with the same score
Dialogue.talkScores = new DialogueScoreSpace([
  { "score": [-1, -1], "topic": "#talk_greetings# how's it going" },
  { "score": [-1,0.5], "topic": "#talk_dating#" }, 
  { "score": [-1,0.3], "topic": "#talk_insult#" }, 
  { "score": [-1,  1], "topic": "#talk_sexlife#" }, 
  { "score": [ 0, -1], "topic": "#talk_weather_tech#" }, 
  { "score": [ 0,  0], "topic": "#talk_weather_feeling#" }, 
  { "score": [ 1, -1], "topic": "#talk_geekily_tech#" }, 
  { "score": [ 1,  0], "topic": "#talk_normal_tech#" }, 
  { "score": [ 1,  1], "topic": "#talk_industry_tech#" },
  { "score": [ 1,  1], "topic": "#talk_gossip_tech#" } 
]);



    // [1, -1]                              [1, 0]                                      [1, 1]
    // Highly technical & Not personal      Highly technical & Somwhat personal         Highly technical & Highly personal
    // Blockchain                           Tech company news                           Company internal arguments

    // [0, -1]                              [0,0]                                       [0, 1]
    // Somewhat technical & Not personal    Somewhat technical & Somewhat personal      Somewhat technical & Highly personal
    // Weather, getting technical           Weather, with feelings          

    // [-1, -1]                             [-1,0]                                      [-1, 1]
    // Not technical & Not personal         Not technical & Somewhat personal           Not technical & Highly personal 
    // greetings                            Boy/girl friend drama                       Insults/arguments

Dialogue.createDialogue = function(agent, action, actiontopic) {
    var _actionTopic = action.topic;

    if(_actionTopic) {
        var topic = Dialogue.talkScores.findWithThreshold(_actionTopic, 0.5).topic;
        return Dialogue.grammar.flatten(topic);
    }
};


export default Dialogue;


