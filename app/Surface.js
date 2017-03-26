import _ from 'underscore';
import uuid from 'uuid';
import PF from 'pathfinding';
import Layout from './Layout';
import * as THREE from 'three';

const colors = {
  obstacle: 0xff0000,
  target:   0x00ff00,
  marker:   0xf4e842
};

const WALL = 2;

class Surface {
  constructor(cellSize, layout, pos, color=0xaaaaaa) {
    this.id = uuid();
    this.layout = new Layout(layout);
    this.rows = this.layout.height;
    this.cols = this.layout.width;
    this.cellSize = cellSize;
    this.obstacles = [];
    this.highlighted = {};
    this.setupMesh(pos, color);
    this.grid = new PF.Grid(this.cols, this.rows);

    // set empty spaces in layout
    _.each(this.layout.emptyPositions, p => {
      var [x,y] = p;
      this.setObstacle(x, y, false);
    });

    // set walls
    _.each(this.layout.positionsValued(WALL), p => {
      var [x,y] = p;
      this.setObstacle(x, y, true);
    });

    this.debug();
  }

  setupMesh(pos, color) {
    var shape = new THREE.Shape(),
        vertices = this.layout.computeVertices(),
        start = vertices[0];

    // draw the shape
    shape.moveTo(start[0] * this.cellSize, start[1] * this.cellSize);
    _.each(_.rest(vertices), v => {
      shape.lineTo(v[0] * this.cellSize, v[1] * this.cellSize);
    });
    shape.lineTo(start[0] * this.cellSize, start[1] * this.cellSize);

    var geo = new THREE.ShapeGeometry(shape),
        mat = new THREE.MeshLambertMaterial({
          opacity: 0.6,
          transparent: true,
          color: color
        });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI/2;
    this.mesh.rotation.z = -Math.PI/2;
    this.mesh.position.copy(pos);
    this.mesh.kind = 'surface';
    this.mesh.obj = this;
  }

  coordKey(x, y) {
    return `${x}_${y}`;
  }

  highlightCoord(x, y, kind, color) {
    var key = this.coordKey(x, y);
    if (key in this.highlighted) {
      this.unhighlightCoord(x, y);
    }
    var pos = this.coordToPos(x, y),
        geo = new THREE.PlaneGeometry(this.cellSize, this.cellSize),
        mat = new THREE.MeshLambertMaterial({
          opacity: 0.6,
          transparent: false,
          color: color || colors[kind],
          side: THREE.DoubleSide
        }),
        p = new THREE.Mesh(geo, mat);

    // so the bottom-left corner is the origin
    geo.applyMatrix(
      new THREE.Matrix4().makeTranslation(this.cellSize/2, this.cellSize/2, 0));

    p.position.set(pos.x, pos.y, 0.01);
    this.mesh.add(p);
    this.highlighted[key] = {
      mesh: p,
      kind: kind
    };
  }

  unhighlightCoord(x, y) {
    var key = this.coordKey(x, y);
    if (key in this.highlighted) {
      var highlight = this.highlighted[key];
      this.mesh.remove(highlight.mesh);
      delete this.highlighted[key];
    }
  }

  existingHighlight(x, y) {
    var key = this.coordKey(x, y);
    if (key in this.highlighted) {
      return this.highlighted[key].kind;
    }
  }

  setObstacle(x, y, highlight=true) {
    this.obstacles.push({x:x, y:y})
    this.grid.setWalkableAt(x, y, false);
    if (highlight) {
      this.unhighlightCoord(x, y);
      this.highlightCoord(x, y, 'obstacle');
    }
  }

  removeObstacle(x, y) {
    var existing = _.findWhere(this.obstacles, {x:x, y:y});
    this.obstacles = _.without(this.obstacles, existing);
    this.grid.setWalkableAt(x, y, true);
    this.unhighlightCoord(x, y);
  }

  setPath(x, y, color) {
    this.highlightCoord(x, y, 'path', color);
  }

  removePath(x, y) {
    var key = this.coordKey(x, y);
    if (this.existingHighlight(x, y) === 'path') {
      this.unhighlightCoord(x, y);
    }
  }

  highlightPath(path, color=0x0000ff) {
    _.each(path, pos => {
      this.setPath(pos[0], pos[1], color);
    });
  }

  coordToPos(x, y) {
    return {
      x: x * this.cellSize,
      y: y * this.cellSize
    };
  }

  posToCoord(x, y) {
    return {
      x: Math.floor(x/this.cellSize),
      y: Math.floor(y/this.cellSize)
    };
  }

  validCoord(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  occupiedCoord(x, y) {
    return _.any(this.obstacles, o => _.isEqual(o, {x:x, y:y}));
  }

  annotate() {
    var loader = new THREE.FontLoader(),
        height = 0.5,
        textMat = new THREE.MeshLambertMaterial({
          color: 0xaaaaaa
        });
    loader.load('/font', resp => {
      _.each([
        {t: 'y+', x: -5, y: this.cols},
        {t: 'x+', x: this.rows, y: 0},
        {t: '0,0', x: -1, y: -5}
      ], d => {
        var textGeo = new THREE.TextGeometry(d.t, {font:resp, size:2, height:height}),
            text = new THREE.Mesh(textGeo, textMat),
            pos = this.coordToPos(d.x, d.y);
        text.position.set(pos.x,pos.y,height/2);
        this.mesh.add(text);
      });
    });
  }

  showAxes() {
    var axes = new THREE.AxisHelper(1);
    this.mesh.add(axes);
  }

  debug() {
    this.annotate();
    this.showAxes();
  }
}

export default Surface;
