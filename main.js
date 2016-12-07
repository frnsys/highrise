import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import Scene from './app/Scene';
import World from './app/World';
import Layout from './app/Layout';

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

var layoutGrid = Layout.rect(20,20);

// axes
var axes = new THREE.AxisHelper(100);
scene.add(axes);

// var floor = world.addFloor(layout, new THREE.Vector3(1,0,1));
// floor.highlightCoord(0,0,'foo', 0xffff00);

var f1 = world.addFloor(layoutGrid, new THREE.Vector3(-10,0,-10));
var f2 = world.addFloor(layoutGrid, new THREE.Vector3(-10,5,-10));
var f3 = world.addFloor(layoutGrid, new THREE.Vector3(-10,10,-10));
var f4 = world.addFloor(layoutGrid, new THREE.Vector3(-10,15,-10));
var floors = [f1, f2, f3];
world.addStairs(f1, f2, new THREE.Vector2(11,11), 8);
world.addStairs(f1, f2, new THREE.Vector2(11,11), 8, Math.PI/2);

function run() {
  requestAnimationFrame(run);
  scene.render();
}
run();