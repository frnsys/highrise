import * as THREE from 'three';

class Agent {
  constructor(x, y, world) {
    var geometry = new THREE.BoxGeometry(1,1,1),
        material = new THREE.MeshLambertMaterial(),
        pos = world.gridToWorld(x, y);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(
      pos.x,
      this.mesh.geometry.parameters.height/2,
      pos.z);
    this.position = {x:x, y:y};
  }
}

export default Agent;
