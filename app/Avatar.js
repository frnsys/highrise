import $ from 'jquery';
import _ from 'underscore';
import PF from 'pathfinding';
import * as THREE from 'three';

const speed = 24;

class Avatar {
  constructor(world, coord, floor, color) {
    this.height = world.cellSize;
    this.width = world.cellSize;
    this.depth = world.cellSize;
    var geometry = new THREE.BoxGeometry(this.width,this.depth,this.height),
        material = new THREE.MeshLambertMaterial({color: color});
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.geometry.computeBoundingBox();
    this.mesh.kind = 'agent';
    this.route = [];
    this.world = world;
    this.floor = floor;
    this.color = color;
    this.world.scene.selectables.push(this.mesh);

    var pos = floor.coordToPos(coord.x, coord.y);
    this.mesh.position.copy(this.adjustPosition(pos));
    this.floor.mesh.add(this.mesh);
    this.position = {x:coord.x, y:coord.y};
  }

  adjustPosition(pos) {
    // set the position in this way
    // instead of using geometry.translate
    // because Object3D.lookAt does not support translated objects
    // and makes things weird if you try
    return new THREE.Vector3(
      pos.x + this.world.cellSize/2,
      pos.y + this.world.cellSize/2,
      this.height/2
    );
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
    this.updateBubblePosition();

    if (this.route.length === 0 || this.world.paused) {
      return;
    }
    var leg = this.route[0],
        target = leg.path[0];
    target = this.adjustPosition(target);
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
          log.info('made it!');
          this.onArrive();
        } else {
          THREE.SceneUtils.attach(
            this.mesh,
            leg.surface.mesh.parent,
            this.route[0].surface.mesh);

          var startPos = this.route[0].path[0];
          this.mesh.position.copy(this.adjustPosition(startPos));
        }
      }
    }
  }

  get abovePosition() {
    if (this.mesh) {
      var pos = new THREE.Vector3();
      pos.setFromMatrixPosition(this.mesh.matrixWorld);
//      pos.y += 2; // a little y offset
      return toXYCoords(pos, this.world.scene.camera);
    }
  }
// use data
  showBubble(data) {
		if($("#" + data.id + "-agent-" + data.type).length == 0) {
			// create thought if none exists
    	$("#agent-" + data.type + "-bubbles").append("<div id='" + data.id + "-agent-" + data.type + "' class='agent-bubble agent-" + data.type + "-bubble'><div class=inner></div></div>")
		}
    if(!this.thoughts) { this.thoughts = {}; }
    if(!this.thoughtTimeouts) { this.thoughtTimeouts = {}; }

		this.thoughts[data.type] = $("#" + data.id + "-agent-" + data.type);
    this.thoughts[data.type].children(".inner").html(data.text);

    this.updateBubblePosition();

    if (this.thoughtTimeouts[data.type]) {
      clearTimeout(this.thoughtTimeouts[data.type]);
    }
    if(data.duration > 0) {
      this.thoughtTimeouts[data.type] = setTimeout(() => {
        if (this.thoughts[data.type]) {
          this.thoughts[data.type].remove();
          this.thoughts[data.type] = null;
        }
        data.callback();
      }, data.duration);
    }
  }

  updateBubblePosition() {
    if(this.thoughts) {
      _.each(this.thoughts, (v, k) => {
        if(v) {
          var pos = this.abovePosition;
          if (pos) {
						var vheight = v.children(".inner").height();
            v.css({top:pos.y - vheight,left:pos.x});
          }
        }
      });
    }
  }


}

function toXYCoords(pos, camera) {
	var vector = pos.clone().project(camera);
	vector.x = (vector.x + 1)/2 * $('#stage').width();
	vector.y = -(vector.y - 1)/2 * $('#stage').height();
	return vector;
}



export default Avatar;

