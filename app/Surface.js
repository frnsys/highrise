import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';

const colors = {
  obstacle: 0xff0000,
  target:   0x00ff00,
  path:     0x0000ff
};

class Surface {
  constructor(cellSize, rows, cols, x, y, z) {
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;
    this.obstacles = [];
    this.highlighted = {};
    this.grid = new PF.Grid(this.rows, this.cols);
    this.setupMesh(x, y, z);
    this.annotate();
  }

  setupMesh(x, y, z) {
    var planeWidth = this.cellSize * this.rows,
        planeDepth = this.cellSize * this.cols,
        planeGeometry = new THREE.PlaneGeometry(planeWidth, planeDepth),
        planeMaterial = new THREE.MeshLambertMaterial({
          opacity: 0.1,
          transparent: true,
          color: 0xAAAAAA
        });
    this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    this.mesh.rotation.x = -Math.PI/2;
    this.mesh.position.set(x, y, z);
    this.mesh.kind = 'surface';
  }

  posKey(x, y) {
    return `${x}_${y}`;
  }

  highlightPos(x, y, kind) {
    var key = this.posKey(x, y);
    if (key in this.highlighted) {
      this.unhighlightPos(x, y);
    }
    var pos = this.gridToLocal(x, y),
        geo = new THREE.PlaneGeometry(this.cellSize, this.cellSize),
        mat = new THREE.MeshLambertMaterial({
          opacity: 0.6,
          transparent: false,
          color: colors[kind],
          side: THREE.DoubleSide
        }),
        p = new THREE.Mesh(geo, mat);
    p.position.set(pos.x, pos.y, 0.01);
    this.mesh.add(p);
    this.highlighted[key] = {
      mesh: p,
      kind: kind
    };
  }

  unhighlightPos(x, y) {
    var key = this.posKey(x, y);
    if (key in this.highlighted) {
      var highlight = this.highlighted[key];
      this.mesh.remove(highlight.mesh);
      if (highlight.kind === 'target') {
        this.target = null;
      }
      delete this.highlighted[key];
    }
  }

  existingHighlight(x, y) {
    var key = this.posKey(x, y);
    if (key in this.highlighted) {
      return this.highlighted[key].kind;
    }
  }

  setObstacle(x, y) {
    this.unhighlightPos(x, y);
    this.obstacles.push({x:x, y:y})
    this.grid.setWalkableAt(x, y, false);
    this.highlightPos(x, y, 'obstacle');
  }

  removeObstacle(x, y) {
    var existing = _.findWhere(this.obstacles, {x:x, y:y});
    this.obstacles = _.without(this.obstacles, existing);
    this.grid.setWalkableAt(x, y, true);
    this.unhighlightPos(x, y);
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

  place(obj, x, y) {
    var pos = this.gridToLocal(x, y);
    obj.mesh.position.x = pos.x;
    obj.mesh.position.y = pos.y;
    var bbox = new THREE.Box3().setFromObject(obj.mesh);
    obj.mesh.position.z = Math.round(bbox.max.z - bbox.min.z)/2;
    this.mesh.add(obj.mesh);
    obj.position = {x: x, y: y};
  }

  gridToLocal(x, y) {
    return {
      x: (x * this.cellSize) + this.cellSize/2 - (this.cellSize * this.rows)/2,
      y: (y * this.cellSize) + this.cellSize/2 - (this.cellSize * this.cols)/2
    };
  }

  localToGrid(x, y) {
    return {
      x: Math.round((x + (this.cellSize * this.rows)/2 - this.cellSize/2)/this.cellSize),
      y: Math.round((y + (this.cellSize * this.cols)/2 - this.cellSize/2)/this.cellSize)
    };
  }

  annotate() {
    var loader = new THREE.FontLoader(),
        height = 0.5,
        textMat = new THREE.MeshLambertMaterial({
          color: 0xaaaaaa
        });
    loader.load('assets/helvetiker.json', resp => {
      _.each([
        {t: 'y+', x: 0, y: this.cols},
        {t: 'x+', x: this.rows, y: 0},
        {t: '0,0', x: -4, y: -4}
      ], d => {
        var textGeo = new THREE.TextGeometry(d.t, {font:resp, size:2, height:height}),
            text = new THREE.Mesh(textGeo, textMat),
            pos = this.gridToLocal(d.x, d.y);
        text.position.set(pos.x,pos.y,height/2);
        this.mesh.add(text);
      });
    });
  }
}

export default Surface;
