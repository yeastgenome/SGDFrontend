import { fromJS } from 'immutable';

const DEFAULT_STATE = fromJS({
  error: null
});

export default function metaReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
  case 'SET_ERROR':
    return state.set('error', action.payload);
  case 'CLEAR_ERROR':
    return state.set('error', null);
  default:
    return state;
  }
}
