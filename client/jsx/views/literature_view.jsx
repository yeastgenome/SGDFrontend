const React = require('react');
const ReactDOM = require('react-dom');
const NavBar = require('../components/widgets/navbar.jsx');
const TabsModel = require('../models/tabs_model.jsx');

var litView = {};
litView.render = function (hasNetwork) {
  var _tabModel = new TabsModel();
  let _elements = [
    { name: 'Literature Overview', target: 'overview' },
    { name: 'Primary Literature', target: 'primary' },
  ];
  if (hasNetwork) {
    _elements.push({ name: 'Related Literature', target: 'network' });
  }
  _elements = _elements.concat([
    { name: 'Additional Literature', target: 'additional' },
    { name: 'Reviews', target: 'reviews' },
    { name: 'Gene Ontology Literature', target: 'go' },
    { name: 'Phenotype Literature', target: 'phenotype' },
    { name: 'Interaction Literature', target: 'interaction' },
    { name: 'Regulation Literature', target: 'regulation' },
    { name: 'High-Throughput Literature', target: 'htp' },
  ]);
  var _navTitleText = _tabModel.getNavTitle(
    locus.display_name,
    locus.format_name
  );
  ReactDOM.render(
    <NavBar title={_navTitleText} elements={_elements} />,
    document.getElementById('navbar-container')
  );
};

module.exports = litView;
