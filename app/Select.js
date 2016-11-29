import * as THREE from 'three';

class SelectUI {
  constructor(scene, onSelect) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.mouse = new THREE.Vector2();

    scene.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    scene.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), false);
  }

  onTouchStart(ev) {
    ev.preventDefault();
    ev.clientX = ev.touches[0].clientX;
    ev.clientY = ev.touches[0].clientY;
    this.onMouseDown(ev);
  }

  onMouseDown(ev) {
    ev.preventDefault();

    // adjust browser mouse position for three.js scene
    this.mouse.x = (ev.clientX/this.scene.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(ev.clientY/this.scene.renderer.domElement.clientHeight) * 2 + 1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.mouse, this.scene.camera);

    var intersects = raycaster.intersectObjects(this.scene.selectables);
    if (intersects.length > 0) {
      var obj = intersects[0].object,
          pos = intersects[0].point;
      this.onSelect(obj, pos, ev);
    }
  }
}

export default SelectUI;
