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

// event system example
// EventSystem.subscribe('foo', function(d) {
//   console.log('foo with');
//   console.log(d);
// });
// EventSystem.publish('foo', {hey: 'there'});

const cellSize = 0.5;
const scene = new Scene('#stage');
const world = new World(cellSize, scene);

// handle messaging TODO: flesh out
var socket = io();
socket.on('message', function(data) {
  if('sender' in data && data['sender'] == 'ui') {
    console.log(data);
    _.each(data.users, (user) => {
      var thisAgent = _.find(agents, (o) => { return o.id == user });
      thisAgent.queuedAction = data.action; //queue up action
    });
  }
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
    // TODO: this could perhaps be better
    thisAgent.spawn(world, thisAgent.state.coord, floors[0], 0xff33ff)
    agents.push(thisAgent)
    console.log(world.agents)
    world.agents[thisAgent.id] = thisAgent
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
    }
  );
});
//world.addStairs(floors[0], floors[1], new THREE.Vector2(1,3), 6, 2);

// change the world
const ui = new UI(world);
const designer = new ObjektDesigner(cellSize, ui);

world.socialNetwork = new SocialNetwork();

var agents = [
  new PartyGoer('Bob', {
    bladder: 100,
    hunger: 0,
    thirst: 0,
    bac: 0,
    coord: {x: 2, y: 10},
    talking: [],
    boredom: 0,
    sociability: -1,
    topicPreference: [-1, -1]
  }, world),
  new PartyGoer('Alice', {
    bladder: 100,
    hunger: 0,
    thirst: 0,
    bac: 0,
    coord: {x: 4, y: 10},
    talking: [],
    boredom: 0,
    sociability: 2,
    topicPreference: [-1, -1]
  }, world),
  // new PartyGoer('Doug', {
  //   bladder: 100,
  //   hunger: 0,
  //   thirst: 0,
  //   bac: 0,
  //   coord: {x: 4, y: 10},
  //   talking: [],
  //   boredom: 0,
  //   sociability: 2,
  //   topicPreference: [-1, -1]
  // }, world),
  // new PartyGoer('Jeff', {
  //   bladder: 100,
  //   hunger: 0,
  //   thirst: 0,
  //   bac: 0,
  //   coord: {x: 4, y: 10},
  //   talking: [],
  //   boredom: 0,
  //   sociability: 2,
  //   topicPreference: [-1, -1]
  // }, world),
  // new PartyGoer('Maureen', {
  //   bladder: 100,
  //   hunger: 0,
  //   thirst: 0,
  //   bac: 0,
  //   coord: {x: 4, y: 10},
  //   talking: [],
  //   boredom: 0,
  //   sociability: 2,
  //   topicPreference: [-1, -1]
  // }, world)
];

//for debuggin
window.agents = agents;
window.Dialogue = Dialogue;
window._ = _;

var colors = [0xff0000, 0x0000ff];
agents.map((a, i) => {
  a.spawn(world, a.state.coord, floors[0], colors[i]);
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
function run() {
  requestAnimationFrame(run);
  scene.render();
  var delta = clock.getDelta();
  if (delta < 0.5) {
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
}
run();
log.setLevel('error');
