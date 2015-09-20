/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var VariantViewerComponent = require("sgd_visualization").VariantViewerComponent;

var AsyncVariantViewer = React.createClass({
	propTypes: {
		sgdid: React.PropTypes.string.isRequired,
		store: React.PropTypes.object.isRequired,
		isProtein: React.PropTypes.bool
	},

	getDefaultProps: function () {
		return { isProtein: false };
	},

	getInitialState: function () {
		return { data: null };
	},

	render: function () {
		return (
			<div>
				{this._renderContentNode()}
			</div>
		);
	},

	componentDidMount: function () {
		this.props.store.fetchLocusData(this.props.sgdid, (err, _data) => {
			if (this.isMounted()) {
				this.setState({ data: _data });
			}
		})
	},

	_renderContentNode: function () {
		if (!this.state.data) return <div className="sgd-loader-container"><div className="sgd-loader" /></div>;
		return this.props.isProtein ? this._renderProteinViz() : this._renderDnaViz();
	},

	_renderDnaViz: function () {
		var data = this.state.data;
		return (<VariantViewerComponent
			name={data.name}
			chromStart={data.chromStart}
			chromEnd={data.chromEnd}
			contigName={data.contigName}
			contigHref={data.contigHref}
			alignedDnaSequences={data.alignedDnaSequences}
			variantDataDna={data.variantDataDna}
			dnaLength={data.dnaLength}
			strand={data.strand}
			isProteinMode={false}
			downloadCaption={CAPTION}
		/>)
	},

	_renderProteinViz: function () {
		var data = this.state.data;
		return (<VariantViewerComponent
			name={data.name}
			chromStart={data.chromStart}
			chromEnd={data.chromEnd}
			contigName={data.contigName}
			contigHref={data.contigHref}
			alignedProteinSequences={data.alignedProteinSequences}
			variantDataProtein={data.variantDataProtein}
			proteinLength={data.proteinLength}
			strand={data.strand}
			isProteinMode={true}
			domains={data.domains}
			downloadCaption={CAPTION}
		/>);
	}
});

var CAPTION = "SGD";

module.exports = AsyncVariantViewer;
