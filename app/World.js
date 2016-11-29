import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';
import Surface from './Surface';

const floorHeight = 5;

class World {
  constructor(cellSize, rows, cols, floors, scene) {
    this.cellSize = cellSize;
    this.rows = rows;
    this.cols = cols;
    this.scene = scene;
    this.setupFloors(floors);

    this.setTarget(1, 1);

    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
  }

  setupFloor(nFloor) {
    var floor = new Surface(
      this.cellSize,
      this.rows,
      this.cols,
      0, nFloor * floorHeight, 0);
    this.scene.add(floor.mesh);
    return floor;
  }

  setupFloors(floors) {
    this.floors = _.map(_.range(floors), i => this.setupFloor(i));
    this.focusFloor(0);
    // var gridHelper = new THREE.GridHelper(this.rows * (this.cellSize/2), this.rows);
    // this.scene.add(gridHelper);
  }

  focusFloor(nFloor) {
    if (this.floor) {
      this.floor.mesh.material.opacity = 0.1;
      this.scene.selectables = _.without(this.scene.selectables, this.floor.mesh);
    }
    this.floor = this.floors[nFloor];
    this.floor.mesh.material.opacity = 0.6;
    this.scene.selectables.push(this.floor.mesh);
    this.nFloor = nFloor;
  }

  setTarget(x, y) {
    if (this.target) {
      this.floor.unhighlightPos(this.target.x, this.target.y);
    }
    this.floor.unhighlightPos(x, y);
    this.floor.highlightPos(x, y, 'target');
    this.target = {x:x, y:y, floor: this.nFloor};
  }

  findPathToTarget(agent) {
    // also refer to PF.Util.smoothenPath:
    // <https://github.com/qiao/PathFinding.js/>
    if (!this.target) {
      return [];
    }
    return this.finder.findPath(
      agent.position.x,
      agent.position.y,
      this.target.x,
      this.target.y,
      this.floor.grid.clone());
  }

  place(obj, x, y) {
    this.floor.place(obj, x, y);
  }
}

export default World;
