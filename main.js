import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import UI from './app/UI/UI';
import Scene from './app/Scene';
import World from './app/World';
import Agent from './app/Agent';
import HungryGhost from './HungryGhost';
import Objekt from './app/Objekt';
import Layout from './app/Layout';

var layoutGrid = [
    // [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [   1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
]
// var layout = new Layout(layoutGrid);
// var vertices = layout.computeVertices();


const cellSize = 2;
const scene = new Scene('#stage');
const world = new World(cellSize, scene);
const rows = 20;
const cols = rows;

// var shape = new THREE.Shape();
// shape.moveTo(vertices[0][0] * cellSize, vertices[0][1] * cellSize);
// _.each(_.rest(vertices), v => {
//   shape.lineTo(v[0] * cellSize, v[1] * cellSize);
// });
// shape.lineTo(vertices[0][0] * cellSize, vertices[0][1] * cellSize);

// var geo = new THREE.ShapeGeometry(shape);
// var mat = new THREE.MeshBasicMaterial( { color: 0x000000 } );
// var mesh = new THREE.Mesh( geo, mat ) ;
// scene.add( mesh );

// var extgeo = new THREE.ExtrudeGeometry(shape, {steps: 1, amount:cellSize, bevelEnabled: false});
// var mesh = new THREE.Mesh( extgeo, mat ) ;
// scene.add( mesh );

var f1 = world.addFloor(layoutGrid, new THREE.Vector3(0,0,0));
var f2 = world.addFloor(layoutGrid, new THREE.Vector3(0,5,0));
var f3 = world.addFloor(layoutGrid, new THREE.Vector3(0,10,0));
var f4 = world.addFloor(layoutGrid, new THREE.Vector3(0,15,0));
var floors = [f1, f2, f3];
world.addStairs(f1, f2, new THREE.Vector3(0,0,0));
world.addStairs(f2, f3, new THREE.Vector3(0,0,0), Math.PI/2);
world.addStairs(f3, f4, new THREE.Vector3(0,0,0));

f1.highlightCoord(0,0, 'foo', 0xff0000);

var colors = [0x4286f4, 0xf4a442];
var agents = _.map(floors, (f, i) => {
  // var agent = new Agent(world, {x:0,y:0}, f, colors[i]);
  // var onArrive = () => {
  //   var target = {
  //     x:_.random(0,rows), y:_.random(0,cols),
  //     floor: _.sample(floors)
  //   };
  //   var route = agent.goTo(target, onArrive);
  //   if (route.length === 0) {
  //     onArrive();
  //   }
  //   _.each(route, leg => {
  //     leg.surface.highlightPath(leg.path, agent.color);
  //   });
  // }
  // onArrive();
  var agent = new HungryGhost(world, {x:0,y:0}, f, colors[i]);
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
  }
});

var clock = new THREE.Clock();
function run() {
  requestAnimationFrame(run);
  scene.render();
  // var delta = clock.getDelta();
  // if (delta < 0.5) {
  //   // if the delta is really large,
  //   // (i.e. when the tab loses focus)
  //   // agents will take very large steps
  //   // and can end up off the map
  //   // so just ignore large deltas
  //   _.each(agents, a => a.update(delta));
  // }
}
run();