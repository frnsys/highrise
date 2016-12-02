import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import UI from './app/UI/UI';
import Scene from './app/Scene';
import World from './app/World';
import Agent from './app/Agent';
import Objekt from './app/Objekt';

const cellSize = 2;
const scene = new Scene('#stage');
const world = new World(cellSize, scene);
const rows = 20;
const cols = rows;

var f1 = world.addFloor(rows, cols, new THREE.Vector3(0,0,0));
var f2 = world.addFloor(rows, cols, new THREE.Vector3(0,5,0));
var floors = [f1, f2];
world.addStairs(f1, f2, new THREE.Vector3(0,0,0));

var colors = [0x4286f4, 0xf4a442];
var agents = _.map(floors, (f, i) => {
  var agent = new Agent(world, {x:0,y:0}, f, colors[i]);
  var onArrive = () => {
    var target = {
      x:_.random(0,rows), y:_.random(0,cols),
      floor: _.sample(floors)
    };
    var route = agent.goTo(target, onArrive);
    if (route.length === 0) {
      onArrive();
    }
    _.each(route, leg => {
      leg.surface.highlightPath(leg.path, agent.color);
    });
  }
  onArrive();
  return agent;
});

const ui = new UI(world);

document.getElementById('add-object').addEventListener('click', () => {
  if (ui.floor) {
    var width = $('#object-width').val(),
        depth = $('#object-depth').val(),
        obj = new Objekt(cellSize, width, depth);
    obj.mesh.position.set(0, 0, obj.size.height/2);
    ui.floor.mesh.add(obj.mesh);
    ui.selected = obj.mesh;
    world.objects.push(obj);
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
    _.each(agents, a => a.update(delta));
  }
}
run();