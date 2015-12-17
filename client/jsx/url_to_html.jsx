require('babel-core/register');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactRouter = require('react-router');
const match = ReactRouter.match;
const RoutingContext = ReactRouter.RoutingContext;
const ReactRedux = require('react-redux');
const Provider = ReactRedux.Provider;

const routes = require('./routes.jsx');
const ConfigureStore = require('./store/configure_store.js');
const SearchReducer = require('./reducers/search_reducer.js');

const TOP_HTML = '<html><head><link href="/static/css/normalize.css" rel="stylesheet"><link href="/static/css/style.css" rel="stylesheet"><script src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script></head><body><div id="j-application">';
const BOTTOM_HTML = '</div><script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script><script src="/static/js/application.js"></script><script>views.bundle.render();</script></body></html>';

const renderPropsToHtml = function (renderProps) {
  let innerEl = React.createElement(RoutingContext, renderProps);
  let el = React.createElement(Provider, renderProps, innerEl);
  let appHtml = ReactDOMServer.renderToStaticMarkup(el);
  let fullHtml = TOP_HTML + appHtml + BOTTOM_HTML;
  return fullHtml;
};

// takes relative url, call cb with html response
// cb(err, html, statusCode)
module.exports = function(relativeUrl, cb) {
  // create store for server, no router reducer
  let store = ConfigureStore(false);

  match({ routes, location: relativeUrl}, function (err, redirectLocation, renderProps) {
    if (err) {
      return cb(err, 'ERROR', 500);
    } else if (redirectLocation) {
      return cb(err, '', 302);
    } else if (renderProps) {
      renderProps.store = store;
      // listen for readyState to be true, then render
      let unlisten = store.subscribe( () => {
        let isReady = store.getState().readyState.isReady;
        if (isReady) {
          unlisten();
          let fullHtml = renderPropsToHtml(renderProps);
          return cb(err, fullHtml, 200);
        }
      }); 
      // get full html, forces mounting
      let fullHtml = renderPropsToHtml(renderProps);
      // if ready state true, go ahead and render
      if (store.getState().readyState.isReady) return cb(err, fullHtml, 200);
    } else {
      return cb(err, '404 - NOT FOUND', 404)
    }
  });
};
