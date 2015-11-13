// run this script with node to write a static version of the react header to jinja2
require('babel-core/register');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const thunk = require('redux-thunk').thunk;
const Redux = require('redux');
const createStore = Redux.createStore;
const compose = Redux.compose;
const applyMiddleware = Redux.applyMiddleware;
const combineReducers = Redux.combineReducers;
const createLocation = require('history').createLocation;
const reduxReactRouter = require('redux-router').reduxReactRouter;
const tidy = require('htmltidy').tidy;
const fs = require('fs');

const Header = require('../client/jsx/containers/layout/header.jsx');
const SearchReducer = require('../client/jsx/reducers/search_reducer.js');

// create server store
const reducer = combineReducers({
  searchResults: SearchReducer,
});
const _store = compose(
)(createStore)(reducer);

var el = React.createElement(Header, { store: _store });
const tidyOptions = {
  indent: true,
}
tidy(ReactDOMServer.renderToStaticMarkup(el), tidyOptions, function(err, html) {
  // write to header files
  const templateLocation = "src/sgd/frontend/yeastgenome/static/templates/";
  fs.writeFileSync(templateLocation + '/header.jinja2', html);
  fs.writeFileSync(templateLocation + '/lite_header.jinja2', html);
});
