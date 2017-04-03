import { fromJS } from 'immutable';

const DEFAULT_STATE = fromJS({
  error: null,
  message: null,
  isReady: true,
  isPending: false
});

export default function metaReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
  case 'SET_ERROR':
    return state.set('error', action.payload);
  case 'CLEAR_ERROR':
    return state.set('error', null);
  case 'SET_MESSAGE':
    return state.set('message', action.payload);
  case 'CLEAR_MESSAGE':
    return state.set('message', null);
  case 'SET_NOT_READY':
    return state
      .set('isReady', false)
      .set('isPending', true);
  case 'SET_PENDING':
    return state.set('isPending', true);
  case 'SET_READY':
    return state
      .set('isReady', true);
  case 'FINISH_PENDING':
    return state
      .set('isReady', true)
      .set('isPending', false);
  default:
    return state;
  }
}
