import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
// import UI from './app/UI';
import Scene from './app/Scene';
import World from './app/World';
import Agent from './app/Agent';
// import Objekt from './app/Objekt';
import PF from 'pathfinding';
import * as nx from 'jsnetworkx';

const scene = new Scene('#stage');
const cellSize = 2;

const world = new World(cellSize, scene);
var f1 = world.addFloor(20, 20, new THREE.Vector3(0,0,0));
var f2 = world.addFloor(20, 20, new THREE.Vector3(0,5,0));
world.addStairs(f1, f2, new THREE.Vector3(0,0,0));

var agent = new Agent(world, {x:0,y:0}, f1);
var agents = [agent];
var target = {
  x:0,
  y:0,
  floor: f2
};

var route = agent.goTo(target);
_.each(route, leg => {
  leg.surface.highlightPath(leg.path);
});

// const ui = new UI(world);


// document.getElementById('go').addEventListener('click', () => {
//   agent.goTo(world.target);
// });

// document.getElementById('add-object').addEventListener('click', () => {
//   var width = $('#object-width').val(),
//       depth = $('#object-depth').val(),
//       obj = new Objekt(width, depth);
//   obj.mesh.position.set(0, 0, obj.size.height/2);
//   world.floor.mesh.add(obj.mesh);
//   ui.selected = obj.mesh;
// });

// document.getElementById('up-floor').addEventListener('click', () => {
//   var nextFloor = world.nFloor + 1;
//   if (nextFloor < world.floors.length) {
//     world.focusFloor(nextFloor);
//   }
// });
// document.getElementById('down-floor').addEventListener('click', () => {
//   var nextFloor = world.nFloor - 1;
//   if (nextFloor >= 0) {
//     world.focusFloor(nextFloor);
//   }
// });

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
    _.each(agents, a => a.update(delta));
  }
}
run();