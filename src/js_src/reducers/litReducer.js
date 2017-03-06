/*eslint-disable no-case-declarations, no-redeclare */
import { fromJS } from 'immutable';
import _ from 'underscore';

// temp fixture
const DEFAULT_STATE = fromJS({
  triageEntries: [],
});

export default function litReducer(state = DEFAULT_STATE, action) {
  let triageEntries;
  switch (action.type) {
  case 'UPDATE_TRIAGE_ENTRY':
    triageEntries = state.get('triageEntries').toJS();
    let targetEntry = _.findWhere(triageEntries, { curation_id: action.payload.curation_id });
    let targetI = _.indexOf(triageEntries, targetEntry);
    triageEntries[targetI] = action.payload;
    return state.set('triageEntries', fromJS(triageEntries));
  case 'REMOVE_TRIAGE':
    triageEntries = state.get('triageEntries').toJS();
    let deletedEntry = _.findWhere(triageEntries, { curation_id: action.payload });
    triageEntries = _.without(triageEntries, deletedEntry);
    return state.set('triageEntries', fromJS(triageEntries));
  case 'UPDATE_TRIAGE_ENTRIES':
    let newTriageEntries = action.payload.entries;
    return state.set('triageEntries', fromJS(newTriageEntries));
  default:
    return state;
  }
}
