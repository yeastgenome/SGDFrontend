/*eslint-disable no-case-declarations */
import { fromJS } from 'immutable';

const DEFAULT_STATE = fromJS({
  data: null,
  isPending: false,

  // isUpdate: false,
  // psimod_id_to_name: [],
  // list_of_ptms: [],
  // isPending: false,
  id: 0,
  dbentity_id: '',
  taxonomy_id: '',
  reference_id: '',
  site_index: '',
  site_residue: '',
  psimod_id: '',
  modifier_id: '',
  // visible_ptm_index: -1
});

const SET_DBENTITY_ID = 'SET_DBENTITY_ID';
const SET_TAXONOMY_ID = 'SET_TAXONOMY_ID';
const SET_REFERENCE_ID = 'SET_REFERENCE_ID';
const SET_SITE_INDEX = 'SET_SITE_INDEX';
const SET_SITE_RESIDUE = 'SET_SITE_RESIDUE';
const SET_PSIMOD_ID = 'SET_PSIMOD_ID';
const SET_MODIFIER_ID = 'SET_MODIFIER_ID';

const ptmReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
  case SET_DBENTITY_ID:
    return state.set('dbentity_id', fromJS(action.dbentity_id));

  case SET_TAXONOMY_ID:
    return state.set('taxonomy_id', fromJS(action.taxonomy_id));
  
  case SET_REFERENCE_ID:
    return state.set('reference_id', fromJS(action.reference_id));
  
  case SET_SITE_INDEX:
    return state.set('site_index', fromJS(action.site_index));

  case SET_SITE_RESIDUE:
    return state.set('site_residue', fromJS(action.site_residue));
  
  case SET_PSIMOD_ID:
    return state.set('psimod_id', fromJS(action.psimod_id));
  
  case SET_MODIFIER_ID:
    return state.set('modifier_id', fromJS(action.modifier_id));

  default:
    return state;
  }
};

export default ptmReducer;
