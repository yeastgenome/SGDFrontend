require('babel-core/register');
const assert = require('assert');
const urlToHtml = require('../url_to_html.jsx');

describe('urlToHtml', function() {
  it('should convert "/search" to html with text "query"', function () {
    urlToHtml('/search?q=actin', (err, html) => {
      assert.ok(html.match('Enter a query.').length > 0);
    })
  });
});
