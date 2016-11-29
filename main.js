import './css/main.sass';
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

const world = new World(cellSize, rows, cols, scene);
const ui = new UI(world);

var agent = new Agent(0, 0);
world.place(agent);

document.getElementById('go').addEventListener('click', () => {
  var path = world.findPathToTarget(agent);
  world.highlightPath(path);
});

document.getElementById('add-object').addEventListener('click', () => {
  var obj = new Objekt(3, 3);
  obj.mesh.position.set(0, obj.mesh.position.y, 0);
  scene.add(obj.mesh);
  ui.selected = obj.mesh;
});

function run() {
  requestAnimationFrame(run);
  scene.render();
}
run();