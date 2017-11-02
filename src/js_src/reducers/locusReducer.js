/*eslint-disable no-case-declarations */
import { fromJS } from 'immutable';

const DEFAULT_STATE = fromJS({
  data: null,
  isPending: false
});

export default function locusReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
  case 'UPDATE_LOCUS_DATA':
    return state.set('data', fromJS(action.payload));
  case 'SET_LOCUS_PENDING':
    return state.set('isPending', fromJS(true));
  case 'CLEAR_LOCUS_PENDING':
    return state.set('isPending', fromJS(false));
  default:
    return state;
  }
}

