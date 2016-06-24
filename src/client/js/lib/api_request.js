const DEFAULT_REQUEST_TIMEOUT = 5000;
// options { method, data, crsfToken, timeout }
export default function apiRequst(url, options) {
  let _method = options.method || 'POST';
  let _data = options.data || {};
  let timeout = options.timeout || DEFAULT_REQUEST_TIMEOUT;
  let p = Promise.race([
    fetch(url, {
      method: _method,
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': options.crsfToken },
      body: _data
    }),
    new Promise(function (resolve, reject) {
      setTimeout(() => reject(new Error('request timeout')), timeout);
    })
  ]);
  p.then( response => {
    // if not 200 or 400 throw unknown error
    if ([200, 400].indexOf(response.status) < 0) {
      throw new Error('Upload API error.');
    } else {
      console.log('all goood')
      return response.json();
    }
  }).catch( e => {
    return e;
  });
  return p;
};
