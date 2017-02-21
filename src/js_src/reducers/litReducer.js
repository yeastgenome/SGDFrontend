/*eslint-disable no-case-declarations */
import { fromJS } from 'immutable';
import _ from 'underscore';

// temp fixture
const DEFAULT_STATE = fromJS({
  triageEntries: [],
  activeLitEntry: {
    id: '12345abc',
    title: 'Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
    author: 'Lorem et al.',
    citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
    journal: 'Nucleic Acids Research',
    abstract: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    status: 'reviewing',
    tags: ['Pathways', 'Phenotype needs review'],
    assignees: [
      {
        name: 'Curator A',
        username: 'curate_a123'
      }
    ],
    lastUpdated: new Date() // /now
  },
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
  let updatedLitEntry;
  switch (action.type) {
  case 'PROMOTE_TRIAGE':
    let triageEntries = state.get('triageEntries').toJS();
    let deletedEntry = _.findWhere(triageEntries, { curation_id: action.payload });
    let updatedTriageEntries = _.without(triageEntries, deletedEntry);
    return state.set('triageEntries', fromJS(updatedTriageEntries));
  case 'UPDATE_ASSIGNEES':
    updatedLitEntry = state.get('activeLitEntry').toJS();
    updatedLitEntry.assignees = action.payload;
    return state.set('activeLitEntry', fromJS(updatedLitEntry));
  case 'UPDATE_TAGS':
    updatedLitEntry = state.get('activeLitEntry').toJS();
    updatedLitEntry.tags = action.payload;
    return state.set('activeLitEntry', fromJS(updatedLitEntry));
  case 'UPDATE_TRIAGE_ENTRIES':
    return state.set('triageEntries', fromJS(action.payload));
  default:
    return state;
  }
}
