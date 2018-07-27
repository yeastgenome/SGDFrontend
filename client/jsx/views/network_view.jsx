const React = require('react');
const ReactDOM = require('react-dom');
const _ = require('underscore');
import d3 from 'd3';

import Graph from 'react-sigma-graph';

var networkView = {};
networkView.render = function renderNetworkView (graphData, categoryColors) {
    var tempDate = new Date();
    var month = tempDate.getMonth() + 1;
    var formattedMonth = ('0' + month).slice(-2);
    var date = tempDate.getDate();
    var formattedDate = ('0' + date).slice(-2);
    var _HeaderText = `SGD ${tempDate.getFullYear()}-${formattedMonth}-${formattedDate}`;
    var _categoryColors = {
    	'REGULATOR': '#6CB665',
    	'TARGET': '#9F75B8',
    	'FOCUS': '#1f77b4'
    };
    ReactDOM.render(<Graph categoryColors={categoryColors} data={graphData} headerText={_HeaderText} />, document.getElementById('j-network'));
};

module.exports = networkView;
