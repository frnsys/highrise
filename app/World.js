import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';
import * as nx from 'jsnetworkx';
import Stairs from './Stairs';
import Surface from './Surface';

const helperGridSize = 20;

class World {
  constructor(cellSize, scene) {
    this.scene = scene;
    this.cellSize = cellSize;
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });

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
      Math.round(pos.x * this.cellSize)/this.cellSize,
      Math.round(pos.y * this.cellSize)/this.cellSize,
      Math.round(pos.z * this.cellSize)/this.cellSize
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

  addFloor(rows, cols, pos) {
    // creates a floor surface of rows x cols
    // placing it at the CCS pos, snapped-to-grid
    var sngPos = this.coordToPos(this.posToCoord(pos)),
        floor = new Surface(this.cellSize, rows, cols, sngPos);
    floor.mesh.kind = 'floor';
    this.scene.add(floor.mesh, true);
    this.surfaceNetwork.addNode(floor.id);
    this.surfaces[floor.id] = floor;
    return floor;
  }

  addStairs(fromFloor, toFloor, pos) {
    // creates a stair connecting fromFloor to toFloor,
    // placing it at the CCS pos, snapped-to-grid relative to the fromFloor
    // note that the pos.z is ignored; stairs are auto placed on the ground
    var stairs = new Stairs(this.cellSize, pos, fromFloor, toFloor);
    this.surfaceNetwork.addEdge(fromFloor.id, toFloor.id, {stairs: stairs});
    return stairs;
  }

  findRouteToFloor(fromFloor, toFloor) {
    // returns floors to pass through to arrive at toFloor
    // note that this does not include edges, just nodes (floors)
    // this includes fromFloor and toFloor
    var path = nx.dijkstraPath(
      this.surfaceNetwork,
      {source: fromFloor.id, target: toFloor.id});
    return _.map(path, id => this.surfaces[id]);
  }

  findRouteThroughFloor(phantom, fromFloor, toFloor) {
    var route = [];

    var allStairs = _.chain(
      this.surfaceNetwork.getEdgeData(fromFloor.id, toFloor.id))
      .values().pluck('stairs').value();

    // TODO in the case of multiple stairs, find closest
    var stairs = _.sample(allStairs),
      stairsStartLanding, stairsEndLanding,
      stairsStartJoint, stairsEndJoint;

    // going up
    if (fromFloor.mesh.position.y < toFloor.mesh.position.y) {
      // TODO select closest unoccupied
      stairsStartLanding = _.sample(stairs.landings.bottom);
      stairsEndLanding = _.sample(stairs.landings.top);
      stairsStartJoint = {
        y: 0,
        x: stairs.landings.bottom.indexOf(stairsStartLanding)
      };
      stairsEndJoint = {
        y: stairs.grid.height - 1,
        x: stairs.landings.top.indexOf(stairsEndLanding)
      };

    // going down
    } else {
      // TODO select closest unoccupied
      stairsStartLanding = _.sample(stairs.landings.top);
      stairsEndLanding = _.sample(stairs.landings.bottom);
      stairsStartJoint = {
        y: stairs.grid.height - 1,
        x: stairs.landings.top.indexOf(stairsStartLanding)
      };
      stairsEndJoint = {
        y: 0,
        x: stairs.landings.bottom.indexOf(stairsEndLanding)
      };
    }

    // find path to stairs start
    var path = this.finder.findPath(
          phantom.x,
          phantom.y,
          stairsStartLanding.x,
          stairsStartLanding.y,
          fromFloor.grid.clone());

    route.push({
      path: path,
      surface: fromFloor
    });

    path = this.finder.findPath(
      stairsStartJoint.x, stairsStartJoint.y,
      stairsEndJoint.x, stairsEndJoint.y,
      stairs.grid.clone()
    );

    route.push({
      path: path,
      surface: stairs
    });

    // then move to the next floor
    phantom.x = stairsEndLanding.x;
    phantom.y = stairsEndLanding.y;
    phantom.floor = toFloor;

    return route;
  }

  findRouteToTarget(agent, target) {
    var route = [];
    var phantom = {
      x: agent.position.x,
      y: agent.position.y,
      floor: agent.floor
    };

    // can't go there
    if (!target.floor.grid.isWalkableAt(target.x, target.y)) {
      return route;
    }

    if (phantom.floor !== target.floor) {
      var surfacePath = this.findRouteToFloor(phantom.floor, target.floor);
      route = _.chain(_.range(surfacePath.length-1)).map(i => {
        return this.findRouteThroughFloor(phantom, surfacePath[i], surfacePath[i+1]);
      }).flatten().value();
    }

    var path = this.finder.findPath(
      phantom.x,
      phantom.y,
      target.x,
      target.y,
      target.floor.grid.clone());
    route.push({
      path: path,
      surface: target.floor
    });
    if (!this.validateRoute(route)) {
      return [];
    }
    return route;
  }

  validateRoute(route) {
    // if any leg path is empty, it means there wasn't a complete route to the target
    // TODO is there an earlier way to catch this?
    return !_.any(route, leg => leg.path.length === 0);
  }
}

export default World;
