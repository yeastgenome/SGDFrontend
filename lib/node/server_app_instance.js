// run this script with node to write a static version of the react header to jinja2
require('babel-core/register');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactRouter = require('react-router');
const match = ReactRouter.match;
const RoutingContext = ReactRouter.RoutingContext;
const Redux = require('redux');
const createStore = Redux.createStore;
const compose = Redux.compose;
const combineReducers = Redux.combineReducers;
const ReactRedux = require('react-redux');
const Provider = ReactRedux.Provider;

const urlToHtml = require('../../client/jsx/url_to_html.jsx');

const PORT = 5000;

// express setup
const express = require('express');
const app = express();

// assign urlToHtml to all url's
app.get('/*', function (req, res) {
  var html = urlToHtml(req.url, (err, html) => {
    if (err) {
    }
    return res.send(html);
  });
});

// const server = app.listen(PORT, function () {
//   var host = server.address().address;
//   var port = server.address().port;

//   console.log('Example app listening at http://%s:%s', host, port);
// });
module.exports = app;
