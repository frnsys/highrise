import './css/main.sass';
import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import UI from './app/UI/UI';
import ObjektDesigner from './app/UI/ObjektDesigner';
import route from './Router';
import Scene from './app/Scene';
import World from './app/World';
import Layout from './app/Layout';
import PartyGoer from './PartyGoer';
import floorLayouts from './floorLayouts';

function simulation() {
  const cellSize = 0.5;
  const scene = new Scene('#stage');
  const world = new World(cellSize, scene);

  // birth the world
  var floorHeight = 3;
  var floors = _.map(floorLayouts.onelargefloor, (layout, i) => {
    return world.addFloor(
      layout,
      new THREE.Vector3(0,i*floorHeight,0),
      {
        'A': {
          'tags': ['food'],
          'props': {
            'tastiness': 10
          }
        }
      }
    );
  });
  //world.addStairs(floors[0], floors[1], new THREE.Vector2(1,3), 6, 2);

  // change the world
  const ui = new UI(world);
  const designer = new ObjektDesigner(cellSize, ui);

  var agents = [
    // new PartyGoer({
    //   bladder: 100,
    //   hunger: 0,
    //   thirst: 0,
    //   bac: 0
    // })
  ];

  // boot the world
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
}

// diy router
route({
  '/': {
    html: 'html/sim.html',
    func: simulation
  },
  '*': {
    func: function() {
      console.log('missing route!');
    }
  }
});
