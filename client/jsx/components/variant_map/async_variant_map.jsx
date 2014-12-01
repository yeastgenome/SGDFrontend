/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var DropdownChecklist = require("../widgets/dropdown_checklist.jsx");
var Drawer = require("./drawer.jsx");
var VariantHeatmap = require("./variant_heatmap.jsx");

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
		id: j,
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

module.exports = React.createClass({
	getInitialState: function () {
		return {
			drawerVisible: false,
			selectedLocusId: null
		};
	},

	render: function () {
		var heatmapNode = this._getHeatmapNode();

		var _onExit = () => {
			this.setState({ drawerVisible: false });
		};
		// TEMP hardcoded locus id for RAD54 and display name
		var drawerNode = this.state.drawerVisible ? <Drawer onExit={_onExit} locusDisplayName="RAD54" locusId={4672} /> : null;
		return (<div>
			<p><i className="fa fa-exclamation" /> This is a development version of this tool.  Data are NOT accurate.</p>
			<div className="row">
					<div className="columns small-6">
						<h1>Variant Map</h1>
						<hr />
						<div style={{ float: "right", marginTop: "0.5em" }}>
							<DropdownChecklist />
						</div>
					</div>
					<div className="columns small-6 clearfix panel">
						{heatmapNode}
					</div>
			</div>
			{drawerNode}
		</div>);
	},

	_getHeatmapNode: function () {
		// TEMP
		var _onClick = (d) => {
			this.setState({
				drawerVisible: true,
				selectedLocusId: d.id
			});
		};
		return (<VariantHeatmap
			data={heatpmapData}
			strainData={_strainMetaData}
			onClick={_onClick}
		/>);
	}
});
