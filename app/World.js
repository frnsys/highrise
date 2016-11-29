import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';

const colors = {
  obstacle: 0xff0000,
  target:   0x00ff00,
  path:     0x0000ff
};
const floorHeight = 5;

class World {
  constructor(cellSize, rows, cols, floors, scene) {
    this.cellSize = cellSize;
    this.rows = rows;
    this.cols = cols;
    this.scene = scene;
    this.setupFloors(floors);
    this.setupAnnotations();

    this.setTarget(1, 1);

    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
  }

  setupFloor(nFloor) {
    var planeWidth = this.cellSize * this.rows,
        planeDepth = this.cellSize * this.cols,
        planeGeometry = new THREE.PlaneGeometry(planeWidth, planeDepth),
        planeMaterial = new THREE.MeshLambertMaterial({
          opacity: 0.1,
          transparent: true,
          color: 0xAAAAAA
        }),
        plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI/2;
    plane.position.set(0, nFloor * floorHeight, 0);
    plane.type = 'ground';
    this.scene.add(plane);
    return {
      mesh: plane,
      grid: new PF.Grid(this.rows, this.cols),
      obstacles: [],
      highlighted: {}
    };
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

  setupAnnotations() {
    var loader = new THREE.FontLoader(),
        height = 0.5,
        textMat = new THREE.MeshLambertMaterial({
          color: 0xaaaaaa
        });
    loader.load('assets/helvetiker.json', resp => {
      _.each([
        {t: 'z+', x: 0, y: this.cols},
        {t: 'x+', x: this.rows, y: 0},
        {t: '0,0', x: -1, y: -1}
      ], d => {
        var textGeo = new THREE.TextGeometry(d.t, {font:resp, size:2, height:height}),
            text = new THREE.Mesh(textGeo, textMat),
            pos = this.gridToWorld(d.x, d.y);
        text.rotation.x = -Math.PI / 2;
        text.position.set(pos.x,height/2,pos.z);
        this.scene.add(text);
      });
    });
  }

  gridToWorld(x, y) {
    return {
      x: (x * this.cellSize) + this.cellSize/2 - (this.cellSize * this.rows)/2,
      z: (y * this.cellSize) + this.cellSize/2 - (this.cellSize * this.cols)/2
    };
  }

  worldToGrid(x, z) {
    return {
      x: Math.round((x + (this.cellSize * this.rows)/2 - this.cellSize/2)/this.cellSize),
      y: Math.round((z + (this.cellSize * this.cols)/2 - this.cellSize/2)/this.cellSize)
    };
  }

  setObstacle(x, y, obj) {
    this.unhighlightPos(x, y);
    this.floor.obstacles.push({x:x, y:y})
    this.floor.grid.setWalkableAt(x, y, false);
    this.highlightPos(x, y, 'obstacle');
  }

  removeObstacle(x, y) {
    var existing = _.findWhere(this.floor.obstacles, {x:x, y:y});
    this.floor.obstacles = _.without(this.floor.obstacles, existing);
    this.floor.grid.setWalkableAt(x, y, true);
    this.unhighlightPos(x, y);
  }

  setTarget(x, y) {
    if (this.target) {
      this.unhighlightPos(this.target.x, this.target.y);
    }
    this.unhighlightPos(x, y);
    this.highlightPos(x, y, 'target');
    this.target = {x:x, y:y, floor: this.nFloor};
  }

  posKey(x, y) {
    return `${x}_${y}`;
  }

  existingHighlight(x, y) {
    var key = this.posKey(x, y);
    if (key in this.floor.highlighted) {
      return this.floor.highlighted[key].type;
    }
  }

  highlightPos(x, y, type) {
    var key = this.posKey(x, y);
    if (key in this.floor.highlighted) {
      this.unhighlightPos(x, y);
    }
    var pos = this.gridToWorld(x, y),
        geo = new THREE.PlaneGeometry(this.cellSize, this.cellSize),
        mat = new THREE.MeshLambertMaterial({
          opacity: 0.6,
          transparent: false,
          color: colors[type],
          side: THREE.DoubleSide
        }),
        p = new THREE.Mesh(geo, mat);
    p.rotation.x = Math.PI / 2;
    p.position.set(pos.x, (this.nFloor * floorHeight) + 0.01, pos.z);
    this.scene.add(p);
    this.floor.highlighted[key] = {
      mesh: p,
      type: type
    };
  }

  unhighlightPos(x, y) {
    var key = this.posKey(x, y);
    if (key in this.floor.highlighted) {
      var highlight = this.floor.highlighted[key];
      this.scene.remove(highlight.mesh);
      if (highlight.type === 'target') {
        this.target = null;
      }
      delete this.floor.highlighted[key];
    }
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

  setPath(x, y) {
    this.highlightPos(x, y, 'path');
  }

  removePath(x, y) {
    var key = this.posKey(x, y);
    if (this.existingHighlight(x, y) === 'path') {
      this.unhighlightPos(x, y);
    }
  }

  highlightPath(path) {
    path = _.initial(path);
    _.each(this.path, pos => {
      this.removePath(pos[0], pos[1]);
    });
    _.each(path, pos => {
      this.setPath(pos[0], pos[1]);
    });
    this.path = path;
  }

  place(obj) {
    var pos = this.gridToWorld(obj.position.x, obj.position.y);
    obj.mesh.position.x = pos.x;
    obj.mesh.position.z = pos.z;
    this.scene.add(obj.mesh);
  }
}


export default World;
