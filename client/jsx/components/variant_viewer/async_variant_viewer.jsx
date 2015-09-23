/** @jsx React.DOM */
"use strict";
var Radium = require("radium");
var React = require("react");
var _ = require("underscore");

var VariantViewerComponent = require("sgd_visualization").VariantViewerComponent;
var RadioSelector = require("../widgets/radio_selector.jsx");

var AsyncVariantViewer = React.createClass({
	propTypes: {
		sgdid: React.PropTypes.string.isRequired,
		store: React.PropTypes.object.isRequired,
		parentIsProtein: React.PropTypes.bool
	},

	getDefaultProps: function () {
		return { parentIsProtein: false };
	},

	getInitialState: function () {
		return {
			data: null,
			childIsProtein: this.props.parentIsProtein
		};
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
		});
	},

	_renderContentNode: function () {
		var data = this.state.data;
		if (!data) return <div className="sgd-loader-container"><div className="sgd-loader" /></div>;
		
		var vizNode = this.state.childIsProtein ? this._renderProteinViz() : this._renderDnaViz();
		return (
			<div>
				{this._renderHeader()}
				{vizNode}
			</div>
		);
	},

	_renderHeader: function () {
		var data = this.state.data;
		if (!data) return null;
		var name = (data.name === data.format_name) ? data.name : `${data.name} / ${data.format_name}`;

		// init radio selector
		var _elements = [{ name: "DNA", key: "dna" }, { name: "Protein", key: "protein" }];
		var _onSelect = key => { this.setState({ childIsProtein: (key === "protein") }); };
		var _init = this.state.childIsProtein ? "protein" : "dna";
		var radioNode = <RadioSelector elements={_elements} onSelect={_onSelect} initialActiveElementKey={_init} />;
		return (
			<div style={[style.headerWrapper]}>
				<div style={[style.textWrapper]}>
					<h1 style={[style.textElement]}>{name}</h1>
					<p style={[style.textElement, style.description]}>{data.description}</p>
				</div>
				<div style={[style.radio]}>
					{radioNode}
				</div>
			</div>
		);
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
			blockStarts={data.block_starts}
			blockSizes={data.block_sizes}
			contigName={data.contig_name}
			alignedDnaSequences={dnaSeqs}
			variantDataDna={data.variant_data_dna}
			dnaLength={data.dna_length}
			strand={"+"}
			isProteinMode={false}
			downloadCaption={CAPTION}
			isRelative={true}
		/>);
		// contigHref
	},

	_renderProteinViz: function () {
		var data = this.state.data;
		var proteinSeqs = data.aligned_protein_sequences.map( d => {
			return {
				name: d.strain_display_name,
				id: d.strain_id,
				href: d.strain_link,
				sequence: d.sequence
			};
		});
		// correct the fact that some ids are null for domains
		var _id;
		var _domains = data.protein_domains.map( (d, i) => {
			_id = d.id || i;
			return _.extend(d, { id: _id });
		});
		return (<VariantViewerComponent
			name={data.name}
			chromStart={data.chrom_start}
			chromEnd={data.chrom_end}
			contigName={data.contig_name}
			
			alignedProteinSequences={proteinSeqs}
			variantDataProtein={data.variant_data_protein}
			proteinLength={data.protein_length}
			strand={"+"}
			isProteinMode={true}
			domains={_domains}
			downloadCaption={CAPTION}
		/>);
	}
});

var style = {
	headerWrapper: {
		display: "flex",
		justifyContent: "space-between",
		marginTop: -12
	},
	textWrapper: {
		display: "flex",
		alignItems: "flex-end"
	},
	textElement: {
		marginTop: 0,
		marginBottom: 0
	},
	description: {
		marginBottom: "0.2rem",
		marginLeft: "1rem"
	},
	radio: {
		width: "11rem",
		marginTop: 5,
		marginRight: "2rem"
	}
};

var CAPTION = "SGD";

module.exports = Radium(AsyncVariantViewer);
