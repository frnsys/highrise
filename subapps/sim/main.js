import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import io from 'socket.io-client';
import log from 'loglevel';
window.log = log; // 4 debugging: do something like log.setLevel('info');

import UI from '~/app/UI/UI';
import ObjektDesigner from '~/app/UI/ObjektDesigner';
import Scene from '~/app/Scene';
import World from '~/app/World';
import Layout from '~/app/Layout';
import EventSystem from '~/app/Event';
import Dialogue from '~/app/Dialogue';

import '~/css/reset.sass';
import './sim.sass';
import PartyGoer from './PartyGoer';
import floorLayouts from './floorLayouts';
import SocialNetwork from './SocialNetwork';
import Chart from './Chart';
import Util from './Util';
import SimulationScreen from './SimulationScreen';

import first_names from './data/name_given_sex.json';
import last_names from './data/surname_given_race.json';

var agents = [];
//for debuggin
window.agents = agents;
window.Dialogue = Dialogue;
window._ = _;
window.$ = $;


// event system example
// EventSystem.subscribe('foo', function(d) {
//   console.log('foo with');
//   console.log(d);
// });
// EventSystem.publish('foo', {hey: 'there'});

const cellSize = 0.5;
const scene = new Scene('#stage');
const world = new World(cellSize, scene);

// handle messaging
var socket = io();
socket.on('message', function(data) {


  function broadcastAgentUpdate() {
    socket.emit('broadcast', { 'sender': 'sim', 'dataResponse': 'agentUpdate', 'data': _.map(agents, function(a) { return a.id; }) });
  }

  // if ui needs to update its list of agents
  if('dataRequest' in data && data['dataRequest'] == 'agentUpdate') {
    broadcastAgentUpdate();
  }

  // if ui sends a message
  if('sender' in data && data['sender'] == 'ui') {
    _.each(data.users, (user) => {
      var thisAgent = _.find(agents, (o) => { return o.id == user });
      thisAgent.queuedAction = data.action; //queue up action
      thisAgent.state.timeout = 0; // so they respond immediately
    });
  }

  // if personality quiz adds a new member
  if('sender' in data && data['sender'] == 'personalityquiz') {
    console.log("adding new agent " + data.quizResults.name);
    var thisAgent = new PartyGoer(data.quizResults.name, {
       bladder: 100,
       hunger: 0,
       thirst: 0,
       bac: 0,
       coord: {x: 10, y: 10},
       talking: [],
       boredom: 0,
       sociability: 2,
       topicPreference: [-1, -1]
     }, world)
    //  user spawned when personality quiz happens
    agents.push(thisAgent)
    thisAgent.spawn(world, thisAgent.state.coord, floors[0], 0xff33ff)
    world.agents[thisAgent.id] = thisAgent
    broadcastAgentUpdate();
  }
});


// birth the world
var floorHeight = 3;
var floors = _.map(floorLayouts.onelargefloor, (layout, i) => {
  return world.addFloor(
    layout,
    new THREE.Vector3(0,i*floorHeight,0),
    {
      'A': {
        'tags': ['food'],
        'props': {}
      },
      'B': {
        'tags': ['alcohol'],
        'props': {}
      },
      'C': {
        'tags': ['water'],
        'props': {}
      },
      'D': {
        'tags': ['bathroom'],
        'props': {}
      },
      'P': {
        'tags': ['portal'],
        'props': {}
      },
    }
  );
});
//world.addStairs(floors[0], floors[1], new THREE.Vector2(1,3), 6, 2);

// change the world
const ui = new UI(world);
const designer = new ObjektDesigner(cellSize, ui);

world.socialNetwork = new SocialNetwork();

/*test to try out a lot of people************/
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

for(var i = 0; i < 10; i++) {
  var gender = _.sample(Object.keys(first_names));
  var race = _.sample(Object.keys(last_names));
  var first = _.sample(Object.keys(first_names[gender]));
  var last = _.sample(Object.keys(last_names[race]));
	agents.push(new PartyGoer(toTitleCase(`${first} ${last}`), {
    bladder: _.random(100),
    hunger: _.random(100),
    thirst: _.random(100),
    bac: 0,
    coord: {x: _.random(10, 30), y: _.random(10,30)},
    talking: [],
    boredom: 0,
    sociability: _.random(10),
    impatience: _.random(10),
    metabolism: _.random(10),
    tolerance: _.random(10),
    impulsiveness: _.random(10),
    topicPreference: [_.random(-1, 1), _.random(-1,1)]
  }, world))
}

var colors = [0xff0000, 0x0000ff];

function randomColor() {
	var hex = Math.floor( Math.random() * 0xFFFFFF );
	return hex
}

agents.map((a, i) => {
  a.spawn(world, a.state.coord, floors[0], randomColor());
});

world.socialNetwork.addEdge(agents[0].id, agents[1].id, {affinity: 10});
world.agents = _.reduce(agents, (acc, a) => {
  acc[a.id] = a
  return acc;
}, {});

var charts = Util.getParameterByName('charts') == 'true' ? agents.map(a => new Chart(a)) : [];

if(Util.getParameterByName('webcam') == 'true') {
  var thisSimulationScreen = new SimulationScreen();
  thisSimulationScreen.initWebcam();
  thisSimulationScreen.initScreen(scene.scene);
}

log.setLevel('error');


// boot the world
var clock = new THREE.Clock();
var elapsedFrames = 0;
function run() {
  requestAnimationFrame(run);
  var delta = clock.getDelta();
  // every other frame so we only render at 30fps
  if (delta < 0.5 && elapsedFrames % 2 == 0) {
      scene.render();
    // if the delta is really large,
    // (i.e. when the tab loses focus)
    // agents will take very large steps
    // and can end up off the map
    // so just ignore large deltas

    _.each(agents, a => {
      var result = a.update(delta)
      if('message' in result) { socket.emit('broadcast', result.message); } // when we have a message to send, send it! the Story subapp should capture this.
    });
    _.each(charts, c => c.update());
    ui.update();
		if(typeof(thisSimulationScreen) !== "undefined") { thisSimulationScreen.update(); }
  }
  elapsedFrames++;
}
run();
log.setLevel('error');
