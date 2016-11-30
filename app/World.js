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
      0, nFloor * floorHeight * this.cellSize, 0);
    this.scene.add(floor.mesh);
    floor.stairs = [];
    return floor;
  }

  setupStairs(fromFloor, toFloor, width=4, angle=-Math.PI/4) {
    var totalFloorHeight = floorHeight * this.cellSize,
        depth = Math.round(totalFloorHeight/Math.cos(angle)),
        pos = {
          x: 0,
          y: (fromFloor * totalFloorHeight) + (totalFloorHeight/2),
          z: 0.5},
        stairs = new Surface(
          this.cellSize,
          width,
          depth,
          pos.x, pos.y, pos.z);
    stairs.mesh.rotation.x = angle;
    this.scene.add(stairs.mesh);

    stairs.landings = {
      top: [],
      bottom: []
    };

    stairs.startings = _.map(_.range(width), i => {
      stairs.highlightPos(i, 0, 'marker');
      return {
        x: i,
        y: 0
      };
    });
    stairs.endings = _.map(_.range(width), i => {
      stairs.highlightPos(i, depth - 1, 'marker');
      return {
        x: i,
        y: depth - 1
      };
    });

    // compute stair bottom landing
    var projDepth = depth * Math.sin(angle) - 1;
    var adj = - (fromFloor * (Math.round(projDepth + 1))); // TODO why does this adj work? does it always work?
    var startFloor = this.floors[fromFloor];
    var locPos = startFloor.mesh.worldToLocal(
      new THREE.Vector3(pos.x - width/2, pos.y + projDepth, pos.z));
    locPos = startFloor.localToGrid(locPos.x, locPos.y);
    _.each(_.range(width), i => {
      startFloor.highlightPos(locPos.x + i, locPos.y - adj, 'marker');
      stairs.landings.bottom.push({
        x: locPos.x + i,
        y: locPos.y - adj
      });
    });


    // compute stair top landing
    var endFloor = this.floors[toFloor];
    locPos = startFloor.mesh.worldToLocal(
      new THREE.Vector3(pos.x - width/2, pos.y, pos.z));
    locPos = endFloor.localToGrid(locPos.x, locPos.y);
    _.each(_.range(width), i => {
      endFloor.highlightPos(locPos.x + i, locPos.y - adj, 'marker');
      stairs.landings.top.push({
        x: locPos.x + i,
        y: locPos.y - adj
      });
    });

    // right before the stair top landing is an obstacle
    // (it's an open space)
    _.each(stairs.landings.top, pos => {
      endFloor.setObstacle(pos.x, pos.y - 1);
    });

    return stairs;
  }

  setupFloors(floors) {
    this.floors = _.map(_.range(floors), i => this.setupFloor(i));
    _.each(this.floors, f => {
      f.mesh.material.opacity = 0.1;
    });
    this.focusFloor(0);
    _.each(_.range(this.floors.length-1), i => {
      var stairs = this.setupStairs(i, i+1);
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
    // translate stairsTarget to local stairs grid
    // translate stairsEnd to local stairs grid
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
