import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';

const speed = 8;

class Agent {
  constructor(world, pos, floor) {
    var geometry = new THREE.BoxGeometry(1,1,1),
        material = new THREE.MeshLambertMaterial();
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, this.mesh.geometry.parameters.height/2);
    this.mesh.geometry.computeBoundingBox();
    this.route = [];
    this.world = world;
    this.world.place(this, pos.x, pos.y, floor);
  }

  goTo(target) {
    var route = this.world.findRouteToTarget(this, target);
    this.route = _.map(route, leg => {
      // though smoothing sometimes causes corner clipping...
      var path = PF.Util.smoothenPath(leg.surface.grid, leg.path);
      return {
        surface: leg.surface,
        // convert to world coordinates
        path: _.map(path, p => {
          return leg.surface.gridToLocal(p[0], p[1]);
        })
      }
    });
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

      this.position = leg.surface.localToGrid(this.mesh.position.x, this.mesh.position.y);
      this.floor = leg.surface.floor; // TODO
    } else {
      leg.path.shift();

      // end of this leg
      if (!leg.path.length) {
        this.route.shift();

        // arrived
        if (!this.route.length) {
          console.log('made it!');
        } else {
          THREE.SceneUtils.attach(
            this.mesh,
            leg.surface.mesh.parent,
            this.route[0].surface.mesh);

          var startPos = this.route[0].path[0];
          this.mesh.position.set(startPos.x, startPos.y, this.mesh.geometry.parameters.height/2);
        }
      }
    }
  }
}

export default Agent;
