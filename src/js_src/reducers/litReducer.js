/*eslint-disable no-case-declarations */
import { fromJS } from 'immutable';
import _ from 'underscore';

const DEFAULT_STATE = fromJS({
  activeLitEntry: {},
  activeTags: [],
  isTagVisible: false,
  triageEntries: [],
  triageTotal: 0,
  lastPromoted: null,
});

export default function litReducer(state = DEFAULT_STATE, action) {
  let triageEntries;
  switch (action.type) {
  case 'UPDATE_ACTIVE_ENTRY':
    return state.set('activeLitEntry', fromJS(action.payload));
  case 'UPDATE_ACTIVE_TAGS':
    return state
      .set('isTagVisible', fromJS(true))
      .set('activeTags', fromJS(action.payload));
  case 'CLEAR_ACTIVE_TAGS':
    return state.set('isTagVisible', fromJS(false));
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
    triageEntries = state.get('triageEntries').toJS();
    let newTriageEntries = replaceTriage(triageEntries, action.payload.entries, action.payload.username);
    return state
      .set('triageTotal', fromJS(action.payload.total))
      .set('triageEntries', fromJS(newTriageEntries));
  case 'UPDATE_LAST_PROMOTED':
    return state.set('lastPromoted', fromJS(action.payload));
  case 'CLEAR_LAST_PROMOTED':
    return state.set('lastPromoted', fromJS(null));
  default:
    return state;
  }
}

function replaceTriage(oldEntries, newEntries, currentUsername) {
  newEntries.forEach( (d, i) => {
    let oldEntry = _.findWhere(oldEntries, { curation_id: d.curation_id });
    // replace with old version if claimed by current user
    let oldAssignee = oldEntry ? oldEntry.data.assignee : null;
    if (oldAssignee === currentUsername) {
      newEntries[i] = oldEntry;
    }
  });
  return newEntries;
}
