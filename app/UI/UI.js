import $ from 'jquery';
import _ from 'underscore';
import * as THREE from 'three';
import PropsUI from './Props';

function showAgent(agent) {
  var html = Object.keys(agent.state).map(k => {
    var v = agent.state[k];
    if (typeof v == 'number') {
      v = v.toFixed(2);
    }
    return `<li>${k}: ${v}</li>`;
  });
  var actionName = agent.action.name === 'continue' ? agent._prevAction.name : agent.action.name;
  document.getElementById('agent').innerHTML = `<ul><li>${agent.id}</li>${html.join('')}<li>Action: ${actionName}</li></ul>`;
}

class UI {
  constructor(world) {
    this.world = world;
    this.scene = world.scene;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.selected = null;
    this.editing = null;
    this.floor = null;
    this.propsUI = null;

    this.selectedColor = new THREE.Color(0x9CF5FF);
    this.unselectedColor = new THREE.Color(0xaaaaaa);

    this.scene.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.scene.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    this.scene.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    document.addEventListener('keydown', this.onKeyDown.bind(this), false);
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

  objectCoords(obj) {
    // convert an object's position
    // to its occupied grid coords, relative to the floor
    var coord = this.floor.posToCoord(obj.position.x, obj.position.y);
    return _.map(obj.obj.layout.filledPositions, p => ({x: coord.x + p[0], y: coord.y + p[1]}));
  }

  onSelect(obj, pos, ev) {
    if (ev.buttons === 1) {
      // select floor
      if (!this.selected) {
        if (obj.kind === 'floor') {
          this.floor = obj.obj;

          // highlight selected floor
          _.each(this.world.surfaces, s => {
            s.mesh.material.opacity = 0.3;
            s.mesh.material.color = this.unselectedColor;
          });
          this.floor.mesh.material.opacity = 0.6;
          this.floor.mesh.material.color = this.selectedColor;

        } else if (obj.kind === 'agent') {
          showAgent(obj.agent);
          this.selectedAgent = obj.agent;

        // pick up object
        } else if (obj.kind === 'object') {
          // if this is already the object
          // we're editing, pick it up
          if (this.editing === obj) {
            this.selected = obj;
            _.each(
              this.objectCoords(obj),
              pos => this.floor.removeObstacle(pos.x, pos.y));
            this.world.objects = _.without(this.world.objects, obj.obj);
            this.scene.selectables = _.without(this.scene.selectables, obj);
            obj.obj.coords = [];
            obj.obj.floor = null;

          // otherwise now we're editing this one
          } else {
            if (this.propsUI) {
              this.propsUI.destroy();
            }
            this.propsUI = new PropsUI(obj.obj, obj.obj.props);
            this.editing = obj;
          }
        }

      // place object
      } else {
        var coords = this.objectCoords(this.selected);
        if (_.all(coords, c =>
            this.floor.validCoord(c.x, c.y) && !this.floor.occupiedCoord(c.x, c.y))) {
          _.each(coords, pos => this.floor.setObstacle(pos.x, pos.y));
          this.scene.selectables.push(this.selected);
          this.world.objects.push(this.selected.obj);
          this.selected.obj.coords = coords;
          this.selected.obj.floor = this.floor;
          this.selected = null;
        }
      }
    } else if (ev.buttons === 2) {
      switch (obj.kind) {
        // remove object
        case 'object':
          _.each(
            this.objectCoords(obj),
            pos => this.floor.removeObstacle(pos.x, pos.y));
          this.floor.mesh.remove(obj);
          if (this.editing === obj) {
            this.propsUI.destroy();
            this.editing = null;
          }
          break;
      }
    }
  }

  onMouseMove(ev) {
    if (this.selected && this.floor) {
      this.updateMouse(ev);
      this.raycaster.setFromCamera(this.mouse, this.scene.camera);

      var intersects = this.raycaster.intersectObject(this.floor.mesh);
      if (intersects.length > 0) {
        var pos = intersects[0].point;
        pos = this.floor.mesh.worldToLocal(pos);
        pos = this.floor.posToCoord(pos.x, pos.y);
        pos = this.floor.coordToPos(pos.x, pos.y);
        this.selected.position.set(pos.x, pos.y, 0);
      }
    }
  }

  onKeyDown(ev) {
    if ($(ev.target).closest('input')[0]) {
        return;
    }

    switch (ev.keyCode) {
      case 82: // r
        if (this.selected) {
          var obj = this.selected.obj;
          obj.rotate();
          this.selected = obj.mesh;
        }
        break;
      case 65: // a
        $('#add-object').click();
        break;
      case 80: // p
        this.world.paused = !this.world.paused;
        break;
    }
  }

  update() {
    if (this.selectedAgent) {
      showAgent(this.selectedAgent);
    }
  }
}

export default UI;
