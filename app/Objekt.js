import _ from 'underscore';
import * as THREE from 'three';
import Layout from './Layout';

class Objekt {
  constructor(cellSize, width, depth, props) {
    this.width = width;
    this.depth = depth;

    var height = 1;
    var geometry = new THREE.BoxGeometry(width*cellSize, depth*cellSize, height*cellSize),
      material = new THREE.MeshLambertMaterial({
        color: 0x222222,
        opacity: 0.8,
        transparent: true
      });

    // set origin to be bottom-left corner
    geometry.applyMatrix(
      new THREE.Matrix4().makeTranslation((width*cellSize)/2, (depth*cellSize)/2, (height*cellSize)/2));

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
