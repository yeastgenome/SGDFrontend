import { fromJS } from 'immutable';

const DEFAULT_STATE = fromJS({
  url: '',
  code: '',
  subject: '',
  recipients: ''
});

const UPDATE_URL = 'UPDATE_URL';
const UPDATE_CODE = 'UPDATE_CODE';
const UPDATE_SUBJECT = 'UPDATE_SUBJECT';
const UPDATE_RECIPIENTS = 'UPDATE_RECIPIENTS';

const newsLetterReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
  case UPDATE_URL:
    return state.set('url', fromJS(action.url));
  case UPDATE_CODE:
    return state.set('code', fromJS(action.code));
  case UPDATE_SUBJECT:
    return state.set('subject', fromJS(action.subject));
  case UPDATE_RECIPIENTS:
    return state.set('recipients', fromJS(action.recipients));
  default:
    return state;
  }
};

export default newsLetterReducer;