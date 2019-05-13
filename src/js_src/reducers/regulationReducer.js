const DEFAULT_STATE = {
  currentRegulation: {
    annotation_id: 0,
    target_id: '',
    regulator_id: '',
    taxonomy_id:'',
    reference_id: '',
    eco_id:'',
    regulator_type:'',
    regulation_type:'',
    direction:'',
    happens_during:'',
    annotation_type:'',
  }
};

const SET_REGULATION = 'SET_REGULATION';

const regulationReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
  case SET_REGULATION:
    return Object.assign({}, state, action.payload);
  default:
    return state;
  }
};

export default regulationReducer;