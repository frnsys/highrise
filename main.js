import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import UI from './app/UI';
import Scene from './app/Scene';
import World from './app/World';
import Agent from './app/Agent';
import Objekt from './app/Objekt';
import PF from 'pathfinding';

const scene = new Scene('#stage');
const cellSize = 1;
const rows = 20;
const cols = rows;
const nFloors = 4;

const world = new World(cellSize, rows, cols, nFloors, scene);
const ui = new UI(world);

var agent = new Agent();
world.place(agent, 0, 0);

document.getElementById('go').addEventListener('click', () => {
  var route = world.findRouteToTarget(agent);
  route = _.map(route, leg => {
    // though smoothing sometimes causes corner clipping...
    var path = PF.Util.smoothenPath(leg.surface.grid, leg.path);
    return {
      surface: leg.surface,
      path: _.map(path, p => {
        return leg.surface.gridToLocal(p[0], p[1]);
      })
    }
  });
  agent.walk(route);
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
    agent.update(delta);
  }
}
run();