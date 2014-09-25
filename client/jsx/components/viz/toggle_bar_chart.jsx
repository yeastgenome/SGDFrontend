/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var RadioSelector = require("../radio_selector.jsx");
var BarChart = require("./bar_chart.jsx");

// add a filter to bar chart if more than this number of nodes
var FILTER_TRESHOLD = 26;

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

		// get the data that corresponds to the active element
		var active = _.findWhere(this.props.data, { key: this.state.activeDataKey })
		var activeData = active.data;

		// if there are more than FILTER_TRESHOLD elements, filter them
		var filter = null;
		if (activeData.length > FILTER_TRESHOLD) {
			filter = (d) => {
				return activeData.indexOf(d) <= FILTER_TRESHOLD;
			};
		}

		// add text node if active element has text property
		var textNode = null;
		if (active.text) {
			textNode = <h3 className="toggle-text">{active.text}</h3>;
		}

		var _colorScale = (d) => { return d.isRoot ? "#DF8B93" : "#18AB2F"; };
		return (
			<div className="toggle-bar-chart">
				{controlsNode}
				{textNode}
				<BarChart
					data={activeData} yValue={this.props.yValue}
					labelRatio={0.20} hasTooltip={true}
					yAxisLabel="Genes Products Annotated" labelValue={this.props.labelValue}
					colorScale={_colorScale} filter={filter}
				/>
			</div>
		);
	}
});
