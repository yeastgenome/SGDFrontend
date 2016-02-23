require('babel-core/register');
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import _ from 'underscore';
import { createMemoryHistory, useQueries } from 'history';
import { routeActions } from 'react-router-redux';

import ConfigureStore from './store/configure_store.js';
import ReduxApplication from './redux_application.jsx';

const TOP_HTML = '<html><head><link href="/static/css/normalize.css" rel="stylesheet"><link href="/static/css/style.css" rel="stylesheet"><script src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script></head><body><div id="j-application">';
const BOTTOM_HTML = '</div><script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="/static/js/application.js"></script><script>views.bundle.render();</script></body></html>';
const elToHtml = function (el) {
  let clonedEl = React.cloneElement(el);
  let appHtml = ReactDOMServer.renderToStaticMarkup(clonedEl);
  let fullHtml = TOP_HTML + appHtml + BOTTOM_HTML;
  return fullHtml;
};

// takes relative url, call cb with html response
// cb(err, html, statusCode)
module.exports = function(relativeUrl, cb) {
  cb = _.once(cb);
  // create store for server, no router reducer
  let _history = useQueries(createMemoryHistory)();
  let _store = ConfigureStore(undefined, _history);
  // dispatch route events
  _store.dispatch(routeActions.push(relativeUrl));
  let appElement = React.createElement(ReduxApplication, { history: _history, store: _store });
  let htmlStr = elToHtml(appElement);
  return cb(null, htmlStr, 200);
};
