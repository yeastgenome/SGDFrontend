require('babel-core/register');
const assert = require('assert');
const urlToHtml = require('../url_to_html.jsx');

describe('urlToHtml', function() {
  it('should convert "/search" to html with text "0 results for"', function (done) {
    urlToHtml('/search', (err, html) => {
      assert.ok(html.match('0 results for').length > 0);
      done();
    })
  });
});
