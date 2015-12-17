const DEFAULT_STATE = {
  isReady: true
};

const readyStateReducer = function (state, action) {
  if (typeof state === 'undefined') {
    return DEFAULT_STATE;
  };
  if (action.type === 'SET_READY_STATE') {
    state.isReady = action.value;
    return state;
  }
  return state;
};

module.exports = readyStateReducer;
