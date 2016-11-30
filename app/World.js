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

  markerAt(x, y, z, mesh, color) {
    color = color || 0x000000;
    var geometry = new THREE.BoxGeometry(0.1,0.1,40),
        material = new THREE.MeshLambertMaterial({
          color: color
        }),
        cube = new THREE.Mesh(geometry, material);
    cube.position.set(x,y,z);
    mesh.add(cube);
  }

  setupStairs(fromFloor, toFloor, width=4, angle=Math.PI/4, rotation=0) {
    var totalFloorHeight = floorHeight * this.cellSize,
        depth = Math.round(totalFloorHeight/Math.cos(angle)),
        pos = {
          x: 0,
          y: 0,
          z: totalFloorHeight/2},
        stairs = new Surface(
          this.cellSize,
          width,
          depth,
          pos.x, pos.y, pos.z);
    stairs.mesh.rotation.x = angle;
    var startFloor = this.floors[fromFloor];

    // var rotation = Math.PI/2; // TESTING
    var axis = new THREE.Vector3(0,1,1).normalize();
    stairs.mesh.rotateOnAxis(axis, rotation);

    stairs.mesh.geometry.computeBoundingBox();
    var bbox = stairs.mesh.geometry.boundingBox;
    var size = {
        width: Math.round(bbox.max.x - bbox.min.x),
        depth: Math.round(bbox.max.y - bbox.min.y),
        height: Math.round(bbox.max.z - bbox.min.z)
    };

    var origin = new THREE.Vector3(
      stairs.mesh.position.x - size.width/2,
      stairs.mesh.position.y - size.depth/2,
      0);
    stairs.mesh.updateMatrixWorld();
    origin.applyMatrix4(stairs.mesh.matrixWorld);

    var gridPos = startFloor.localToGrid(origin.x, origin.y),
        localPos = startFloor.gridToLocal(gridPos.x, gridPos.y);
    localPos = new THREE.Vector3(
      localPos.x + this.cellSize/2,
      localPos.y + this.cellSize/2,
      0
    );

    // debug
    // startFloor.highlightPos(gridPos.x, gridPos.y, 'marker');
    // this.markerAt(origin.x, origin.y, stairs.mesh.position.z, startFloor.mesh);
    // this.markerAt(localPos.x, localPos.y, stairs.mesh.position.z, startFloor.mesh, 0xff0000);

    var shift = origin.sub(localPos);
    stairs.mesh.position.x -= shift.x;
    stairs.mesh.position.y -= shift.y;
    startFloor.mesh.add(stairs.mesh);

    // ---

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

    // ---

    var topLandingVec = new THREE.Vector3(0,1,0);
    var bottomLandingVec = new THREE.Vector3(0,-1,0);

    stairs.landings = {
      top: [],
      bottom: []
    };

    var drawCell = function(v, pa, color=0xdd88aa) {
      var geo = new THREE.PlaneGeometry(1, 1),
          mat = new THREE.MeshLambertMaterial({
            color: color,
            side: THREE.DoubleSide
          }),
          mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(v.x, v.y, v.z);
      pa.add(mesh);
    };

    // compute stair bottom landing
    stairs.mesh.updateMatrixWorld();
    _.each(stairs.startings, pos => {
      // stairs grid position
      var v = new THREE.Vector3(pos.x, pos.y, 0);

      // landing grid position, relative to stairs
      v.add(bottomLandingVec);

      // convert to point
      v = stairs.gridToLocal(v.x, v.y);
      v = new THREE.Vector3(v.x, v.y, 0);

      // get world position, which _should_ be the same as for the floor?
      // given that the world is their parent?
      v = stairs.mesh.localToWorld(v);
      // if not, then this is probably necessary:
      // v = startFloor.mesh.worldToLocal(v);

      // get grid position, relative to floor
      v = startFloor.localToGrid(v.x, v.y);

      startFloor.highlightPos(v.x, v.y, 'marker');

      stairs.landings.bottom.push(v);
    });

    var endFloor = this.floors[toFloor];
    _.each(stairs.endings, pos => {
      var v = new THREE.Vector3(pos.x, pos.y, 0);
      v.add(topLandingVec);
      v = stairs.gridToLocal(v.x, v.y);
      v = new THREE.Vector3(v.x, v.y, 0);
      v = stairs.mesh.localToWorld(v);
      v = endFloor.localToGrid(v.x, v.y);
      endFloor.highlightPos(v.x, v.y, 'marker');
      stairs.landings.top.push(v);
    });

    // right before the stair top landing is an obstacle
    // (it's an open space)
    _.each(stairs.landings.top, pos => {
      endFloor.setObstacle(pos.x, pos.y - 1);
    });

    // right underneath the stair is also an obstacle,
    // so they don't try to walk through it
    _.each(stairs.landings.bottom, pos => {
      startFloor.setObstacle(pos.x, pos.y + 1);
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
