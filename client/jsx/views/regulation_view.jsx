"use strict";

const React = require("react");
const ReactDOM = require("react-dom");
const _ = require("underscore");
const NavBar = require("../components/widgets/navbar.jsx");
const TabsModel = require("../models/tabs_model.jsx");

var regulationView = {};
regulationView.render = function(){
    debugger
    var _tabModel = new TabsModel();
    let _elements = [];
    _elements.push({"name":"Regulation Overview", "target":"overview"});
    if(locus['regulation_overview']['target_count'] > 0){
        _elements.push({"name":"Domains and Classification", "target":"domain"});
        _elements.push({"name":"DNA Binding Site Motifs", "target":"binding"});
        _elements.push({"name":"Targets", "target":"targets"});
        _elements.push({"name":"Shared GO Processes Among Targets", "target":"enrichment"});
        _elements.push({"name":"Regulators", "target":"regulators"});
    }
    _elements.push({"name":"Regulators", "target":"regulators"});
    if(locus['regulation_overview']['target_count'] + locus['regulation_overview']['regulator_count'] > 0){
       _elements.push({"name":"Regulation Network", "target":"network"}); 
    }
    var _navTitleText =  _tabModel.getNavTitle(locus.display_name,locus.format_name);
    ReactDOM.render(<NavBar title={_navTitleText} elements={_elements} />, document.getElementById("navbar-container"));

};

module.exports = regulationView;
