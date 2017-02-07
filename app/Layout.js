import _ from 'underscore';

class Layout {
  constructor(layout) {
    this.layout = layout;
    this.height = layout.length;
    this.width = layout[0].length;
  }

  static rect(rows, cols, val=1) {
    return _.map(_.range(rows), i => {
      return _.map(_.range(cols), j => val);
    });
  }

  static trim(layout) {
    // trim empty rows
    for (var rowStart=0; rowStart < layout.length; rowStart++) {
      if (_.any(layout[rowStart], v => v !== 0)) {
        break;
      }
    }
    for (var rowEnd=layout.length-1; rowEnd >= 0; rowEnd--) {
      if (_.any(layout[rowEnd], v => v !== 0)) {
        break;
      }
    }
    layout = layout.slice(rowStart,rowEnd+1);

    // trim empty cols
    var startCol = Infinity, endCol = -Infinity;
    _.each(layout, row => {
      for (var col=0; col < row.length; col++) {
        if (row[col] !== 0) {
          startCol = Math.min(startCol, col);
        }
      }
      for (var col=row.length-1; col >= 0; col--) {
        if (row[col] !== 0) {
          endCol = Math.max(endCol, col);
        }
      }
    });

    layout = _.map(layout, row => {
      return row.slice(startCol, endCol+1);
    });

    return layout;
  }

  rotate() {
    // clockwise
    this.layout = this.layout[0].map(
      (col, c) => this.layout.map(
        (row, r) => this.layout[r][c]).reverse())
    this.height = this.layout.length;
    this.width = this.layout[0].length;
  }

  convertPos(pos) {
    // convert a (0,0)-based position to array positioning
    return [pos[0], this.height - pos[1] - 1];
  }

  val(pos) {
    // layout value at specified position
    var [x, y] = pos;
    if (y >= this.height || x >= this.width) {
      return 0;
    } else if (y < 0 || x < 0) {
      return 0;
    }

    [x, y] = this.convertPos(pos);
    return this.layout[y][x];
  }

  possibleDirs(currentDir, pos) {
    var dirs = [];
    var [x, y] = pos;

    if (x + 1 <= this.width) {
      dirs.push([1,0]);
    }
    if (y + 1 <= this.height) {
      dirs.push([0,1]);
    }
    if (x - 1 >= 0) {
      dirs.push([-1,0]);
    }
    if (y - 1 >= 0) {
      dirs.push([0,-1]);
    }
    return _.filter(this.sortedDirs(currentDir), d => {
      return _.any(dirs, d_ => d[0] == d_[0] && d[1] == d_[1]);
    });
  }

  validDirs(currentDir, pos) {
    var [x, y] = pos,
        valid = [],
        possible = this.possibleDirs(currentDir, pos);
    _.each(possible, dir => {
      var [x_step, y_step] = dir,
          to_check;
      if (y_step == 1) {
        to_check = [[x,y], [x-1,y]];
      } else if (y_step == -1) {
        to_check = [[x,y-1], [x-1,y-1]];
      } else if (x_step == 1) {
        to_check = [[x,y], [x,y-1]];
      } else if (x_step == -1) {
        to_check = [[x-1,y], [x-1,y-1]];
      }
      if (this.isBoundary(to_check[0], to_check[1])) {
        valid.push(dir);
      }
    });
    return valid;
  }

  worldDir(dir) {
    if (!dir) {
        return 'north';
    }
    var [x, y] = dir;
    if (x == 1) {
        return 'east';
    } else if (y == 1) {
        return 'north';
    } else if (x == -1) {
        return 'west';
    } else if (y == -1) {
        return 'south';
    }
  }

  sortedDirs(currentDir) {
    var worldDir = this.worldDir(currentDir);
    switch (worldDir) {
        case 'north':
          return [[1,0], [0,1], [-1,0], [0,-1]];
        case 'west':
          return [[0,1], [-1,0], [0,-1], [1,0]];
        case 'south':
          return [[-1,0], [0,-1], [1,0], [0,1]];
        case 'east':
          return [[0,-1], [1,0], [0,1], [-1,0]];
    }
  }

  isBoundary(pos_a, pos_b) {
    return this.val(pos_a) != this.val(pos_b);
  }

  isEmpty(pos) {
    return this.val(pos) === 0;
  }

  get startPosition() {
    var layout = [...this.layout].reverse();
    for (var i=0; i < layout.length; i++) {
      var row = layout[i];
      for (var j=0; j < row.length; j++) {
        if (row[j] === 1) {
          return [j, i];
        }
      }
    }
  }

  get positions() {
    return _.chain(_.range(this.width)).map(x => {
      return _.map(_.range(this.height), y => {
        return [x, y];
      });
    }).flatten(true).value();
  }

  get positionsValues() {
    return _.chain(_.range(this.width)).map(x => {
      return _.map(_.range(this.height), y => {
        var pos = [x, y];
        return [pos, this.val(pos)];
      });
    }).flatten(true).value();
  }

  get emptyPositions() {
    return _.filter(this.positions, p => this.isEmpty(p));
  }

  get filledPositions() {
    return _.filter(this.positions, p => !this.isEmpty(p));
  }

  positionsValued(val) {
    return _.filter(this.positions, p => this.val(p) === val);
  }

  computeVertices() {
    var pos = this.startPosition,
        vertices = [],
        lastDir;

    while (true) {
      var [x, y] = pos,
          dirs = this.validDirs(lastDir, pos),
          newDir = dirs[0],
          newPos = [x + newDir[0], y + newDir[1]];
      if (!_.isEqual(lastDir, newDir)) {
        vertices.push(pos);
      }
      lastDir = newDir
      if (vertices.length > 0 && _.isEqual(newPos, vertices[0])) {
        break;
      }
      pos = newPos;
    }
    return vertices;
  }
}

export default Layout;
