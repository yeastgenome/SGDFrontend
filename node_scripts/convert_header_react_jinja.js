// run this script with node to write a static version of the react header to jinja2
require('babel-core/register');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const Header = require('../client/jsx/containers/layout/header.jsx');

var el = React.createElement(Header, {});
var htmlString = ReactDOMServer.renderToStaticMarkup(el);
console.log(htmlString)
