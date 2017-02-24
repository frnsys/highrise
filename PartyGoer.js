import _ from 'underscore';
import Agent from './app/Agent';

const ACTIONS = [
  'bathroom',
  'eat',
  'drink alcohol',
  'drink water'
];

function manhattanDistance(coord_a, coord_b) {
  return Math.abs(coord_a.x - coord_b.x) + Math.abs(coord_a.y - coord_b.y);
}

class PartyGoer extends Agent {
  actions(state) {
    // all actions are possible
    return ACTIONS;
  }

  successor(action, state) {
    switch (action) {
        case 'bathroom':
          state.bladder = Math.max(state.bladder-5, 0);
          break;
        case 'eat':
          state.hunger = Math.max(state.hunger-5, 0);
          break;
        case 'drink alcohol':
          state.thirst = Math.max(state.thirst-5, 0);
          state.bladder += 5;
          state.bac += 1;
          break;
        case 'drink water':
          state.thirst = Math.max(state.thirst-5, 0);
          state.bladder += 4;
          break;
    }
    state.hunger += 1;
    state.thirst += 1;
    state.bac = Math.max(state.bac - 0.2, 0);
    state.coord = {x: 10, y: 10};
    return state;
  }

  utility(state, show_factors=false) {
    var factors = {
      bac: (-Math.pow(state.bac/3 - 3, 2) + 9),
      bladder: -Math.pow(state.bladder/50, 3),
      hunger: -Math.pow(state.hunger/50, 3),
      thirst: -Math.pow(state.thirst/50, 3),
      dist: manhattanDistance(this.state.coord, state.coord)
    };

    // to determine how important each factor is
    if (show_factors) {
      var mass = _.reduce(factors, (acc, val) => acc + Math.abs(val), 0);
      _.each(factors, (val, name) => {
        console.log(`${name}\t->\t${(Math.abs(val)/mass * 100).toFixed(2)}%\t(${val < 0 ? '-' : '+'})`);
      });
      console.log('---');
    }

    return _.reduce(factors, (acc, val) => acc + val, 0);
  }
}

export default PartyGoer;
