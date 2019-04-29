/*eslint-disable no-case-declarations */
// import { fromJS } from 'immutable';

const DEFAULT_STATE = {
  currentPtm:{
    id: 0,
    dbentity_id: '',
    taxonomy_id: '',
    reference_id: '',
    site_index: '',
    site_residue: '',
    psimod_id: '',
    modifier_id: '',
  }
};

const SET_PTM = 'SET_PTM';

const ptmReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
  case SET_PTM:
    return Object.assign({},state,action.payload);
  default:
    return state;
  }
};

export default ptmReducer;
