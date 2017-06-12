"use strict";

const React = require("react");
const ReactDOM = require("react-dom");
const ProteinViewer = require("sgd_visualization").ProteinViewerComponent;
const _ = require("underscore");
const NavBar = require("../components/widgets/navbar.jsx");
const TabsModel = require("../models/tabs_model.jsx");

var proteinView = {};
proteinView.render = function (rawDomainData, locusLength, colorScale) {
  var rawLocusData = rawDomainData[0].locus;
  var _tabModel = new TabsModel();

  let _elements =[
    {'name':'Protein Overview', 'target':'overview'},
    {'name':'Experimental Data', 'target':'experiment'},
    {'name':'Domains and Classification', 'target':'domain'},
    {'name':'Sequence', 'target':'sequence'},
    {'name':'External Identifiers', 'target':'external_ids'},
    {'name':'Resources', 'target':'resources'}
  ] ;
  var _navTitleText = _tabModel.getNavTitle(locus.display_name,locus.format_name);
  ReactDOM.render(<NavBar title={_navTitleText} elements={_elements} />, document.getElementById("navbar-container"));

  
  var locusData = _.extend(rawLocusData, {
    name: rawLocusData.display_name,
    href: rawDomainData.link,
    start: 1,
    end: locusLength
  });
  var domainData = _.map(rawDomainData, (d, i) => {
    d.domain.name = d.domain.display_name;
    d.source.name = d.source.display_name;
    d.domain.href = d.domain.link;
    d.domain.id = `${d.domain.id}-${i}`;
    d.sourceId = d.source.id;
    return d;
  });


 /* ReactDOM.render(<ProteinViewer data={domainData} locusData={locusData} colorScale={colorScale}/>
  , document.getElementById("domain_chart"));*/
  

};

module.exports = proteinView;
