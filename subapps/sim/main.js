import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import io from 'socket.io-client';
import log from 'loglevel';
window.log = log; // 4 debugging: do something like log.setlevel('info');

import UI from '~/app/UI/UI';
import ObjektDesigner from '~/app/UI/ObjektDesigner';
import Scene from '~/app/Scene';
import World from '~/app/World';
import Layout from '~/app/Layout';
import EventSystem from '~/app/Event';

import '~/css/reset.sass';
import './sim.sass';
import PartyGoer from './PartyGoer';
import floorLayouts from './floorLayouts';
import SocialNetwork from './SocialNetwork';

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
  console.log(data);
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
    coord: {x: 0, y: 0},
    talking: [],
    boredom: 0,
    sociability: -1
  }, world),
  new PartyGoer('Alice', {
    bladder: 100,
    hunger: 0,
    thirst: 0,
    bac: 0,
    coord: {x: 0, y: 0},
    talking: [],
    boredom: 0,
    sociability: 2
  }, world),
];

world.socialNetwork.addEdge(agents[0].id, agents[1].id, {affinity: 10});

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
  }
}
run();
log.setLevel('info');


