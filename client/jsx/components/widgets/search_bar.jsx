/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	render: function () {
		return (
			<div className="row collapse">
				<div className="small-10 columns">
					<input type="text" placeholder="Gene Name, List of Genes" />
				</div>
				<div className="small-2 columns">
					<a href="#" className="button secondary postfix">Go</a>
				</div>
			</div>
		);
	}
});
