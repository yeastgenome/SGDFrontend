/*eslint-disable no-case-declarations */
import { fromJS } from 'immutable';

const DEFAULT_STATE = fromJS({
  data: null
});

export default function locusReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
  case 'UPDATE_LOCUS_DATA':
    return state.set('data', fromJS(action.payload));
  default:
    return state;
  }
}

