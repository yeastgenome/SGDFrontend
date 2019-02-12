"use strict";

const React = require("react");
const SearchForm = require("../components/gotools/goslimmapper_form.jsx");

var goSlimMapperView = {};

goSlimMapperView.render = function () {
	React.render(<SearchForm />,  document.getElementById("j-main"));
};

module.exports = goSlimMapperView;
