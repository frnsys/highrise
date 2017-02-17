import _ from 'underscore';
import Agent from './app/Agent';

const ACTIONS = [
  'bathroom',
  'eat',
  'drink alcohol'
];

class PartyGoer extends Agent {
  actions(state) {
    // all actions are possible
    return ACTIONS;
  }

  successor(action, state) {
    switch (action) {
        case 'bathroom':
          state.bladder = Math.max(state.bladder-1, 0);
          state.hunger += 1;
          state.thirst += 1;
          break;
        case 'eat':
          state.hunger = Math.max(state.hunger-1, 0);
          state.thirst += 1;
          break;
        case 'drink alcohol':
          state.thirst = Math.max(state.thirst-1, 0);
          state.bladder += 1;
          state.bac += 1;
          state.hunger += 1;
          break;
    }
    return state;
  }

  utility(state) {
    // eh
    return 1/(state.bladder+1) + 1/(state.hunger+1) + 1/(state.thirst+1); // + state.bac;
  }
}

export default PartyGoer;
