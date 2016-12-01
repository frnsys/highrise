import * as THREE from 'three';

class Objekt {
  constructor(width, depth, props) {
    var geometry = new THREE.BoxGeometry(width,depth,1),
      material = new THREE.MeshLambertMaterial({
        color: 0x222222,
        opacity: 0.8,
        transparent: true
      });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, this.mesh.geometry.parameters.height/2);
    this.mesh.kind = 'obstacle';
    this.mesh.obj = this;
    this.mesh.geometry.computeBoundingBox();
    this.props = props || {};
  }

  get size() {
    var bbox = this.mesh.geometry.boundingBox;
    // round b/c of floating blehs
    return {
        width: Math.round(bbox.max.x - bbox.min.x),
        depth: Math.round(bbox.max.y - bbox.min.y),
        height: Math.round(bbox.max.z - bbox.min.z)
    };
  }

  get adjSize() {
    var bbox = new THREE.Box3().setFromObject(this.mesh);
    // round b/c of floating blehs
    return {
        width: Math.round(bbox.max.x - bbox.min.x),
        height: Math.round(bbox.max.y - bbox.min.y),
        depth: Math.round(bbox.max.z - bbox.min.z)
    };
  }
}

export default Objekt;
