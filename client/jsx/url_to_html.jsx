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

const routes = require('./routes.jsx');
const SearchReducer = require('./reducers/search_reducer.js');

const TOP_HTML = '<html><head><link href="/static/css/normalize.css" rel="stylesheet"><link href="/static/css/style.css" rel="stylesheet"></head><body><div id="j-application">';
const BOTTOM_HTML = '</div><script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="/static/js/application.js"></script><script>views.bundle.render();</script></body></html>';

// takes relative url, call cb with html response
// cb(err, html, statusCode)
module.exports = function(relativeUrl, cb) {
  // create server store
  const reducer = combineReducers({
    searchResults: SearchReducer,
  });
  const store = compose(
  )(createStore)(reducer);

  match({ routes, location: relativeUrl}, function (err, redirectLocation, renderProps) {
    // store.subscribe( () => {
    //   console.log(store.getState())
    // });

    if (err) {
      return cb(err, 'ERROR', 500);
    } else if (redirectLocation) {
      return cb(err, '', 302);
    } else if (renderProps) {
      renderProps.store = store;
      var innerEl = React.createElement(RoutingContext, renderProps);
      var el = React.createElement(Provider, renderProps, innerEl);
      var appHtml = ReactDOMServer.renderToStaticMarkup(el);
      var fullHtml = TOP_HTML + appHtml + BOTTOM_HTML;
      return cb(err, fullHtml, 200);
    } else {
      return cb(err, '404 - NOT FOUND', 404)
    }
  });
};
