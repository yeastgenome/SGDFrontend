const React = require('react');
const ReactDOM = require('react-dom');
const _ = require('underscore');
import d3 from 'd3';

const Graph = require("../components/viz/graph.jsx");

var networkView = {};
networkView.render = function renderNetworkView (graphData) {
    // var _colorScale = function(d) {
    //   if (d.sub_type == 'TARGET') return "#9F75B8";
    //   if (d.sub_type == 'REGULATOR') return "#6CB665";
    //   return "#1660A7";
    // }
    var _colorScale = d3.scale.ordinal().domain(['TARGET', 'REGULATOR']).range(["#9F75B8", "#6CB665"]);
    ReactDOM.render(<Graph colorScale={_colorScale} data={graphData} stage={0} />, document.getElementById('j-network'));
};

module.exports = networkView;
