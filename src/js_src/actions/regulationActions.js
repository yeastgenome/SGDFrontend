const SET_REGULATION = 'SET_REGULATION';
export function setRegulation(currentRegulation) {
  return { type: SET_REGULATION, payload: { currentRegulation: currentRegulation } };
}