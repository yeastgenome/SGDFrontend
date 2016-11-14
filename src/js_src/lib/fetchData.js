/*eslint-disable no-undef */

const TIMEOUT = 5000;

export default function fetchData(_url, options={}) {
  let _type = options.type || 'GET';
  let _headers = options.headers || {};
  let _data = options.data || null;
  let _processData = (typeof options.processData === 'undefined') ? true : options.processData;
  return new Promise(function (resolve, reject) {
    // *** DEPENDS ON GLOBAL $ because $ can abort ***
    $.ajax({
      url : _url,
      data: _data,
      headers: _headers,
      processData: _processData,
      type : _type,
      dataType: 'json',
      timeout: TIMEOUT,
      success: data => {
        resolve(data);
      },
      error: (request, e) => {
        if (e === 'abort') {
          return;
        }
        reject(e);
      }
    });
  });
}
