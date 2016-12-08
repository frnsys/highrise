import $ from 'jquery';
import _ from 'underscore';
import Layout from '../Layout';
import Objekt from '../Objekt';

class ObjektDesigner {
  constructor(cellSize, ui) {
    this.widthInput = $('#object-width');
    this.depthInput = $('#object-depth');
    this.canvas = $('#object-canvas');
    this.selectedCells = [];

    $('#add-object').on('click', () => {
      if (ui.floor && this.selectedCells.length > 0) {
        var width = this.widthInput.val(),
            depth = this.depthInput.val(),
            layout = Layout.rect(width, depth, 0);
        _.each(this.selectedCells, c => {
          var [x,y] = c;
          layout[y][x] = 1;
        });
        layout = Layout.trim(layout);
        var obj = new Objekt(cellSize, layout);
        ui.floor.mesh.add(obj.mesh);
        ui.selected = obj.mesh;
      }
    });

    $('#clear-object').on('click', () => {
      this.selectedCells = [];
      this.updateCanvas();
    });

    this.canvas.on('click', '.object-canvas-cell', ev => {
      var cell = $(ev.target),
          coord = _.map(cell.data('coord').split(','), i => parseInt(i));
      cell.toggleClass('selected');
      if (cell.hasClass('selected')) {
        this.selectedCells.push(coord);
      } else {
        this.selectedCells = _.filter(this.selectedCells, c => {
          return !_.isEqual(c, coord);
        });
      }
    });

    $('#object-width, #object-depth').on('change', () => {
      this.updateCanvas();
    });
    this.updateCanvas();
  }

  isSelected(pos) {
    return _.any(this.selectedCells, p => _.isEqual(p, pos));
  }

  updateCanvas() {
    var width = this.widthInput.val(),
        depth = this.depthInput.val();
    this.canvas.empty();
    _.each(_.range(depth), i => {
      this.canvas.append(`
        <div class="object-canvas-row">
          ${_.map(_.range(width), j => `
            <div class="object-canvas-cell ${this.isSelected([j,i]) ? 'selected' : ''}"
                 data-coord="${j},${i}"></div>`).join('')}
        </div>`);
    });
    this.selectedCells = _.filter(this.selectedCells, c => {
      return c[0] < width && c[1] < depth;
    });
  }
}

export default ObjektDesigner;
