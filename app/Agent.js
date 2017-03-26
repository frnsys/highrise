import _ from 'underscore';
import Avatar from './Avatar';
import moment from 'moment';
import log from 'loglevel';
import Util from './Util';

function randomChoice(choices) {
  // where `choices` is an
  // array of (choice, prob)
  var roll = Math.random(),
      acc_prob = 0;

  // sort by prob
  choices = _.sortBy(choices, s => s[1]);

  for (var i=0; i < choices.length; i++) {
    var choice = choices[i][0],
        prob = choices[i][1];
    acc_prob += prob;
    if (roll <= acc_prob) {
      return choice;
    }
  }
}

function normalize(dist) {
  var total = dist.reduce((acc, val) => acc + val, 0);
  return dist.map(p => p/total);
}

function positive(vals) {
  // i don't think the math quite works here,
  // but in order to support negative utilities
  // but still interpret them as a probability distribution,
  // this makes all values non-negative and ensures no zeros
  var min = Math.min(...vals);
  return vals.map(v => v + Math.abs(min) + 1);
}

function temperate(dist, temperature) {
  // sample with temperature
  // lower temp -> less random
  var a = dist.map(p => Math.log(p)/temperature);
  var exp = a.map(p => Math.exp(p));
  var expsum = exp.reduce((acc, val) => acc + val, 0);
  return exp.map(a => a/expsum);
}

class Agent {
  constructor(state, temperature=0.01) {
    this.id = Util.uuid();
    this.state = state;
    this.temperature = temperature;
    this.action = {};
  }

  // create an avatar for this agent
  spawn(world, coord, floor, color=0xffffff) {
    this.avatar = new Avatar(world, coord, floor, color);
    this.avatar.agent = this;
    this.avatar.mesh.agent = this;
  }

  update(delta) {

    // move the avatar,
    // if necessary, and update state coord
    if (this.avatar) {
      this.avatar.update(delta);
      this.state.coord = this.avatar.position;
    }

    // apply `entropy` state update
    this.state = this.entropy(this.state);

    if (this.available) {
      var [action, newState] = this.decide();


      this.prev = {
        state: this.state,
        action: this.action
      };
      this.action = action;
      this.state = this.execute(this.action, this.state);

      // just logging stuff
      log.info('============');
      log.info(this.id);
      log.info(action);
      this.utility(this.state, null, false, true);
      this.lastAction = action;
      log.info(this.state);
    }

  }

  decide() {
    var actionsStates = this.successors(this.state),
        utilities = actionsStates.map(s => this.utility(s[1])),
        dist = temperate(normalize(positive(utilities)), this.temperature);

    // [(state, prob), ...]
    actionsStates = _.zip(actionsStates, dist);

    // sort by prob
    // just be consistent
    return _.sortBy(actionsStates, s => -s[1])[0][0];
    // return randomChoice(actionsStates);
  }

  // compute successor states for possible actions
  successors(state) {
    var actions = this.actions(state),
        successors = actions.map(a => this.successor(a, this.entropy(_.clone(state))));
    return _.zip(actions, successors);
  }

  // VVV IMPLEMENT THESE VVV

  // possible actions given a state
  actions(state) {
    throw 'not implemented';
  }

  // compute successor state for an action.
  // note that the `entropy` state update is pre-applied
  // before being passed to this method.
  successor(action, state) {
    throw 'not implemented';
  }

  // utility of a state
  // this has to be a positive value or 0
  utility(state, prevState, expected=true) {
    throw 'not implemented';
  }

  // there may be other processes
  // that need to start as a result of an action
  execute(action, state) {
    throw 'not implemented';
  }

  // VVV OPTIONALLY IMPLEMENT THESE VVV

  // state updates that occur every time step,
  // regardless of action or if the agent is `available`
  entropy(state) {
    return state;
  }

  // returns whether or not the agent
  // is able to decide/change actions.
  get available() {
    return true;
  }
}

export default Agent;
