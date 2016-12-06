import * as THREE from 'three';
import * as nx from 'jsnetworkx';
import Stairs from './Stairs';
import Surface from './Surface';
import Navigator from './Navigator';

const helperGridSize = 20;

class World {
  constructor(cellSize, scene) {
    this.scene = scene;
    this.cellSize = cellSize;
    this.navigator = new Navigator(this);
    this.objects = [];
    this.surfaces = {};
    this.surfaceNetwork = new nx.MultiGraph();

    var gridHelper = new THREE.GridHelper(helperGridSize * (this.cellSize/2), helperGridSize);
    this.scene.add(gridHelper);
  }

  objectsWithTag(tag) {
    return _.filter(this.objects, o => _.contains(o.tags, tag));
  }

  posToCoord(pos) {
    // takes a CCS position
    // snaps to a GCS coord
    return new THREE.Vector3(
      Math.floor(pos.x/this.cellSize) * this.cellSize,
      Math.floor(pos.y/this.cellSize) * this.cellSize,
      Math.floor(pos.z/this.cellSize) * this.cellSize
    );
  }

  coordToPos(coord) {
    // converts a GCS coord to a CCS position
    return new THREE.Vector3(
      coord.x * this.cellSize,
      coord.y * this.cellSize,
      coord.z * this.cellSize
    );
  }

  addFloor(layout, pos) {
    // creates a floor surface of rows x cols
    // placing it at the CCS pos, snapped-to-grid
    var sngPos = this.coordToPos(pos),
        floor = new Surface(this.cellSize, layout, sngPos);
    floor.mesh.kind = 'floor';
    this.scene.add(floor.mesh, true);
    this.surfaceNetwork.addNode(floor.id);
    this.surfaces[floor.id] = floor;
    return floor;
  }

  addStairs(fromFloor, toFloor, pos, rotation=0, width=4) {
    // creates a stair connecting fromFloor to toFloor,
    // placing it at the CCS pos, snapped-to-grid relative to the fromFloor
    // note that the pos.z is ignored; stairs are auto placed on the ground
    var stairs = new Stairs(this.cellSize, pos, fromFloor, toFloor, width, rotation);
    this.surfaceNetwork.addEdge(fromFloor.id, toFloor.id, {stairs: stairs});
    return stairs;
  }
}

export default World;
