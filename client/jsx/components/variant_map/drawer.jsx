/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var LocusDiagram = require("../viz/locus_diagram.jsx");
var Parset = require("../viz/parset.jsx");
var MultiAlignmentViewer = require("./multi_alignment_viewer.jsx");
var SequenceNeighborsModel = require("../../models/sequence_neighbors_model.jsx");

var HEIGHT_WITH_SEQUENCE = 580;
var HEIGHT_WITHOUT_SEQUENCE = 390;

module.exports = React.createClass({

	propTypes: {
		locusDisplayName: React.PropTypes.string.isRequired,
		locusId: React.PropTypes.number.isRequired,
		onExit: React.PropTypes.func.isRequired,
		strainData: React.PropTypes.array.isRequired
	},

	getInitialState: function () {
		return {
			showSequence: false,
			neighborModelAttr: null,
			parsetPixelDomain: null, // [150, 200] screen x coordinates
			parsetCoordinateDomain: null, // [36000, 45000] sequence coordinates
		};
	},

	render: function () {
		var _height = this.state.showSequence ? HEIGHT_WITH_SEQUENCE : HEIGHT_WITHOUT_SEQUENCE;
		var _style = {
			position: "fixed",
			bottom: 0,
			left: 0,
			right: 0,
			height: _height,
			background: "#efefef",
			padding: "1rem",
			zIndex: 10
		};
		var _exitStyle = {
			position: "absolute",
			top: "0.5rem",
			right: "1rem",
			color: "black"
		};

		var locusDiagramNode = null;
		if (this.state.neighborModelAttr) {
			var attr = this.state.neighborModelAttr;

			// TEMP
			var _variantData = [1];

			locusDiagramNode = (<LocusDiagram
				contigData={attr.contigData}
				data={attr.data}
				domainBounds={attr.domainBounds}
				focusLocusDisplayName={this.props.locusDisplayName}
				showSubFeatures={false}
				variantData={_variantData}
				watsonTracks={Math.abs(attr.trackDomain[1])}
				crickTracks={Math.abs(attr.trackDomain[0])}
			/>);
		}

		var sequenceNode = this._getSequenceNode();
		return (<div style={_style}>
			<p><i className="fa fa-exclamation" /> This is a development version of this tool.  Data are NOT accurate.</p>
			<h1>
				{this.props.locusDisplayName}
				<a onClick={this.props.onExit} style={_exitStyle}><i className="fa fa-times"></i></a>
			</h1>
			{locusDiagramNode}
			{sequenceNode}
		</div>);
	},

	componentDidMount: function () {
	    this._fetchNeighborData();  
	},

	_fetchNeighborData: function () {
		var neighborModel = new SequenceNeighborsModel({ id: this.props.locusId });
		neighborModel.fetch( (err, response) => {
			if (this.isMounted()) this.setState({
				neighborModelAttr: neighborModel.attributes.mainStrain
			});
		});
	},

	_getSequenceNode: function () {
		var node;
		if (this.state.showSequence) {
			// TEMP fake some sequence data
			console.log(this.props.strainData)
		var exampleData = {
			sequences: [
				{
					name: "S288C",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "CEN.PK",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACTAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "FL100",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "D273-10B",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "JK9-3D",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "RM11-1a",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "SK1",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "W303",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				},
				{
					name: "Y55",
					href: "http://goog.com",
					sequence: "ATGGCAAGACGCAGATTACCAGACAGACCACCAAATGGAATAGGAGCCGGTGAACGGCCGAGACTGGTACCTAGGCCTATTAACGTACAAGACTCGGTGAACCGACTAACGAAACCGTTCAGGGTCCCGTACAAGAACACGCACATCCCGCCCGCTGCTGGTAGAATCGCCACCGGGTCTGATAATATCGTAGGAGGAAGGAGCTTGAGGAAAAGATCAGCGACTGTATGTTATTCCGGCTTGGATATAAATGCGGACGAAGCAGAGTACAACAGCCAAGACATAAGTTTTTCTCAGTTGACTAAACGACGGAAGGATGCTCTTAGTGCTCAAAGGTTGGCCAAGGATCCGACA"
				}
			],
			segments: [
				{
					domain: [0, 88],
					visible: false
				},
				{
					domain: [88, 89],
					visible: true
				},
				{
					domain: [90, 354],
					visble: false
				}
			]
		};
			node = (<div>
				<Parset pixelDomain={this.state.parsetPixelDomain} coordinateDomain={this.state.parsetPixelDomain}/>
				<MultiAlignmentViewer segments={exampleData.segments} sequences={exampleData.sequences} />
			</div>);
		} else {
			node = <p className="text-center" style={{ marginTop: "1rem" }}><a className="button secondary small" onClick={this._showSequence}>Show Sequence</a></p>;
		}
		return node;
	},

	_showSequence: function (e) {
		e.stopPropagation();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ showSequence: true });
	}
});
