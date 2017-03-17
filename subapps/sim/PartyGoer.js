import _ from 'underscore';
import Agent from '~/app/Agent';
import Dialogue from '~/app/Dialogue';
import log from 'loglevel';

const COMMITMENT = 4000;

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


function adjacentCoords(coord) {
  var steps = [
    {x:0,y:1},
    {x:0,y:-1},
    {x:1,y:0},
    {x:-1,y:0},
    {x:1,y:1},
    {x:1,y:-1},
    {x:-1,y:1},
    {x:-1,y:-1}
  ];
  return _.map(steps, s => ({
    x: coord.x + s.x,
    y: coord.y + s.y
  }));
}

function filterWalkable(coords, floor) {
  return _.filter(coords, c => {
    return floor.grid.isWalkableAt(c.x, c.y);
  });
}

class PartyGoer extends Agent {
  constructor(name, state, world, temperature=0.01) {
    super(state, temperature);
    this.world = world;
    this.id = name;

    this.baseline = {
      sociability: state.sociability
    };

    this.state.commitment = 0;
  }

  get actionTypes() {
    return Object.keys(ACTIONS).concat(['talk']);
  }

  actions(state) {
    var actions = Object.keys(ACTIONS).map(name => {
      var tag = ACTIONS[name];
      return this.world.objectsWithTag(tag).map(obj => {
        var coord = filterWalkable(obj.adjacentCoords, obj.floor)[0];
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
        var a = this.world.agents[other];
        var action = {
          name: 'talk',
          to: other
        };

        // only move towards agent if not "close enough"
        if (manhattanDistance(this.avatar.position, a.avatar.position) > 3) {
          var coord = filterWalkable(adjacentCoords(a.avatar.position), a.avatar.floor)[0];
          action.coord = coord;
        }

        actions.push(action);
      }
    });

    // special action of "continue"
    if (this._prevAction) {
      actions.push({ name: 'continue' });
    }

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

        // the 'continue' action is a special action
        // prevent an agent from behaving too sporadically.
        // there is an 'overhead' to switching between actions,
        // represented by `-state.commitment`. This negative weighting
        // discourages an agent from switching actions. As they repeat
        // the `continue` action, their 'commitment' to that action depletes,
        // so eventually they are more open to switching tasks.
        case 'continue':
          state = this.successor(this._prevAction, state);
          return state;
    }
    return state;
  }

  entropy(state) {
    state.commitment = Math.max(state.commitment-1, 0);
    state.hunger += 1;
    state.thirst += 1;
    state.boredom += 1;
    state.bac = Math.max(state.bac - 0.2, 0);
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
      dist: -manhattanDistance(prev_state.coord, state.coord)/50,
      commitment: -state.commitment
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

  execute(action, state) {
    if (action.name !== 'continue') {
      // new action, reset commitment
      state.commitment = COMMITMENT;
      this._prevAction = action;

			this.avatar.showThought(this.id, Dialogue.createDialogue(this, action), 40, () => { });

    }
    if (action.coord) {
      // if within range, apply the action
      if (manhattanDistance(action.coord, state.coord) === 0) {
        state = this.successor(action, state);
      } else {
        this.avatar.goTo({
          x: action.coord.x,
          y: action.coord.y,
          floor: this.avatar.floor // assuming all on the same floor
        });
      }
    }
    return state;
  }
}

export default PartyGoer;
