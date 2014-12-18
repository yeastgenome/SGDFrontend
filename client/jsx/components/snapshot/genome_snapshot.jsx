/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");
var d3 = require("d3");

var BarChart = require("../../components/viz/bar_chart.jsx");
var Legend = require("../../components/viz/legend.jsx");
var StandaloneAxis = require("../../components/viz/standalone_axis.jsx");

module.exports = React.createClass({

    getInitialState: function () {
        return {
            showChromosomes: false,
        };
    },

    toggleShowChromosomes: function (e) {
        e.preventDefault();

        // if hiding chromosomes and at bottom, scroll to the top
        var _clientTop = this.getDOMNode().getBoundingClientRect().top;
        if (this.state.showChromosomes && _clientTop < 0) {
            window.scrollTo(0, _clientTop);
        }

        this.setState({
            showChromosomes: !this.state.showChromosomes,
        });
    },

    render: function () {
        var _buttonText = this.state.showChromosomes ?
            <span>Show by Genome&nbsp;<i className="fa fa-angle-up"></i></span> : <span>Show by Chromosome&nbsp;<i className="fa fa-angle-down"></i></span>;
        var buttonNode = (<a onClick={this.toggleShowChromosomes} className="button small chromosome-toggle" role="button">
            {_buttonText}
        </a>);

        // init bar chart(s)
        var barNodes;
        if (this.state.showChromosomes) {
            var _maxFeatures = d3.max(this.props.data.chromosomes, (c) => {
                return c.features[0].value;
            });

            barNodes = _.map(this.props.data.chromosomes, (c) => {
                var chromosomeLabelNode = (<div className="clearfix chromosome-label-text">
                    <h3>{c.display_name}&nbsp;-&nbsp;<a href={c.link}>Details</a></h3>
                    <h3>Length: {(c.length || 0).toLocaleString()} bp</h3>
                </div>);
                return [chromosomeLabelNode, this._getBarChart(c.features, _maxFeatures)];
            });

        } else {
            var _maxFeatures = d3.max(this.props.data.combined, (d) => { return d.value; })
            barNodes = this._getBarChart(this.props.data.combined, _maxFeatures);
        }

		return (
    		<div className="genome-snapshot panel">
                {this.state.showChromosomes ? buttonNode: null}
                {barNodes}
                {buttonNode}
    		</div>
        );
	},

    _getBarChart: function(data, maxY) {
        var _colorScale = (d) => {
            return d.nestedValues ? "#1f77b4" :  "#DF8B93";
        };
        var _labelRatio = 0.2;

        // init legend
        var totalOrfs = data[0].value;
        var legendElements = _.map(data[0].nestedValues, (entry, i) => {
            var _colors = ["#1f77b4", "#aec7e8", "#999"];
            var _percent = totalOrfs > 0 ? Math.round(entry.value/totalOrfs * 100) : "n/a";
            return {
                text: `${_percent}% ${entry.name}`,
                color: _colors[i]
            };
        });
        var legendNode = <div style={{ marginLeft: `${_labelRatio * 100}%`, fontSize: 12 }}><Legend elements={legendElements} labelText={`${totalOrfs.toLocaleString()} ORFs`} /></div>;

        var barNode = (<BarChart
            data={data} yValue={ function (d) { return d.value; } }
            labelValue={ function (d) { return d.name; } } labelRatio={_labelRatio} colorScale={_colorScale}
            hasTooltip={true} hasYAxis={false} maxY={maxY} hasNonZeroWidth={true}
        />);

        var axisNode = (<div style={{ height: 53 }}>
            <StandaloneAxis domain={[0, maxY]} labelText="Features" leftRatio={_labelRatio} />
        </div>);

        return [axisNode, legendNode, barNode];
    }
});
