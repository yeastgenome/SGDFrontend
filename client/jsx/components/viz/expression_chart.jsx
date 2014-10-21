/** @jsx React.DOM */
"use strict";

var React = require("react");
var google= require("google");

/*
	Depends on global "google" variable to render a google chart.
	Note:  This component is considered temporary, and has a bunch of legacy code that could be further customized.
*/
module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			data: null,
			minValue: null,
			maxValue: null
		};
	},

	render: function () {
		return <div></div>;
	},

	componentDidMount: function () {
		this._renderViz();
	},

	componentDidUpdate: function () {
		this._renderViz();
	},

	// LEGACY CODE COPIED HERE
	_renderViz: function () {
		var all_data = this.props.data;
		var min_value = this.props.minValue;
		var max_value = this.props.maxValue;

		if(all_data != null && Object.keys(all_data).length > 0) {
	        var capped_min = Math.max(-5.5, min_value);
	        var capped_max = Math.min(5, max_value);
	        var header_row = [];
	        var colors = [];
	        var indexes = [];
	        if(capped_min == -5.5) {
	            header_row.push('Low-Extreme');
	            colors.push('#13e07a');
	        }
	        indexes.push(header_row.length-1);
	        if(capped_min < 0) {
	            header_row.push('Low');
	            colors.push('#0d9853');
	        }
	        indexes.push(header_row.length-1);
	        if(capped_max >= 0) {
	            header_row.push('High');
	            colors.push('#980D0D');
	        }
	        indexes.push(header_row.length-1);
	        if(capped_max == 5) {
	            header_row.push('High-Extreme');
	            colors.push('#e01313');
	        }
	        indexes.push(header_row.length-1);

	        var datatable2 = [header_row];

	        for (var key in all_data) {
	            var value = parseFloat(key);
	            if(value == -5.5) {
	                for(var i=0; i < all_data[key]; i++) {
	                    var new_row = Array.apply(null, new Array(header_row.length));
	                    new_row[indexes[0]] = value;
	                    datatable2.push(new_row);
	                }
	            }
	            else if(value < 0) {
	                for(var i=0; i < all_data[key]; i++) {
	                    var new_row = Array.apply(null, new Array(header_row.length));
	                    new_row[indexes[1]] = value;
	                    datatable2.push(new_row);
	                }
	            }
	            else if(value == 5) {
	                for(var i=0; i < all_data[key]; i++) {
	                    var new_row = Array.apply(null, new Array(header_row.length));
	                    new_row[indexes[3]] = value;
	                    datatable2.push(new_row);
	                }
	            }
	            else {
	                for(var i=0; i < all_data[key]; i++) {
	                    var new_row = Array.apply(null, new Array(header_row.length));
	                    new_row[indexes[2]] = value;
	                    datatable2.push(new_row);
	                }
	            }
	        }

	        var options = {
				legend: { position: 'none' },
				hAxis: {title: 'log2 ratio', viewWindow: {min: -5.5, max: 5.5}},
				vAxis: {title: 'Number of conditions', logScale:true},
				height: 300,
				colors: colors,
				histogram: {bucketSize:.5, hideBucketItems:true},
				isStacked: true,
				titlePosition: 'none',
				tooltip: {trigger: 'none'}
	        };
	        var chart = new google.visualization.Histogram(this.getDOMNode());
	        // google.visualization.events.addListener(chart, 'ready', make_expression_ready_handler(min_value, max_value));
	        chart.draw(google.visualization.arrayToDataTable(datatable2), options);

	        // The select handler. Call the chart's getSelection() method
	        var selectHandler = function () {
	            window.location.href = '/locus/' + locus['sgdid'] + '/expression';
	        }
	        google.visualization.events.addListener(chart, 'select', selectHandler);
	    }
	}
});

