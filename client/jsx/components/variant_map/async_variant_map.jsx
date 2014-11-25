/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var DropdownChecklist = require("../widgets/dropdown_checklist.jsx");
var VariantHeatmap = require("./variant_heatmap.jsx");

module.exports = React.createClass({
	render: function () {
		var heatmapNode = this._getHeatmapNode();
		return (<div>
			<div className="row">
					<div className="columns small-6">
						<h1>Variant Map</h1>
					</div>
					<div className="columns small-6 clearfix">
						<div style={{ float: "right", marginTop: "0.5em" }}>
							<DropdownChecklist />
						</div>
					</div>
			</div>
			<hr />
			<div style={{ height: 600 }}>
				{heatmapNode}
			</div>
		</div>);
	},

	_getHeatmapNode: function () {
		// TEMP
		// FAKE HEATMAP DATA
		var heatpmapData = [];
		var _numGenes = 6400;
		var numStrains = 14;

		for (var j = 0; j <= _numGenes; j++) {
			var _variantData = [];
			for (var k = numStrains; k >= 0; k--) {
				_variantData.push(Math.random());
			}
			heatpmapData.push({
				name: "Gene" + j,
				variationData: _variantData
			});
		}
		// strain data for heatmap, also FAKE
		var _strainMetaData = [];
		for (var i = numStrains; i >= 0; i--) {
			_strainMetaData.push ({
				name: "Strain" + i
			});
		};
		_strainMetaData = _strainMetaData.reverse();

		return (<VariantHeatmap
			data={heatpmapData}
			strainData={_strainMetaData}
		/>);
	}
});
