import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';

const colors = {
  obstacle: 0xff0000,
  target:   0x00ff00,
  path:     0x0000ff
};

class World {
  constructor(cellSize, rows, cols, scene) {
    this.cellSize = cellSize;
    this.rows = rows;
    this.cols = cols;
    this.scene = scene;
    this.setupGround();
    this.setupAnnotations();
    scene.selectables.push(this.plane);

    this.highlighted = {};
    this.obstacles = [];
    this.setTarget(1, 1);

    this.grid = new PF.Grid(this.rows, this.cols);
    this.finder = new PF.AStarFinder({
      allowDiagonal: true,
      dontCrossCorners: true
    });
  }

  setupGround() {
    var planeWidth = this.cellSize * this.rows,
        planeDepth = this.cellSize * this.cols,
        planeGeometry = new THREE.PlaneGeometry(planeWidth, planeDepth),
        planeMaterial = new THREE.MeshLambertMaterial({
          opacity: 0.6,
          transparent: true,
          color: 0xAAAAAA
        });
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.plane.rotation.x = -Math.PI/2;
    this.plane.position.set(0, 0, 0);
    this.scene.add(this.plane);

    var gridHelper = new THREE.GridHelper(this.rows * (this.cellSize/2), this.rows);
    this.scene.add(gridHelper);
  }

  setupAnnotations() {
    var loader = new THREE.FontLoader(),
        height = 0.5,
        textMat = new THREE.MeshLambertMaterial({
          color: 0xaaaaaa
        });
    loader.load('/assets/helvetiker.json', resp => {
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

  setObstacle(x, y) {
    this.unhighlightPos(x, y);
    this.highlightPos(x, y, 'obstacle');
    this.obstacles.push({x:x, y:y})
    this.grid.setWalkableAt(x, y, false);
  }

  removeObstacle(x, y) {
    var existing = _.findWhere(this.obstacles, {x:x, y:y});
    this.obstacles = _.without(this.obstacles, existing);
    this.unhighlightPos(x, y);
    this.grid.setWalkableAt(x, y, true);
  }

  setTarget(x, y) {
    if (this.target) {
      this.unhighlightPos(this.target.x, this.target.y);
    }
    this.unhighlightPos(x, y);
    this.highlightPos(x, y, 'target');
    this.target = {x:x, y:y};
  }

  posKey(x, y) {
    return `${x}_${y}`;
  }

  existingHighlight(x, y) {
    var key = this.posKey(x, y);
    if (key in this.highlighted) {
      return this.highlighted[key].type;
    }
  }

  highlightPos(x, y, type) {
    var key = this.posKey(x, y);
    if (key in this.highlighted) {
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
    p.position.set(pos.x, 0.01, pos.z);
    this.scene.add(p);
    this.highlighted[key] = {
      mesh: p,
      type: type
    };
  }

  unhighlightPos(x, y) {
    var key = this.posKey(x, y);
    if (key in this.highlighted) {
      var highlight = this.highlighted[key];
      this.scene.remove(highlight.mesh);
      if (highlight.type === 'target') {
        this.target = null;
      }
      delete this.highlighted[key];
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
      this.grid.clone());
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
}


export default World;
