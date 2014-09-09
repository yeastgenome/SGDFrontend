/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var ZoomableSunburst = require("./zoomable_sunburst.jsx");
var BarChart = require("./bar_chart.jsx");
var Legend = require("./legend.jsx");

/*
	Combine the sunburst, and a bar chart with cross highlighting and make the zoom in suburst filter the bar chart.
*/
module.exports = React.createClass({

	getInitialState: function () {
		return {
			opacity: (d) => { return 0.6; },
			filteredBarData: null
		};
	},

	render: function () {
		var _colorScale = function (name) {
			var _colors = {
				"molecular_function": "#FFA419",
				"biological_process": "#8200FF",
				"cellular_component": "#09B343",
				undefined: "#AAA"
			};
			return _colors[name];
		};

		// bar chart vars
		var _colorValue = (d) => { return d.top_level; };
		var _yValue = (d) => { return d.descendant_annotation_gene_count; };
		var _labelValue = (d) => { return d.display_name; };
		var _opacity = this.state.opacity;
		var _handleMouseOver = (d) => {
			this.setState({
				opacity: (_d) => { return d.display_name === _d.display_name ? 1: 0.6; }
			});
		};

		// if there is filtered data in state, use that, otherwise default to data.linear in props
		var _barData = this.state.filteredBarData ? this.state.filteredBarData : this.props.data.linear;

		// sunburst zoom callback that sets bar data from children of sundial node
		var _onZoom = (d, topLevel) => {
			topLevel = topLevel.data.format_name;
			var _filtered = null;
			if (d.depth > 0) {
				var _children = _.filter(d.children, (d) => { return !d.dummy; })
				_filtered = _.map(_children, (entry) => {
					var _data = entry.data;
					_data.top_level = topLevel;
					return _data;
				});
				_filtered = _.sortBy(_filtered, (entry) => { return -_yValue(entry); });
				// if clicked to the edge, just show that one
				if (!d.children) {
					var _data = d.data;
					_data.top_level = topLevel;
					_filtered = [_data];
				}
			}

			this.setState({ filteredBarData: _filtered });
		};

		var _initFilterData = this.state.filteredBarData ? null : (d) => { return _yValue(d) > 200; };

		// init legend
		var _legendElements = _.map(this.props.data.nested.children, (d) => {
			return {
				text: d.data.display_name,
				color: _colorScale(d.data.format_name),
				href: d.data.link
			};
		});
		_legendElements = _.sortBy(_legendElements, (d) => { return d.text; });
		var legendNode = <Legend key="primaryLegend" elements={_legendElements} />;

		// TEMP make up num annotated to root
		var _secondLegendElements = _.map(_legendElements, (d) => {
			return _.extend(_.clone(d), {
				href: null,
				text: "1,111 Annotated to Root"
			});
		});
		var secondLegendNode =  <Legend key="secondaryLegend" elements={_secondLegendElements} />;

		// calc max annotations for title text
		var maxAnnotations = d3.max(this.props.data.nested.children, (d) => {
			return d.data.descendant_annotation_gene_count;
		});

		return (
			<div>
				<h2>{maxAnnotations.toLocaleString()} Total Gene Products Annotated</h2>
				{legendNode}
				<div className="secondary-legend-container">
					{secondLegendNode}
				</div>
				<div className="row">
					<div className="large-6 columns sgd-viz">
						<ZoomableSunburst data={this.props.data.nested} colorScale={_colorScale} yValue={_yValue}
							onZoom={_onZoom}
						/>
					</div>
					<div className="large-6 columns sgd-viz">
						<BarChart data={_barData} yValue={_yValue} hasTooltip={true}
							colorScale={_colorScale} colorValue={_colorValue} labelValue={_labelValue}
							nodeOpacity={_opacity} onMouseOver={_handleMouseOver} yAxisLabel="Gene Products Annotated"
							filter={_initFilterData} labelRatio={0.4}
						/>
					</div>
				</div>
			</div>
		);
	}
});
