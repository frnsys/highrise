import _ from 'underscore';
import * as THREE from 'three';
import * as nx from 'jsnetworkx';
import Layout from './Layout';
import Objekt from './Objekt';
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
    this.paused = false;

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

  addFloor(layout, pos, objData) {
    // creates a floor surface of rows x cols
    // placing it at the CCS pos, snapped-to-grid
    var sngPos = this.coordToPos(pos),
        floor = new Surface(this.cellSize, layout, sngPos);
    floor.mesh.kind = 'floor';
    this.scene.add(floor.mesh, true);
    this.surfaceNetwork.addNode(floor.id);
    this.surfaces[floor.id] = floor;

    // setup objects
    var objs = this.parseObjects(floor);
    _.each(objs, e => {
      var [id, obj, origin, coords] = e,
          pos = floor.coordToPos(origin[0], origin[1]);
      obj.mesh.position.set(pos.x, pos.y, 0);
      floor.mesh.add(obj.mesh);
      this.objects.push(obj);
      this.scene.selectables.push(obj.mesh);
      _.each(coords, pos => floor.setObstacle(pos[0], pos[1]));
      obj.coords = coords;
      obj.floor = floor;
      if (objData && id in objData) {
        obj.tags = objData[id].tags || [];
        obj.props = _.clone(objData[id].props || {});
      }
    });

    return floor;
  }

  parseObjects(floor) {
    // parse objects in a floor (denoted by capital letters)
    // into Objekts. The letter used to describe an object is
    // considered its id; this returns a map of {id: objekt}.
    var objs = {};
    _.each(floor.layout.positionsValues, pv => {
      var [pos, val] = pv;
      var [x, y] = pos;
      if (typeof val === 'string') {
        if (!(val in objs)) {
          objs[val] = [];
        }
        objs[val].push(pos);
      }
    });
    Object.keys(objs).map(k => {
      var positions = objs[k],
          layout = this.layoutFromPositions(positions),
          obj = new Objekt(this.cellSize, layout),
          // bottom-leftmost position is origin
          origin = [
            _.min(positions, p => p[0])[0],
            _.min(positions, p => p[1])[1]
          ];
      objs[k] = [k, obj, origin, positions];
    });
    return objs;
  }

  layoutFromPositions(positions) {
    // shift positions so they start at 0,0
    var min_x = _.min(positions, p => p[0])[0],
        min_y = _.min(positions, p => p[1])[1],
        positions = positions.map(p => {
          var [x, y] = p;
          return [x - min_x, y - min_y];
        }),
        max_x = _.max(positions, p => p[0])[0],
        max_y = _.max(positions, p => p[1])[1],
        layout = Layout.rect(max_y+1, max_x+1, 0);
    _.each(positions, p => {
      var [x, y] = p;
      layout[y][x] = 1;
    });
    return layout;
  }

  addStairs(fromFloor, toFloor, pos, depth, width, rotation=0) {
    // creates a stair connecting fromFloor to toFloor,
    // placing it at the CCS pos, snapped-to-grid relative to the fromFloor
    // note that the pos.z is ignored; stairs are auto placed on the ground
    var stairs = new Stairs(this.cellSize, pos, depth, fromFloor, toFloor, width, rotation);
    this.surfaceNetwork.addEdge(fromFloor.id, toFloor.id, {stairs: stairs});
    return stairs;
  }

  // for debugging
  highlightCoord(x, y, color=0xff0000) {
    var pos = this.coordToPos({x:x, y:0, z:y}),
        geo = new THREE.PlaneGeometry(this.cellSize, this.cellSize),
        mat = new THREE.MeshLambertMaterial({
          opacity: 0.6,
          transparent: false,
          color: color,
          side: THREE.DoubleSide
        });
    geo.applyMatrix(
      new THREE.Matrix4().makeTranslation(this.cellSize/2, -this.cellSize/2, 0));
    var p = new THREE.Mesh(geo, mat);
    p.rotation.x = -Math.PI/2;
    p.position.set(pos.x, 0.01, pos.z);
    this.scene.add(p);
  }

  showAxes() {
    var axes = new THREE.AxisHelper(100);
    this.scene.add(axes);
  }
}

export default World;
