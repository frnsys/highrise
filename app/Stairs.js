import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';
import Surface from './Surface';

const forwardStep = new THREE.Vector3(0,1,0);
const backwardStep = new THREE.Vector3(0,-1,0);

class Stairs extends Surface {
  constructor(cellSize, pos, fromFloor, toFloor, width=4, angle=Math.PI/4, rotation=0) {
    // compute surface params
    var floorHeight = toFloor.mesh.position.y - fromFloor.mesh.position.y;
    var depth = Math.round(floorHeight/Math.cos(angle));
    pos.z = floorHeight/2
    super(cellSize, width, depth, pos);

    // +2 rows for landings
    this.grid = new PF.Grid(this.rows + 2, this.cols);

    // set angle (slope)
    this.mesh.rotation.x = angle;

    // set angle (rotation around vertical axis)
    var axis = new THREE.Vector3(0,1,1).normalize();
    this.mesh.rotateOnAxis(axis, rotation);

    this.toFloor = toFloor;
    this.fromFloor = fromFloor;

    // place on the start floor
    this.mesh.geometry.computeBoundingBox();
    this.snapToGrid();
    this.fromFloor.mesh.add(this.mesh);

    // compute joints and landings
    this.joints = {
      top: this.computeJoints(depth - 1, width),
      bottom: this.computeJoints(0, width)
    };
    this.landings = {
      top: this.computeLandings(toFloor, this.joints.top, forwardStep),
      bottom: this.computeLandings(fromFloor, this.joints.bottom, backwardStep)
    };

    // right before the stair top landing is an obstacle
    // (it's an open space)
    _.each(this.landings.top, pos => {
      toFloor.setObstacle(pos.x, pos.y - 1);
    });

    // right underneath the stair is also an obstacle,
    // so they don't try to walk through it
    _.each(this.landings.bottom, pos => {
      fromFloor.setObstacle(pos.x, pos.y + 1);
    });
  }

  get size() {
    var bbox = this.mesh.geometry.boundingBox;
    return {
        width: Math.round(bbox.max.x - bbox.min.x),
        depth: Math.round(bbox.max.y - bbox.min.y),
        height: Math.round(bbox.max.z - bbox.min.z)
    };
  }

  snapToGrid() {
    var size = this.size;

    // compute (0,0) origin relative to this mesh
    var origin = new THREE.Vector3(
      this.mesh.position.x - size.width/2,
      this.mesh.position.y - size.depth/2, 0);
    this.mesh.updateMatrixWorld();
    origin.applyMatrix4(this.mesh.matrixWorld);

    // convert origin to local position on from floor
    var gridPos = this.fromFloor.localToGrid(origin.x, origin.y),
        localPos = this.fromFloor.gridToLocal(gridPos.x, gridPos.y);
    localPos = new THREE.Vector3(
      localPos.x + this.cellSize/2,
      localPos.y + this.cellSize/2 ,0);

    // compute shift for snap-to-grid
    var shift = origin.sub(localPos);
    this.mesh.position.x -= shift.x;
    this.mesh.position.y -= shift.y;
  }

  computeJoints(y, width) {
    // joints are the cells on the stairs
    // that touch the floors
    return _.map(_.range(width), i => {
      this.highlightPos(i, y, 'marker');
      return {
        x: i,
        y: y
      };
    });
  }

  computeLandings(floor, joints, stepVec) {
    // landings are the cells on the floors
    // that touch the stairs
    this.mesh.updateMatrixWorld();

    return _.map(joints, pos => {
      // stairs grid position
      var v = new THREE.Vector3(pos.x, pos.y, 0);

      // landing grid position, relative to stairs
      v.add(stepVec);

      // convert to point
      v = this.gridToLocal(v.x, v.y);
      v = new THREE.Vector3(v.x, v.y, 0);

      // get world position, which _should_ be the same as for the floor?
      // given that the world is their parent?
      v = this.mesh.localToWorld(v);
      // if not, then this is probably necessary:
      // v = floor.mesh.worldToLocal(v);

      // get grid position, relative to floor
      v = floor.localToGrid(v.x, v.y);

      floor.highlightPos(v.x, v.y, 'marker');

      return v;
    });
  }
}

export default Stairs;
