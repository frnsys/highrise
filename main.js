import './css/main.sass';
import _ from 'underscore';
import * as THREE from 'three';
import Scene from './app/Scene';
import UI from './app/UI';
import World from './app/World';
import Agent from './app/Agent';

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
  var geometry = new THREE.BoxGeometry(1,1,1),
      material = new THREE.MeshLambertMaterial({color: 0x222222}),
      obstacle = new THREE.Mesh(geometry, material);
  obstacle.position.set(0, obstacle.geometry.parameters.height/2, 0);
  obstacle.type = 'obstacle';
  scene.add(obstacle);
  ui.selected = obstacle;
});

function run() {
  requestAnimationFrame(run);
  scene.render();
}
run();