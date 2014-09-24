/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var RadioSelector = require("../radio_selector.jsx");
var BarChart = require("./bar_chart.jsx");

/*
	From some sets of data, allow user to toggle between bar charts.
*/
module.exports = React.createClass({

	getDefaultProps: function () {
		var idFn = (d) => { return d; };
		return {
			initialActiveDataKey: null, // *
			yValue: idFn,
			labelValue: idFn
		};
	},

	getInitialState: function () {
		return {
			activeDataKey: this.props.initialActiveDataKey
		};
	},

	render: function () {

		var _onSelect = (key) => {
			this.setState({
				activeDataKey: key
			});
		};
		var controlsNode = <RadioSelector elements={this.props.data} initialActiveElementKey={this.state.activeDataKey} onSelect={_onSelect} />;

		var active = _.findWhere(this.props.data, { key: this.state.activeDataKey })
		var activeData = active.data;

		// add text node at bottom if active element has text property
		var textNode = null;
		if (active.text) {
			textNode = <h3 className="toggle-text">{active.text}</h3>;
		}

		var _colorScale = (d) => { return "#18AB2F"; };
		return (
			<div className="toggle-bar-chart">
				{controlsNode}
				<BarChart
					data={activeData} yValue={this.props.yValue}
					labelRatio={0.20} hasTooltip={true}
					yAxisLabel="Genes Products Annotated" labelValue={this.props.labelValue}
					colorScale={_colorScale}
				/>
				{textNode}
			</div>
		);
	}
});
