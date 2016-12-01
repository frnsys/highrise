import * as THREE from 'three';

const speed = 8;

class Agent {
  constructor() {
    var geometry = new THREE.BoxGeometry(1,1,1),
        material = new THREE.MeshLambertMaterial();
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, this.mesh.geometry.parameters.height/2);
    this.mesh.geometry.computeBoundingBox();

    this.route = [];
  }

  walk(route) {
    this.route = route;
  }

  update(delta) {
    if (this.route.length === 0) {
      return;
    }
    var leg = this.route[0],
        target = leg.path[0];
    target = new THREE.Vector3(target.x, target.y, this.mesh.position.z);
    var vel = target.clone().sub(this.mesh.position);
    if (vel.lengthSq() > 0.05 * 0.05) {
      vel.normalize();
      this.mesh.position.add(vel.multiplyScalar(delta * speed));
      this.mesh.lookAt(target);
    } else {
      leg.path.shift();

      // end of this leg
      if (!leg.path.length) {
        this.route.shift();

        // arrived
        if (!this.route.length) {
          console.log('made it!');
        } else {
          // TODO change parenting
          // TODO change position relative to parent
          // THREE.SceneUtils.attach(
          //   this.mesh,
          //   leg.surface.mesh.parent,
          //   this.route[0].surface.mesh);
          THREE.SceneUtils.attach(
            this.mesh,
            leg.surface.mesh.parent,
            this.route[0].surface.mesh);

          var startPos = this.route[0].path[0];
          console.log(this.mesh.position.z);
          this.mesh.position.set(startPos.x, startPos.y, this.mesh.geometry.parameters.height/2);
        }
      }
    }
  }
}

export default Agent;
