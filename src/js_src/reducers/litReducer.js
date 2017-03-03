/*eslint-disable no-case-declarations, no-redeclare */
import { fromJS } from 'immutable';
import _ from 'underscore';

// temp fixture
const DEFAULT_STATE = fromJS({
  triageEntries: [],
  allCuratorUsers: [
    {
      name: 'Curator A',
      username: 'curate_a123'
    },
    {
      name: 'Curator B',
      username: 'curate_b123'
    },
    {
      name: 'Curator C',
      username: 'curate_c123'
    }
  ]
});

export default function litReducer(state = DEFAULT_STATE, action) {
  let triageEntries;
  switch (action.type) {
  case 'ASSIGN_TRIAGE_ENTRY':
    triageEntries = state.get('triageEntries').toJS();
    let targetEntry = _.findWhere(triageEntries, { curation_id: action.payload.id });
    targetEntry.data.assignee = action.payload.username;
    return state.set('triageEntries', fromJS(triageEntries));
  case 'REMOVE_TRIAGE':
    triageEntries = state.get('triageEntries').toJS();
    let deletedEntry = _.findWhere(triageEntries, { curation_id: action.payload });
    triageEntries = _.without(triageEntries, deletedEntry);
    return state.set('triageEntries', fromJS(triageEntries));
  case 'UPDATE_TRIAGE_ENTRIES':
    return state.set('triageEntries', fromJS(action.payload));
  default:
    return state;
  }
}
