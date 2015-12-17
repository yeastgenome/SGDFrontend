require('babel-core/register');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactRouter = require('react-router');
const match = ReactRouter.match;
const RoutingContext = ReactRouter.RoutingContext;
const ReactRedux = require('react-redux');
const Provider = ReactRedux.Provider;
const _ = require('underscore');

const routes = require('./routes.jsx');
const ConfigureStore = require('./store/configure_store.js');
const SearchReducer = require('./reducers/search_reducer.js');

const TOP_HTML = '<html><head><link href="/static/css/normalize.css" rel="stylesheet"><link href="/static/css/style.css" rel="stylesheet"><script src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script></head>';
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
  let store = ConfigureStore(false);

  match({ routes, location: relativeUrl}, function (err, redirectLocation, renderProps) {
    if (err) {
      return cb(err, 'ERROR', 500);
    } else if (redirectLocation) {
      return cb(err, '', 302);
    } else if (renderProps) {
      renderProps.store = store;
      let reactElement;
      // listen for readyState to be true, then render
      let unlisten = store.subscribe( () => {
        let isReady = store.getState().readyState.isReady;
        if (isReady) {
          unlisten();
          let fullHtml = elToHtml(reactElement);
          return cb(err, fullHtml, 200);
        }
      });
      // create react el
      let innerEl = React.createElement(RoutingContext, renderProps);
      reactElement = React.createElement(Provider, renderProps, innerEl);
      // mount just to force mounting events
      ReactDOMServer.renderToStaticMarkup(reactElement);
      // if ready after mounting, go ahead and render
      if (store.getState().readyState.isReady) {
        unlisten();
        let fullHtml = elToHtml(reactElement);
        return cb(err, fullHtml, 200);
      }
    } else {
      return cb(err, '404 - NOT FOUND', 404)
    }
  });
};
