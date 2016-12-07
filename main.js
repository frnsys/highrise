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

var layout = [
  [1,1,1,1,1,1],
  [1,1,1,1,1,1],
  [1,1,1,1,1,1],
  [1,1,0,0,1,1],
  [1,1,0,0,1,1]
];

var layoutGrid = Layout.rect(20,20);
var f1 = world.addFloor(layoutGrid, new THREE.Vector3(-10,0,-10));
var f2 = world.addFloor(layoutGrid, new THREE.Vector3(-10,5,-10));
var f3 = world.addFloor(layoutGrid, new THREE.Vector3(-10,10,-10));
var f4 = world.addFloor(layoutGrid, new THREE.Vector3(-10,15,-10));
var floors = [f1, f2, f3];
world.addStairs(f1, f2, new THREE.Vector2(11,11), 8);
world.addStairs(f2, f3, new THREE.Vector2(8,8), 8, Math.PI/2);

function run() {
  requestAnimationFrame(run);
  scene.render();
}
run();