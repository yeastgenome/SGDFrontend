/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");
var d3 = require("d3");

var BarChart = require("../components/viz/bar_chart.jsx");
var Legend = require("../components/viz/legend.jsx");

module.exports = React.createClass({

    getInitialState: function () {
        return {
            showChromosomes: false,
        };
    },

    toggleShowChromosomes: function (e) {
        e.preventDefault();
        this.setState({
            showChromosomes: !this.state.showChromosomes,
        });
    },

    render: function () {
        // prepare chromsomeNodes
        // If showChromosomes, create an array of ChromsomeSnapshots for each in chromosome data.
        // Otherwise, show combined features by making a single Chromsome snapshot with combined data.

		// var _maxFeatures, _height;
  //       if (this.state.showChromosomes) {

  //           _height = 1500;
  //       } else {

  //           _height = 500;
  //       }

        var _buttonText = this.state.showChromosomes ?
            <span>Hide Chromosomes&nbsp;<i className="fa fa-angle-up"></i></span> : <span>Show Chromosomes&nbsp;<i className="fa fa-angle-down"></i></span>;

        // init bar chart(s)
        var barNodes;
        if (this.state.showChromosomes) {
            var _maxFeatures = d3.max(this.props.data.chromosomes, (c) => {
                return c.features[0].value;
            });

            barNodes = _.map(this.props.data.chromosomes, (c) => {
                var chromosomeLabelNode = <h3 className="chromosome-label-text">{c.display_name}&nbsp;<a href={c.link}>Details</a></h3>;
                return [chromosomeLabelNode, this._getBarChart(c.features, _maxFeatures)];
            });

        } else {
            barNodes = this._getBarChart(this.props.data.combined);
        }

		return (
    		<div className="genome-snapshot panel">
                <h2 style={{ marginBottom: "1em" }}>Features by Type</h2>
                <a style={{ marginBottom: "1.5em", minWidth: 185 }}onClick={this.toggleShowChromosomes} className="button small" role="button">{_buttonText}</a>
                {barNodes}
    		</div>);
	},

    _getBarChart: function(data, maxY) {
        var _colorScale = (d) => {
            return d.nestedValues ? "#1f77b4" :  "#DF8B93";
        };

        // init legend
        var totalOrfs = data[0].value;
        var legendElements = _.map(data[0].nestedValues, (entry, i) => {
            var _colors = ["#1f77b4", "#aec7e8", "#999"]
            return {
                text: `${Math.round(entry.value/totalOrfs * 100)}% ${entry.name}`,
                color: _colors[i]
            };
        });
        var legendNode = <div style={{ marginLeft: "20%", fontSize: 12 }}><Legend elements={legendElements} labelText={`${totalOrfs.toLocaleString()} ORFs`} /></div>;

        var barNode = (<BarChart
            data={data} yValue={ function (d) { return d.value; } }
            labelValue={ function (d) { return d.name; } } labelRatio={0.2} colorScale={_colorScale}
            hasTooltip={true} hasYAxis={false} maxY={maxY}
        />);

        return [legendNode, barNode];
    }
});
