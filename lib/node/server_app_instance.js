'use strict';
require('babel-core/register');
const urlToHtml = require('../../client/jsx/url_to_html.jsx');
const PORT = 5000;

// express setup
const express = require('express');
const request = require('request');
const app = express();

// assets, not in production
if (process.env.NODE_ENV !== 'production') {
	app.use('/static', express.static(__dirname + '/../../src/sgd/frontend/yeastgenome/static'));
}

app.get('/backend/*', function (req, res) {
  let newUrl = req.url.replace('/backend', 'http://sgd-dev4.stanford.edu/webservice');
  request(newurl).pipe(res);
});

// assign urlToHtml to all URLs
app.get('/*', function (req, res) {
  var html = urlToHtml(req.url, function (err, html, statusCode) {
  	statusCode = statusCode || 500;
    if (err) {
    }
    return res
      .status(statusCode)
      .send(html);
  });
});

const server = app.listen(PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
module.exports = app;
