import _ from 'underscore';
import Agent from '~/app/Agent';
import log from 'loglevel';

// map action names to their object tags
const ACTIONS = {
  'bathroom': 'bathroom',
  'eat': 'food',
  'drink_alcohol': 'alcohol',
  'drink_water': 'water'
};

function manhattanDistance(coord_a, coord_b) {
  return Math.abs(coord_a.x - coord_b.x) + Math.abs(coord_a.y - coord_b.y);
}

class PartyGoer extends Agent {
  constructor(name, state, world, temperature=0.01) {
    super(state, temperature);
    this.world = world;
    this.id = name;

    this.baseline = {
      sociability: state.sociability
    };
  }

  get actionTypes() {
    return Object.keys(ACTIONS).concat(['talk']);
  }

  actions(state) {
    var actions = Object.keys(ACTIONS).map(name => {
      var tag = ACTIONS[name];
      return this.world.objectsWithTag(tag).map(obj => {
        var coord = obj.adjacentCoords[0];
        return {
          name: name,
          coord: coord
        }
      });
    });

    // flatten
    actions = [].concat(...actions);

    // talking
    this.world.socialNetwork.nodes.map(other => {
      if (other !== this.id) {
        actions.push({
          name: 'talk',
          to: other,
        });
      }
    });
    return actions;
  }

  successor(action, state) {
    state.talking = [];
    switch (action.name) {
        case 'bathroom':
          state.bladder = Math.max(state.bladder-5, 0);
          break;
        case 'eat':
          state.hunger = Math.max(state.hunger-5, 0);
          break;
        case 'drink_alcohol':
          state.thirst = Math.max(state.thirst-5, 0);
          state.bladder += 5;
          state.bac += 1;
          break;
        case 'drink_water':
          state.thirst = Math.max(state.thirst-5, 0);
          state.bladder += 4;
          break;
        case 'talk':
          state.boredom = Math.max(state.boredom-2, 0);
          state.talking.push(action.to);
          break;
    }
    state.hunger += 1;
    state.thirst += 1;
    state.boredom += 1;
    state.bac = Math.max(state.bac - 0.2, 0);
    if (action.coord) {
      state.coord = action.coord;
    }
    state.sociability = this.baseline.sociability + Math.pow(state.bac, 2);
    return state;
  }

  utility(state, prev_state, show_factors=false) {
    prev_state = prev_state || this.state;
    var affinities = {};
    for (var other in this.world.socialNetwork.edges[this.id]) {
      var data = this.world.socialNetwork.edges[this.id][other];
      affinities[other] = data.affinity;
    }

    var factors = {
      bac: (-Math.pow(state.bac/3 - 3, 2) + 9),
      bladder: -Math.pow(state.bladder/50, 3),
      hunger: -Math.pow(state.hunger/50, 3),
      thirst: -Math.pow(state.thirst/50, 3),
      boredom: (-state.boredom + 1)/2,
      talking: state.talking.reduce((acc, val) => acc + (affinities[val] ? affinities[val] : state.sociability), 0)/10,
      dist: -manhattanDistance(prev_state.coord, state.coord)/50
    };

    // to determine how important each factor is
    if (show_factors) {
      var mass = _.reduce(factors, (acc, val) => acc + Math.abs(val), 0);
      _.each(factors, (val, name) => {
        log.info(`${name}\t->\t${(Math.abs(val)/mass * 100).toFixed(2)}%\t(${val < 0 ? '' : '+'}${val.toFixed(1)})`);
      });
      log.info('---');
    }

    return _.reduce(factors, (acc, val) => acc + val, 0);
  }
}

export default PartyGoer;
