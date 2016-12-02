import dat from 'dat-gui';
import _ from 'underscore';
import * as THREE from 'three';

class PropsUI {
  constructor(obj, props) {
    this.gui = new dat.GUI();
    this.controllers = {};
    this.props = props;

    // hardcoded properties
    var conf = {
      color: '#000000',
      tags: obj.tags.join(',')
    };
    var color = this.gui.addColor(conf, 'color');
    var tags = this.gui.add(conf, 'tags');
    color.onChange(function(value) {
      obj.mesh.material.color = new THREE.Color(value);
    });
    tags.onFinishChange(function(value) {
      obj.tags = value.split(',');
    });

    // the actual property values
    this.propsF = this.gui.addFolder('props');
    _.each(props, (v,k) => {
      this.controllers[k] = this.propsF.add(props, k);
    });
    this.propsF.open();

    // adding new properties
    var self = this;
    this.newProp = {
      name:'',
      type: 'num',
      add: function() {
        if (this.name && !(this.name in props)) {
          switch (this.type) {
              case 'str':
                props[this.name] = 'hi';
                break;
              case 'num':
                props[this.name] = 0;
                break;
              case 'bool':
                props[this.name] = false;
                break;
          }
          self.controllers[this.name] = self.propsF.add(props, this.name);
          self.resetRmProps();
        }
      }
    };
    this.newPropF = this.gui.addFolder('add prop');
    this.newPropF.add(this.newProp, 'name');
    this.newPropF.add(this.newProp, 'type', ['num', 'bool', 'str']);
    this.newPropF.add(this.newProp, 'add');
    this.newPropF.open();

    // removing properties
    this.rmProp = {
      name: '',
      remove: function() {
        if (this.name in props) {
          self.propsF.remove(self.controllers[this.name]);
          delete self.controllers[this.name];
          delete props[this.name];
          self.resetRmProps();
        }
      }
    }
    this.rmPropF = this.gui.addFolder('rm prop');
    this.rmPropButton = this.rmPropF.add(this.rmProp, 'remove');
    this.rmPropNames = this.rmPropF.add(this.rmProp, 'name', Object.keys(props));
  }

  resetRmProps() {
    this.rmPropNames.remove();
    this.rmPropButton.remove();
    this.rmPropNames = this.rmPropF.add(this.rmProp, 'name', Object.keys(this.props));
    this.rmPropButton = this.rmPropF.add(this.rmProp, 'remove');
  }

  destroy() {
    this.gui.destroy();
  }
}

export default PropsUI;
