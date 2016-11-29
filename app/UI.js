import _ from 'underscore';
import * as THREE from 'three';

class UI {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.selected = null;

    this.scene.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.scene.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    this.scene.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  }

  updateMouse(ev) {
    // adjust browser mouse position for three.js scene
    this.mouse.x = (ev.clientX/this.scene.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(ev.clientY/this.scene.renderer.domElement.clientHeight) * 2 + 1;
  }

  onTouchStart(ev) {
    ev.preventDefault();
    ev.clientX = ev.touches[0].clientX;
    ev.clientY = ev.touches[0].clientY;
    this.onMouseDown(ev);
  }

  onMouseDown(ev) {
    ev.preventDefault();
    this.updateMouse(ev);
    this.raycaster.setFromCamera(this.mouse, this.scene.camera);

    var intersects = this.raycaster.intersectObjects(this.scene.selectables);
    if (intersects.length > 0) {
      var obj = intersects[0].object,
          pos = intersects[0].point;
      this.onSelect(obj, pos, ev);
    }
  }

  onSelect(obj, pos, ev) {
    var pos = this.world.worldToGrid(pos.x, pos.z);
    if (ev.buttons === 1) {
      if (this.selected) {
        this.scene.selectables.push(this.selected);
        _.each(_.range(this.selected.obj.size.width), i => {
          _.each(_.range(this.selected.obj.size.depth), j => {
            this.world.setObstacle(pos.x-i, pos.y-j);
          });
        });
        this.selected = null;
      } else if (obj.type === 'obstacle') {
        this.selected = obj;
      }
    } else if (ev.buttons === 2) {
      switch (obj.type) {
          case 'obstacle':
            // remove obstacle
            pos = this.world.worldToGrid(obj.position.x, obj.position.z);
            this.world.removeObstacle(pos.x, pos.y);
            this.scene.remove(obj);
            break;
          case 'ground':
            // set target
            this.world.setTarget(pos.x, pos.y);
            break;
      }
    }
  }

  onMouseMove(ev) {
    if (this.selected) {
      this.updateMouse(ev);
      this.raycaster.setFromCamera(this.mouse, this.scene.camera);

      var intersects = this.raycaster.intersectObject(this.world.ground);
      if (intersects.length > 0) {
        var pos = intersects[0].point;
        pos = this.world.worldToGrid(pos.x, pos.z);
        pos = this.world.gridToWorld(pos.x, pos.y);
        var bbox = new THREE.Box3().setFromObject(this.selected),
            width = bbox.max.x - bbox.min.x,
            depth = bbox.max.z - bbox.min.z,
            offset = {
              x: (width - 1)/2,
              z: (depth - 1)/2
            };
        this.selected.position.set(pos.x - offset.x, this.selected.position.y, pos.z - offset.z);
      }
    }
  }
}

export default UI;
