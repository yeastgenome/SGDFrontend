/** @jsx React.DOM */
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
		if (activeData.length > FILTER_TRESHOLD) {
			filter = (d) => {
				return activeData.indexOf(d) <= FILTER_TRESHOLD;
			};
		}

		// add text node if active element has text property
		var textNode = null;
		if (active.text) {
			// TEMP snapshot-specific
			var _helpText = (<span>Features that are annotated to the ‘root’ terms are
				considered ‘unknown’ and are shown in red.  More information on GO and GO slims can be found on SGD’s <a href="http://www.yeastgenome.org/help/function-help/gene-ontology-go">GO help page</a>. 
				Please use the <a href="http://www.yeastgenome.org/cgi-bin/GO/goSlimMapper.pl">GO Slim Mapper</a> or download the <a href="http://downloads.yeastgenome.org/curation/literature/">go_slim_mapping.tab</a> file to obtain the GO data summarized in these graphs.</span>);
			textNode = <div className="clearfix"><h3 className="toggle-text"><span className="inner-toggle-text">{active.text}</span> <HelpIcon text={_helpText} isInfo={true}/></h3></div>;
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
