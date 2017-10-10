const React = require('react');
const ReactDOM = require('react-dom');
const _ = require('underscore');
import d3 from 'd3';

const Graph = require("../components/viz/graph.jsx");

var networkView = {};
networkView.render = function renderNetworkView (graphData) {
    var _colorScale = d3.scale.ordinal().domain(['REGULATOR', 'TARGET', 'FOCUS']).range(["#9F75B8", "#6CB665", "#1f77b4"]);
    var tempDate = new Date();
    var _footerText = `SGD ${tempDate.getFullYear()}-${tempDate.getMonth() + 1}-${tempDate.getDate()}`; 
    ReactDOM.render(<Graph colorScale={_colorScale} data={graphData} footerText={_footerText} stage={0} />, document.getElementById('j-network'));
};

module.exports = networkView;
