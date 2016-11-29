import * as THREE from 'three';

class Objekt {
  constructor(width, depth) {
    var geometry = new THREE.BoxGeometry(width,depth,1),
        material = new THREE.MeshLambertMaterial({color: 0x222222});
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, this.mesh.geometry.parameters.height/2);
    this.mesh.kind = 'obstacle';
    this.mesh.obj = this;
  }

  get size() {
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
