const UPDATE_URL = 'UPDATE_URL';
const UPDATE_CODE = 'UPDATE_CODE';
const UPDATE_SUBJECT = 'UPDATE_SUBJECT';
const UPDATE_RECIPIENTS = 'UPDATE_RECIPIENTS';

export function setURL(url) {
  return { type: UPDATE_URL, url: url };
}

export function setCode(code) {
  return { type: UPDATE_CODE, code: code };
}

export function setSubject(subject) {
  return { type: UPDATE_SUBJECT, subject: subject };
}

export function setRecipients(recipients) {
  return { type: UPDATE_RECIPIENTS, recipients: recipients };
}