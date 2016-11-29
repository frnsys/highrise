import * as THREE from 'three';

class Objekt {
  constructor(width, depth) {
    var geometry = new THREE.BoxGeometry(width,1,depth),
        material = new THREE.MeshLambertMaterial({color: 0x222222});
    this.size = {
      width: width,
      depth: depth,
      height: 1
    };
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, this.mesh.geometry.parameters.height/2, 0);
    this.mesh.type = 'obstacle';
    this.mesh.obj = this;
  }
}

export default Objekt;
