import $ from 'jquery';
import _ from 'lodash';
import tracery from 'tracery-grammar';
import DialogueScoreSpace from '~/app/DialogueScoreSpace';


var Dialogue = {};

Dialogue.rawGrammar = {

  //////////////
  /* HELPERS */
  //////////////
  //
    'bathroom_activity': ["take a shit", "do number two", "take a piss", "adjust my hair", "takd some deep breaths in a toilet stall by myself", "check my phone while pretending to take a shit", "dropp some kids off at the pool", "answer the call of nature"],

    "drinking_size": "thimble-sized large huge ample generous tiny petite".split(" "),
    "drinking_vessel": "bottle cup mug flask flagon".split(" "),
    "drinking_alcohol": "wine tequila beer cider".split(" "),
    "drinking_emotions": ["#emotion_mellowly#"],
    
    "drinking_water": ["smartwater", "tapwater", "#seltzer#"],
    "seltzer": ["la croix", "perrier"],

    "entered_arrival": ["just got here", "arrived", "am finally at the party"],

    'party_review': 'boring exciting ho-hum fun weird uncomfortable'.split(' '),
    'left_leave': ['do an Irish goodbye', 'head home', 'go to my next party of the night', 'take a walk by myself', 'grab a bite to eat', 'escape from society'],

    'animal': ['panda','fox','capybara','iguana'],
    "emotion_mellowly" : "thoughtfully sadly slowly reflectively morosely gently quietly calmly tenderly".split(" "),
    "emotion_upbeat" : "happy sad reflective morose proud".split(" "),
    "emotion_anticipation" : "nervous excited curious hesitant annoyed grumpy tired".split(" "),
    "kinda-really": ["kinda", "somewhat", "maybe", "just a little", "very", "ridiculously", "totally", "really"],
    
    "talking": "chatting|gabbing|speaking|talking|shooting the shit".split("|"),

    'feeling':'like|hate|impassioned|disturbed'.split("|"),
    'superlatives': 'best|pretty okay|not bad|the worst'.split("|"),
    'surprised': "OMG|Holy shit|Wow|You aren't gonna believe it but".split("|"),
    'topics': 'Justin Bieber|Chino Kim|Joi Ito|Calvin Klein|Jake Tapper|Glenn Greenwald|Trump'.split("|"),
    'weather': 'snow|rain|cloudy day|sunshine'.split("|"),
    "material": 'pic|selfie|text|tweet'.split("|"),

    "talk_greetings": ["#greetings#!"],
    'greetings': 'Yo Sup Hey Hello'.split(" "),


  //////////////
  /* THOUGHTS */
  //////////////
  // "bathroom" / "eat" / "drink_alcohol" / "drink_water" --- from PartyGoer.js ACTIONS
    "eat": ["I'm #kinda-really# hungry.I'm eating."],
    'bathroom':["I gotta #bathroom_activity#."],
    'drink_alcohol':["I'm #drinking_emotions# drinking from a #drinking_size# #drinking_vessel# of #drinking_alcohol#. .. this tastes #superlatives#"],
    'drink_water':['I am #drinking_emotions# drinking from a #drinking_size# #drinking_vessel# of #drinking_water#.'],
    'entered':["I #entered_arrival#. I'm #kinda-really# #emotion_anticipation#."],
    'left':['The party was #kinda-really# #party_review#. I just had to #left_leave#.'],

    'gawk_exclamation': 'Whoa|Cool|Hey|Hmm'.split('|'),
    'gawk_punctuation': '!|?|!!|?!|??|.'.split('|'),
    'gawk_person_feeling': 'cute|#emotion_mellowly# talking together|interesting|weird!|funny|#emotion_anticipation#-looking|sad-looking - I wish I could cheer them up.'.split('|'),
    'gawk_activity': 'talking to each other|drinking|dancing|checking their phones|meeting new people'.split('|'),
    'gawk':['#gawk_exclamation#, look at them.', 'So this is a simulation#gawk_punctuation#', "Why aren't they #gawk_activity# more?",
      "Our simulated selves are #kinda-really# #gawk_person_feeling#"],


    // this is here to kick-off talking sometimes
    "talk": ["#talk_normal#", '#talk_medium#', '#talk_gossip_tech#', '#talk_dating#', '#talk_weather_tech#', '#talk_weather_feeling#', '#talk_insult#', '#talk_normal_tech#'],

  //////////////
  /* DIALOGUE */
  ////////////// 
  // there should be one score below for each line here
    "talk_normal": ["How's the #topics# project going?"],
    'talk_medium': ["Wow I can't believe that happened"],
    'talk_gossip_tech': ["Wow I can't believe #topics# did that in front of everybody at the office!"],
    'talk_dating': ["We broke up"],
    'talk_weather_tech': ["The cloud cover today is unprecedented"],
    'talk_weather_feeling': ["The weather makes me want to die"|"I'm kind of worried aboug global warming"],
    'talk_insult': ["#talk_insult_variants#, #diminutive#"],
    'talk_compliment': ["#talk_compliment_variants#, #augmentive#", "Looking pretty #talk_compliment_variants#",
      "I like your smile!", "Your ideas are intriguing to me and I wish to subscribe to your newsletter."],
    'talk_sexlife': ["#talk_sexlife_theory#", "#talk_sexlife_personal#"],
    'talk_industry_tech': "Did you see that new article on Hacker News?",
    'talk_normal_tech': "What's the wifi password here?", 
    'talk_geekily_tech': "Obviously, #editors# is the superior text editor.",

    'talk_insult_variants': "WTF|F U|Out of my way|Shut up".split("|"),
    'talk_compliment_variants': "sharp|happy|snazzy".split("|"),
    'talk_sexlife_theory': ["So I've been reading the History of Sexuality lately.."],
    'talk_sexlife_personal': ["TMI I know, but wanna talk about rectal discharge?"],
    
    'editors': "vi|neovim|emacs|spacemacs|atom|Sublime".split("|"),
    'diminutive': "bro|asshole".split("|"),
    'augmentive': "friend|stranger|buddy|pal".split("|")
}

