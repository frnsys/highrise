import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';

const speed = 8;

class Agent {
  constructor(world, pos, floor, color=0xffffff) {
    var geometry = new THREE.BoxGeometry(1,1,1),
        material = new THREE.MeshLambertMaterial({color: color});
    geometry.translate(world.cellSize/2, world.cellSize/2, 0);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.geometry.computeBoundingBox();
    this.route = [];
    this.world = world;
    this.floor = floor;
    this.color = color;
    floor.place(this, pos.x, pos.y);
  }

  goTo(target, onArrive=_.noop, smooth=false) {
    var route = this.world.navigator.findRouteToTarget(this, target);
    this.route = _.map(route, leg => {
      // though smoothing sometimes causes corner clipping...
      var path = smooth ? PF.Util.smoothenPath(leg.surface.grid, leg.path) : leg.path;
      return {
        surface: leg.surface,
        // convert to world coordinates
        path: _.map(path, p => {
          return leg.surface.coordToPos(p[0], p[1]);
        })
      }
    });
    this.onArrive = onArrive;
    return route;
  }

  update(delta) {
    if (this.route.length === 0) {
      return;
    }
    var leg = this.route[0],
        target = leg.path[0];
    target = new THREE.Vector3(target.x, target.y, this.mesh.position.z);
    var vel = target.clone().sub(this.mesh.position);

    // it seems the higher the speed,
    // the higher this value needs to be to prevent stuttering
    if (vel.lengthSq() > 0.04) {
      vel.normalize();
      this.mesh.position.add(vel.multiplyScalar(delta * speed));
      this.mesh.lookAt(target);

      this.position = leg.surface.posToCoord(this.mesh.position.x, this.mesh.position.y);
      this.floor = leg.surface;
    } else {
      leg.path.shift();

      // end of this leg
      if (!leg.path.length) {
        this.route.shift();

        // arrived
        if (!this.route.length) {
          console.log('made it!');
          this.onArrive();
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
