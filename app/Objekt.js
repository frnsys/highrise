import _ from 'underscore';
import * as THREE from 'three';
import Layout from './Layout';

class Objekt {
  constructor(cellSize, layout, props) {
    this.layout = new Layout(layout);
    this.depth = this.layout.height;
    this.width = this.layout.width;
    this.cellSize = cellSize;

    var height = 1;
    var shape = new THREE.Shape(),
        vertices = this.layout.computeVertices(),
        start = vertices[0];

    // draw the shape
    shape.moveTo(start[0] * this.cellSize, start[1] * this.cellSize);
    _.each(_.rest(vertices), v => {
      shape.lineTo(v[0] * this.cellSize, v[1] * this.cellSize);
    });
    shape.lineTo(start[0] * this.cellSize, start[1] * this.cellSize);
    var geometry = new THREE.ExtrudeGeometry(shape, {amount:height,bevelEnabled:false}),
        material = new THREE.MeshLambertMaterial({
          color: 0x222222,
          opacity: 0.8,
          transparent: true
        });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.kind = 'object';
    this.mesh.obj = this;
    this.mesh.geometry.computeBoundingBox();
    this.props = props || {};
    this.tags = [];
    this.coords = [];
  }

  get size() {
    // box independent of transforms
    var bbox = this.mesh.geometry.boundingBox;
    // round b/c of floating blehs
    return {
        width: Math.round(bbox.max.x - bbox.min.x),
        depth: Math.round(bbox.max.y - bbox.min.y),
        height: Math.round(bbox.max.z - bbox.min.z)
    };
  }

  get adjacentCoords() {
    var steps = [
      {x:0,y:1},
      {x:0,y:-1},
      {x:1,y:0},
      {x:-1,y:0},
      {x:1,y:1},
      {x:1,y:-1},
      {x:-1,y:1},
      {x:-1,y:-1}
    ];
    return _.chain(this.coords).map(c => {
      return _.map(steps, s => ({
        x: c.x+s.x,
        y: c.y+s.y
      }));
    }).flatten().uniq().value();
  }

  get bbox() {
    // bbox with transforms
    var bbox = new THREE.Box3().setFromObject(this.mesh);
    // round b/c of floating blehs
    return {
        width: Math.round(bbox.max.x - bbox.min.x),
        depth: Math.round(bbox.max.z - bbox.min.z),
        height: Math.round(bbox.max.y - bbox.min.y)
    };
  }
}

export default Objekt;
