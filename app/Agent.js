import * as THREE from 'three';

class Agent {
  constructor() {
    var geometry = new THREE.BoxGeometry(1,1,1),
        material = new THREE.MeshLambertMaterial();
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, this.mesh.geometry.parameters.height/2);
    this.mesh.geometry.computeBoundingBox();
  }
}

export default Agent;
