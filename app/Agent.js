import _ from 'underscore';
import Avatar from './Avatar';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });
}

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
    this.id = uuid();
    this.state = state;
    this.temperature = temperature;
  }

  // create an avatar for this agent
  spawn(world, coord, floor, color=0xffffff) {
    this.avatar = new Avatar(world, coord, floor, color);
    this.avatar.agent = this;
  }

  update(delta) {
    if (this.avatar) {
      this.avatar.update(delta);
    }
    var [action, newState] = this.decide();
    this.state = newState;
    this.utility(this.state);

    console.log('============');
    console.log(this.id);
    console.log(action);
    this.utility(this.state, true);
    console.log(this.state);
  }

  decide() {
    var actionsStates = this.successors(this.state),
        utilities = actionsStates.map(s => this.utility(s[1])),
        dist = temperate(normalize(positive(utilities)), this.temperature);

    // [(state, prob), ...]
    actionsStates = _.zip(actionsStates, dist);
    return randomChoice(actionsStates);
  }

  // compute successor states for possible actions
  successors(state) {
    var actions = this.actions(state),
        successors = actions.map(a => this.successor(a, _.clone(state)));
    return _.zip(actions, successors);
  }

  // VVV IMPLEMENT THESE VVV

  // possible actions given a state
  actions(state) {
    throw 'not implemented';
  }

  // compute successor state for an action
  successor(action, state) {
    throw 'not implemented';
  }

  // utility of a state
  // this has to be a positive value or 0
  utility(state) {
    throw 'not implemented';
  }
}

export default Agent;
