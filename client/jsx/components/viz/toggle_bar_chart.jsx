
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var HelpIcon = require("../widgets/help_icon.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");
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
		var active = _.findWhere(this.props.data, { key: this.state.activeDataKey });
		var activeData = active.data;

		// if there are more than FILTER_TRESHOLD elements, filter them
		var filter = null;
		if (activeData.length > FILTER_TRESHOLD + 1) {
			filter = d => {
				return activeData.indexOf(d) <= FILTER_TRESHOLD;
			};
		}

		var _colorScale = d => { return d.isRoot ? "#DF8B93" : "#18AB2F"; };
		var _helpText = "Features that are annotated to the ‘root’ terms are considered ‘unknown’ and are shown in red.  More information on GO and GO slims can be found on SGD’s <a target='_blank' href='https://sites.google.com/view/yeastgenome-help/function-help/gene-ontology-go'>GO help page</a>.  Please use the <a href='http://www.yeastgenome.org/cgi-bin/GO/goSlimMapper.pl'>GO Slim Mapper</a> or download the <a href='http://www.yeastgenome.org/download-data/curation'>go_slim_mapping.tab</a> file to obtain the GO data summarized in these graphs.";
		return (
			<div className="toggle-bar-chart">
				<h3 style={{ position: "absolute", top: "1rem", right: "1rem" }}><HelpIcon isInfo={true} orientation="left" text={_helpText}/></h3>
				<div style={{ marginRight: "2rem" }}>
					{controlsNode}
				</div>
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
