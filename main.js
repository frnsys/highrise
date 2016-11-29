import './css/main.sass';
import _ from 'underscore';
import * as THREE from 'three';
import Scene from './app/Scene';
import SelectUI from './app/Select';
import World from './app/World';
import Agent from './app/Agent';

const scene = new Scene('#stage');
const cellSize = 1;
const rows = 20;
const cols = rows;

var world = new World(cellSize, rows, cols, scene);

const select = new SelectUI(scene, (obj, pos, ev) => {
  var pos = world.worldToGrid(pos.x, pos.z);
  if (ev.buttons === 1) {
    if (_.findWhere(world.obstacles, pos)) {
      world.removeObstacle(pos.x, pos.y);
    } else {
      world.setObstacle(pos.x, pos.y);
    }
  } else if (ev.buttons === 2) {
    world.setTarget(pos.x, pos.y);
  }
});

var agent = new Agent(0, 0, world);
scene.add(agent.mesh);

document.getElementById('go').addEventListener('click', () => {
  var path = world.findPathToTarget(agent);
  world.highlightPath(path);
});

function run() {
  requestAnimationFrame(run);
  scene.render();
}
run();