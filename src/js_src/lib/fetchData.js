/*eslint-disable no-undef */
const DEFAULT_TIMEOUT = 5000;

export default function fetchData(_url, options={}) {
  let _type = options.type || 'GET';
  let _headers = options.headers || {};
  let _data = options.data || null;
  let _contentType = (typeof options.contentType === 'undefined') ? 'application/x-www-form-urlencoded; charset=UTF-8' : options.contentType;
  let _processData = (typeof options.processData === 'undefined') ? true : options.processData;
  let _timout = options.timeout || DEFAULT_TIMEOUT;
  return new Promise(function (resolve, reject) {
    // *** DEPENDS ON GLOBAL $ because $ can abort ***
    $.ajax({
      url : _url,
      data: _data,
      headers: _headers,
      processData: _processData,
      contentType: _contentType,
      type : _type,
      dataType: 'json',
      timeout: _timout,
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
