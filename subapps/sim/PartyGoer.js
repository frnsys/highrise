import _ from 'underscore';
import Util from '~/app/Util';
import Agent from '~/app/Agent';
import Dialogue from '~/app/Dialogue';
import log from 'loglevel';

const COMMITMENT = 50;
const TIME_RANGE = [100, 200]
const TIME_SCALE = TIME_RANGE[0] + (TIME_RANGE[1] - TIME_RANGE[0])/2;
const SOCIAL_ACCLIMATION_RATE = 0.1;

// map action names to their object tags
const ACTIONS = {
  'bathroom': {
    tag: 'bathroom',
    timeout: TIME_RANGE
  },
  'eat': {
    tag: 'food',
    timeout: TIME_RANGE
  },
  'drink_alcohol': {
    tag: 'alcohol',
    timeout: TIME_RANGE
  },
  'drink_water': {
    tag: 'water',
    timeout: TIME_RANGE
  },
  'talk': {
    timeout: [50, 100]
  }
};


function topicSatisfaction(agent, topic) {
  //console.log(d);
  var pref = {
    x: agent.state.topicPreference[0],
    y: agent.state.topicPreference[1]
  };
  var topic = {
    x: topic[0],
    y: topic[1]
  }
  // divide by 4 to normalize
  return 1 - manhattanDistance(pref, topic)/4;
}

function manhattanDistance(coord_a, coord_b) {
  return Math.abs(coord_a.x - coord_b.x) + Math.abs(coord_a.y - coord_b.y);
}

var technical = [-1, 0, 1],
    gossip = [-1, 0, 1];
const conversationTopics = [].concat(...technical.map(x => {
  return gossip.map(y => [x, y]);
}));


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

// agent needs to estimate how others will
// respond to certain convo topics
class SocialModel {
  constructor() {
    this.model = {};
  }

  get(id, topic) {
    // new person, bootstrap from existing
    var [technical, gossip] = topic;
    if (!(id in this.model)) {
      this.model[id] = this.mean();
    }
    return this.model[id][technical][gossip];
  }

  update(id, topic, val) {
    var [technical, gossip] = topic;
    var curr = this.get(id, topic);
    this.model[id][technical][gossip] = Math.max(0, curr + val);
  }

  total(id) {
    return conversationTopics.reduce((acc, t) => {
      return acc + this.get(id, t);
    }, 0);
  }

  mean() {
    var n = Object.keys(this.model).length;
    var mean = {};
    [-1, 0, 1].map(x => {
      var sub = {};
      [-1, 0, 1].map(y => {
        sub[y] = 0;
      });
      mean[x] = sub;
    });
    if (n === 0) {
      return mean;
    }
    Object.keys(this.model).map(id => {
      conversationTopics.map(t => {
        var [x, y] = t;
        mean[x][y] += this.model[id][x][y];
      });
    });
    Object.keys(mean).map(x => {
      Object.keys(mean[x]).map(y => {
        mean[x][y] /= n;
      });
    });
    return mean;
  }
}

class PartyGoer extends Agent {
  constructor(name, state, world, temperature=0.01) {
    super(state, temperature);
    this.world = world;
    this.id = name;

    this.socialModel = new SocialModel();
    this.topicPreference = state.topicPreference;

    this.baseline = {
      sociability: state.sociability
    };

    this.state.commitment = 0;
    this.state.timeout = 0;
	}

  spawn(world, coord, floor, color=0xffffff) {
		super.spawn(world, coord, floor, color);
		console.log("calledspawn");
		
		this.avatar.showBubble({
			"id": this.id,
			"duration": 0, 
			"type": "name",
			"text": this.id,
			"callback": () => { }
		});
  }

  get actionTypes() {
    return Object.keys(ACTIONS);
  }

  actions(state) {
    var actions = Object.keys(ACTIONS).map(name => {
      var tag = ACTIONS[name].tag;
      if (!tag) return null;
      return this.world.objectsWithTag(tag).map(obj => {
        var coord = _.sample(filterWalkable(obj.adjacentCoords, obj.floor));
        return {
          name: name,
          coord: coord
        }
      });
    });

    // flatten
    actions = _.compact([].concat(...actions));

    // talking
    this.world.socialNetwork.nodes.map(other => {
      if (other !== this.id) {
        var a = this.world.agents[other];
        var coord = _.sample(filterWalkable(adjacentCoords(a.avatar.position), a.avatar.floor));
        var talkActions = conversationTopics.map(t => ({
          name: 'talk',
          to: other,
          topic: t,
          coord: coord
        }));

        actions = actions.concat(_.shuffle(talkActions));
      }
    });

    // special action of "continue"
    if (this._prevAction) {
      actions.push({ name: 'continue' });
      // remove the action from here
      actions = _.filter(actions, a => a.name !== this._prevAction.name);
    }

    return actions;
  }

