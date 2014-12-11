/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var Drawer = require("./drawer.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");
var SearchBar = require("../widgets/search_bar.jsx");
var VariantHeatmap = require("./variant_heatmap.jsx");
var StrainSelector = require("./strain_selector.jsx");

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
		name: "Strain" + i,
		key: Math.round(Math.random() * 10000)
	});
};
_strainMetaData = _strainMetaData.reverse();

module.exports = React.createClass({
	getInitialState: function () {
		return {
			drawerVisible: false,
			selectedLocusId: null,
			mode: "dna"
		};
	},

	render: function () {
		var heatmapNode = this._getHeatmapNode();

		var _onExit = () => {
			this.setState({ drawerVisible: false });
		};
		var _onRadioSelect = key => { this.setState({ mode: key }); };
		var _radioElements = [ { name: "DNA", key: "dna" }, { name: "Protein", key: "protein" }];

		// TEMP strain selector cb
		// ([123, 456]) =>
		var _onStrainSelect = activeStrainIds => {
			console.log(activeStrainIds);
		};

		// TEMP hardcoded locus id for RAD54 and display name
		var drawerNode = this.state.drawerVisible ? <Drawer onExit={_onExit} locusDisplayName="RAD54" locusId={4672} strainData={_strainMetaData} /> : null;
		return (<div>
			<p><i className="fa fa-exclamation" /> This is a development version of this tool.  Data are NOT accurate.</p>
			<h1>Variant Map</h1>
			<hr />
						
			<div className="row">
				<div className="columns small-12 medium-6">
					<SearchBar />
				</div>
				<div className="columns small-6 medium-2">
					<StrainSelector data={_strainMetaData} onSelect={_onStrainSelect} />
				</div>
				<div className="columns small-6 medium-4">
					<div style={{ marginTop: "0.35rem" }}>
						<RadioSelector elements={_radioElements} initialActiveElementKey={this.state.mode} onSelect={_onRadioSelect} />
					</div>
				</div>
			</div>
			<div className="panel" style={{ zIndex: 1 }}>
				{heatmapNode}
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
