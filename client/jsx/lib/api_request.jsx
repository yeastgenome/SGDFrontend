const DEFAULT_REQUEST_TIMEOUT = 5000;
// options { method, data, crsfToken, timeout }
export default function apiRequst(url, options) {
  options = options || {};
  let _method = options.method || 'GET';
  let timeout = options.timeout || DEFAULT_REQUEST_TIMEOUT;
  let requestOptions = {
    method: _method,
    credentials: 'same-origin',
    headers: { 'X-CSRF-Token': options.crsfToken }
  };
  if (options.data) requestOptions.body = options.data;
  let p = Promise.race([
    fetch(url, requestOptions),
    new Promise(function (resolve, reject) {
      setTimeout(() => reject(new Error('request timeout')), timeout);
    })
  ]).then( response => {
    // if not 200 or 400 throw unknown error
    if ([200, 400].indexOf(response.status) < 0) {
      throw new Error('There was an API error.  Please refresh and try again.  If you continue to see this message, please contact sgd-programmers@lists.stanford.edu.');
    } else {
      return response.json();
    }
  });
  return p;
};
