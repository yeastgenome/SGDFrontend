const SET_PTM  = 'SET_PTM';
export function setPTM(currentPtm){
  return { type: SET_PTM, payload: { currentPtm: currentPtm}};
}