Dialogue.grammar = tracery.createGrammar(Dialogue.rawGrammar);


// scores can be floats, too, and you can have multiple topics with the same score
Dialogue.talkScores = new DialogueScoreSpace([
  // score: [technical, personal]
  { "score": [-1, -1], "grammar": "#talk_greetings# How's it going?" },
  { "score": [-1,0.5], "grammar": "#talk_dating#" }, 
  { "score": [-1,0.3], "grammar": "#talk_insult#" }, 
  { "score": [-1,0.4], "grammar": "#talk_compliment#" }, 
  { "score": [-1,  1], "grammar": "#talk_sexlife#" }, 
  { "score": [ 0, -1], "grammar": "#talk_weather_tech#" }, 
  { "score": [ 0,  0], "grammar": "#talk_weather_feeling#" }, 
  { "score": [ 1, -1], "grammar": "#talk_geekily_tech#" }, 
  { "score": [ 1,  0], "grammar": "#talk_normal_tech#" }, 
  { "score": [ 1,  1], "grammar": "#talk_industry_tech#" },
  { "score": [ 1,  1], "grammar": "#talk_gossip_tech#" } 
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

Dialogue.createDialogue = function(agent, action) {
  if(action.topic) {
    var topicGrammar = "";
    if("convo_topics" in agent && (_.random(0, 1, true) < 0.5)) {
      topicGrammar = _.sample(agent.convo_topics);
    } else {
      topicGrammar = Dialogue.talkScores.findWithThreshold(action.topic, 0.5).grammar;
    }
    return Dialogue.grammar.flatten(topicGrammar);
  }
};

Dialogue.createThought = function(agent, action) {
  // bathroom / eat / drink_alcohol / drink_water / bathroom - constants from PartyGoer.ACTIONS
  console.log(action);
  if(action.name) {
    console.log(action.name)
    return "(" + Dialogue.grammar.flatten("#" + action.name + "#") + ")";
  }
};


export default Dialogue;


