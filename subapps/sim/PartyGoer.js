import _ from 'underscore';
import Agent from '~/app/Agent';

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
  constructor(name, state, socialNetwork, temperature=0.01) {
    super(state, temperature);
    this.socialNetwork = socialNetwork;
    this.id = name;

    this.baseline = {
      sociability: state.sociability
    };
  }

  actions(state) {
    // all actions are possible
    var actions = ACTIONS.map(name => ({name: name}));

    // talking
    this.socialNetwork.nodes.map(other => {
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
        case 'drink alcohol':
          state.thirst = Math.max(state.thirst-5, 0);
          state.bladder += 5;
          state.bac += 1;
          break;
        case 'drink water':
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
    state.coord = {x: 10, y: 10};
    state.sociability = this.baseline.sociability + Math.pow(state.bac, 2);
    return state;
  }

  utility(state, show_factors=false) {
    var affinities = {};
    for (var other in this.socialNetwork.edges[this.id]) {
      var data = this.socialNetwork.edges[this.id][other];
      affinities[other] = data.affinity;
    }

    var factors = {
      bac: (-Math.pow(state.bac/3 - 3, 2) + 9),
      bladder: -Math.pow(state.bladder/50, 3),
      hunger: -Math.pow(state.hunger/50, 3),
      thirst: -Math.pow(state.thirst/50, 3),
      boredom: (-state.boredom + 1)/2,
      talking: state.talking.reduce((acc, val) => acc + (affinities[val] ? affinities[val] : state.sociability), 0),
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
