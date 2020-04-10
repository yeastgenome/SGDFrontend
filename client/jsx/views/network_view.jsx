const React = require('react');
const ReactDOM = require('react-dom');

import Graph from 'react-sigma-graph';

var networkView = {};
networkView.render = function renderNetworkView(
  graphData,
  categoryColors,
  targetId,
  filters,
  ignoreFloaters
) {
  targetId = targetId || 'j-network';
  var tempDate = new Date();
  var month = tempDate.getMonth() + 1;
  var formattedMonth = ('0' + month).slice(-2);
  var date = tempDate.getDate();
  var formattedDate = ('0' + date).slice(-2);
  var _HeaderText = `SGD ${tempDate.getFullYear()}-${formattedMonth}-${formattedDate}`;
  //   var _categoryColors = {
  //     REGULATOR: '#6CB665',
  //     TARGET: '#9F75B8',
  //     FOCUS: '#1f77b4',
  //   };
  ReactDOM.render(
    <Graph
      categoryColors={categoryColors}
      data={graphData}
      filters={filters}
      headerText={_HeaderText}
      ignoreFloaters={ignoreFloaters}
      edgeColor="#696969"
      highlightedEdgeColor="#5e7cff"
      nodeSize={10}
      edgeSize={2}
      labelSize={17}
      showLegend={true}
      title={_HeaderText}
    />,
    document.getElementById(targetId)
  );
};

module.exports = networkView;
