import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';
import Stairs from './Stairs';
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
      new THREE.Vector3(0, nFloor * floorHeight * this.cellSize, 0));
    this.scene.add(floor.mesh);
    floor.stairs = [];
    return floor;
  }

  setupFloors(floors) {
    this.floors = _.map(_.range(floors), i => this.setupFloor(i));
    _.each(this.floors, f => {
      f.mesh.material.opacity = 0.1;
    });
    this.focusFloor(0);
    _.each(_.range(this.floors.length-1), i => {
      var stairs = new Stairs(
        this.cellSize,
        new THREE.Vector3(0, 0, 0), // TODO x,y can be anything. z is ignored
        this.floors[i],
        this.floors[i+1]);
      this.floors[i].stairs.push(stairs);
    });
    var gridHelper = new THREE.GridHelper(this.rows * (this.cellSize/2), this.rows);
    this.scene.add(gridHelper);
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
      this.floors[this.target.floor].unhighlightPos(this.target.x, this.target.y);
    }
    this.floor.unhighlightPos(x, y);
    this.floor.highlightPos(x, y, 'target');
    this.target = {x:x, y:y, floor: this.nFloor};
  }

  findPathToFloor(phantom, nFloor) {
    // find path to stairs
    // TODO in the case of multiple stairs, find closest
    var floor = this.floors[nFloor - 1],
        stairs = _.sample(floor.stairs),
        stairsTarget = _.sample(stairs.landings.bottom); // TODO select closest unoccupied landing space

    var path = this.finder.findPath(
          phantom.x,
          phantom.y,
          stairsTarget.x,
          stairsTarget.y,
          floor.grid.clone());
    floor.highlightPath(path);

    // then find path up the stairs
    var landingTarget = _.sample(stairs.landings.top); // TODO select closest unoccupied ending to target
    var stairsStart = {
          y: 0,
          x: stairs.landings.bottom.indexOf(stairsTarget)
        },
        stairsEnd = {
          y: stairs.grid.height - 1,
          x: stairs.landings.top.indexOf(landingTarget)
        };
    path = this.finder.findPath(
      stairsStart.x, stairsStart.y,
      stairsEnd.x, stairsEnd.y,
      stairs.grid.clone()
    );
    stairs.highlightPath(path);

    // then move to the next floor
    phantom.floor = nFloor;
    phantom.x = landingTarget.x;
    phantom.y = landingTarget.y;
  }

  findPathToTarget(agent) {
    // also refer to PF.Util.smoothenPath:
    // <https://github.com/qiao/PathFinding.js/>
    if (!this.target) {
      return [];
    }

    var phantom = {
      floor: agent.floor,
      x: agent.position.x,
      y: agent.position.y
    };

    // TODO what if there isn't a path?
    while (phantom.floor != this.target.floor) {
      var increment = 1 ? this.target.floor > phantom.floor : -1;
      this.findPathToFloor(phantom, phantom.floor + increment);
    }
    return this.finder.findPath(
      phantom.x,
      phantom.y,
      this.target.x,
      this.target.y,
      this.floors[this.target.floor].grid.clone());
  }

  place(obj, x, y) {
    this.floor.place(obj, x, y);
    obj.floor = this.nFloor;
  }
}

export default World;
