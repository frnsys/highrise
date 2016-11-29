import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import UI from './app/UI';
import Scene from './app/Scene';
import World from './app/World';
import Agent from './app/Agent';
import Objekt from './app/Objekt';

const scene = new Scene('#stage');
const cellSize = 1;
const rows = 20;
const cols = rows;
const nFloors = 2;

const world = new World(cellSize, rows, cols, nFloors, scene);
const ui = new UI(world);

var agent = new Agent();
world.place(agent, 0, 0);

document.getElementById('go').addEventListener('click', () => {
  var path = world.findPathToTarget(agent);
  world.floor.highlightPath(path);
});

document.getElementById('add-object').addEventListener('click', () => {
  var width = $('#object-width').val(),
      depth = $('#object-depth').val(),
      obj = new Objekt(width, depth);
  obj.mesh.position.set(0, 0, obj.size.height/2);
  world.floor.mesh.add(obj.mesh);
  ui.selected = obj.mesh;
});

document.getElementById('up-floor').addEventListener('click', () => {
  var nextFloor = world.nFloor + 1;
  if (nextFloor < world.floors.length) {
    world.focusFloor(nextFloor);
  }
});
document.getElementById('down-floor').addEventListener('click', () => {
  var nextFloor = world.nFloor - 1;
  if (nextFloor >= 0) {
    world.focusFloor(nextFloor);
  }
});

function run() {
  requestAnimationFrame(run);
  scene.render();
}
run();