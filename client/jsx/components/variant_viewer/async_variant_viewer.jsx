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
		var dnaSeqs = data.aligned_dna_sequences.map( d => {
			return {
				name: d.strain_display_name,
				id: d.strain_id,
				href: d.strain_link,
				sequence: d.sequence
			};
		});
		return (<VariantViewerComponent
			name={data.name}
			chromStart={data.chrom_start}
			chromEnd={data.chrom_end}
			contigName={data.contig_name}
			
			alignedDnaSequences={dnaSeqs}
			variantDataDna={data.variant_data_dna}
			dnaLength={data.dna_length}
			strand={data.strand}
			isProteinMode={false}
			downloadCaption={CAPTION}
			isRelative={true}
		/>);
		// contigHref
	},

	_renderProteinViz: function () {
		var data = this.state.data;
		var proteinSeqs = data.aligned_dna_sequences.map( d => {
			return {
				name: d.strain_display_name,
				id: d.strain_id,
				href: d.strain_link,
				sequence: d.sequence
			};
		});
		return (<VariantViewerComponent
			name={data.name}
			chromStart={data.chrom_start}
			chromEnd={data.chrom_end}
			contigName={data.contig_name}
			
			alignedProteinSequences={proteinSeqs}
			variantDataProtein={data.variant_data_protein}
			proteinLength={data.protein_length}
			strand={data.strand}
			isProteinMode={true}
			domains={data.domains}
			downloadCaption={CAPTION}
		/>);
	}
});

var CAPTION = "SGD";

module.exports = AsyncVariantViewer;
