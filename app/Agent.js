import * as THREE from 'three';

class Agent {
  constructor(x, y) {
    var geometry = new THREE.BoxGeometry(1,1,1),
        material = new THREE.MeshLambertMaterial();
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, this.mesh.geometry.parameters.height/2, 0);
    this.position = {x:x, y:y};
  }
}

export default Agent;