  successor(action, state) {
    state.talking = [];
    switch (action.name) {
        case 'bathroom':
          state.bladder = Math.max(state.bladder-5*TIME_SCALE, 0);
          break;
        case 'eat':
          state.hunger = Math.max(state.hunger-5*TIME_SCALE, 0);
          break;
        case 'drink_alcohol':
          state.thirst = Math.max(state.thirst-5*TIME_SCALE, 0);
          state.bladder += 5*TIME_SCALE;
          state.bac += 1*TIME_SCALE;
          break;
        case 'drink_water':
          state.thirst = Math.max(state.thirst-5*TIME_SCALE, 0);
          state.bladder += 4*TIME_SCALE;
          break;
        case 'talk':
          state.boredom = Math.max(state.boredom-2*TIME_SCALE, 0);
          state.talking.push({
            id: action.to,
            topic: action.topic
          });
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
          state.commitment = 0 // so the commitment doesn't down-weight
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
    state.timeout = Math.max(state.timeout-1, 0);
    return state;
  }

  utility(state, prevState, expected=true, log_factors=false) {
    prevState = prevState || this.state;
    var affinities = {};
    for (var other in this.world.socialNetwork.edges[this.id]) {
      var data = this.world.socialNetwork.edges[this.id][other];
      affinities[other] = data.affinity;
    }

    var talking = state.talking.reduce((acc, a) => {
      if (expected) {
        // normalize
        var val = this.socialModel.get(a.id, a.topic)/(this.socialModel.total(a.id) + 1);
      } else {
        // distance to their preferred topic
        var other = this.world.agents[a.id];
        var val = topicSatisfaction(other, a.topic);
      }
      return acc + (affinities[a.id] ? affinities[a.id] : state.sociability) * (val + 1);
    }, 0) + (1000 * state.talking.length);

    var factors = {
      bac: (-Math.pow(state.bac/3 - 3, 2) + 9),
      bladder: -Math.pow(state.bladder/50, 3),
      hunger: -Math.pow(state.hunger/50, 3),
      thirst: -Math.pow(state.thirst/50, 3),
      boredom: (-state.boredom + 1)/2,
      talking: talking,
      dist: -manhattanDistance(prevState.coord, state.coord)/50,
      commitment: -state.commitment
    };

    // to determine how important each factor is
    if (log_factors) {
      var mass = _.reduce(factors, (acc, val) => acc + Math.abs(val), 0);
      _.each(factors, (val, name) => {
        log.info(`${name}\t->\t${(Math.abs(val)/mass * 100).toFixed(2)}%\t(${val < 0 ? '' : '+'}${val.toFixed(1)})`);
      });
      log.info('---');
    }

    return _.reduce(factors, (acc, val) => acc + val, 0);
  }


  showBubble(action) {
    var bubbleOptions = {
      "id": this.id,
      "duration": 2500, 
      "callback": () => { }
    }
    if(action.name == 'talk') {
      bubbleOptions.text = Dialogue.createDialogue(this, action);
      bubbleOptions.type = "dialogue"
    } else {
      bubbleOptions.text = Dialogue.createThought(this, action);
      bubbleOptions.type = "thought";
    }
    this.avatar.showBubble(bubbleOptions);
  }

  execute(action, state) {

  
    if (action.name === 'continue') {
      // if same action, use it
      action = this._prevAction;
      if (action.name === 'talk') {
        // update coord
        var a = this.world.agents[action.to];
        action.coord = _.sample(filterWalkable(adjacentCoords(a.avatar.position), a.avatar.floor));
        this.showBubble(action);
      }
    } else {
      this.showBubble(action);
      // new action, reset commitment
      state.commitment = COMMITMENT;
      }

    if (action.coord) {
      // if within range, apply the action
      if (manhattanDistance(action.coord, state.coord) <= 1) {
        state = this.successor(action, state);
        var [lo, up] = ACTIONS[action.name].timeout;
        state.timeout = _.random(lo, up);

        // compare expectation and actual utility
        if (action.name === 'talk') {
          var expected = this.utility(this.state),
              actual = this.utility(this.state, null, false),
              diff = actual - expected;
          // TODO need them to sometimes randomly choose new topics
          // or they will just get stuck on one
          if (diff > 0) {
            this.socialModel.update(action.to, action.topic, 0.1);
          } else if (diff < 0) {
            this.socialModel.update(action.to, action.topic, -0.1);
          }

          // add edges if new encounter
          if (!this.world.socialNetwork.hasEdge(this.id, action.to)) {
            this.world.socialNetwork.addEdge(this.id, action.to, 0);
          }
          if (!this.world.socialNetwork.hasEdge(action.to, this.id)) {
            this.world.socialNetwork.addEdge(action.to, this.id, 0);
          }

          // update affinity
          // compute from how much this person enjoyed the topic
          // and how much the other person enjoyed it
          var thisEnjoyment = topicSatisfaction(this, action.topic);
          var other = this.world.agents[action.to];
          var otherEnjoyment = topicSatisfaction(other, action.topic);
          var prev = this.world.socialNetwork.getEdge(this.id, action.to).affinity;
          this.world.socialNetwork.setEdge(this.id, action.to, {
            affinity: Util.ewma(prev, thisEnjoyment*SOCIAL_ACCLIMATION_RATE)
          });
          var prev = this.world.socialNetwork.getEdge(action.to, this.id).affinity;
          this.world.socialNetwork.setEdge(action.to, this.id, {
            affinity: Util.ewma(prev, otherEnjoyment*SOCIAL_ACCLIMATION_RATE)
          });
        }
      } else {
        var dist = manhattanDistance(action.coord, state.coord);
        if (this._prevAction && action.coord != this._prevAction.coord) {
          this.avatar.goTo({
            x: action.coord.x,
            y: action.coord.y,
            floor: this.avatar.floor // assuming all on the same floor
          });
        }
      }

    // if no coord, apply immediately
    } else {
      state = this.successor(action, state);
      var [lo, up] = ACTIONS[action.name].timeout;
      state.timeout = _.random(lo, up);
    }

    this._prevAction = action;
    return state;
  }

  // no new decisions while waiting for current action to complete
  get available() {
    return this.state.timeout === 0;
  }
}

export default PartyGoer;
