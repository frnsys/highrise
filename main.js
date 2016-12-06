import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import Scene from './app/Scene';
import World from './app/World';

const cellSize = 2;
const scene = new Scene('#stage');
const world = new World(cellSize, scene);

function highlight(x, y, color=0xff0000) {
  var pos = world.coordToPos({x:x, y:0, z:y}),
      geo = new THREE.PlaneGeometry(cellSize, cellSize),
      mat = new THREE.MeshLambertMaterial({
        opacity: 0.6,
        transparent: false,
        color: color,
        side: THREE.DoubleSide
      });
  geo.applyMatrix(
    new THREE.Matrix4().makeTranslation(cellSize/2, -cellSize/2, 0));
  var p = new THREE.Mesh(geo, mat);

  p.rotation.x = -Math.PI/2;
  p.position.set(pos.x, 0.01, pos.z);
  scene.add(p);
}

highlight(0,0, 0x0000ff);
highlight(2,2);
highlight(5,5);

var layout = [
  [1,1,1,1,1,1],
  [1,1,1,1,1,1],
  [1,1,1,1,1,1],
  [1,1,0,0,1,1],
  [1,1,0,0,1,1]
];

// axes
var axes = new THREE.AxisHelper(100);
scene.add(axes);

var floor = world.addFloor(layout, new THREE.Vector3(1,0,1));
floor.highlightCoord(0,0,'foo', 0xffff00);

function run() {
  requestAnimationFrame(run);
  scene.render();
}
run();