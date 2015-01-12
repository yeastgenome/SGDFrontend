/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var AlignmentShowModel = require("../../models/alignment_show_model.jsx");
var DropdownSelector = require("../widgets/dropdown_selector.jsx");
var LocusDiagram = require("../viz/locus_diagram.jsx");
var Parset = require("../viz/parset.jsx");
var MultiAlignmentViewer = require("./multi_alignment_viewer.jsx");

var HEIGHT_WITH_SEQUENCE = 580;
var HEIGHT_WITHOUT_SEQUENCE = 390;

module.exports = React.createClass({

	propTypes: {
		locusId: React.PropTypes.number.isRequired,
		onExit: React.PropTypes.func.isRequired,
		strainData: React.PropTypes.array.isRequired
	},

	getInitialState: function () {
		return {
			alignmentModel: null,
			showSequence: false,
			isPending: true,
			parsetPixelDomain: null, // [150, 200] screen x coordinates
			parsetCoordinateDomain: null, // [36000, 45000] sequence coordinates
		};
	},

	render: function () {
		var _height = this.state.showSequence ? HEIGHT_WITH_SEQUENCE : HEIGHT_WITHOUT_SEQUENCE;
		var _maskStyle = {
			position: "fixed",
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		};
		var _drawerStyle = {
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

		var contentNode = this.state.isPending ? 
			<div style={{ position: "relative", height: "100%" }}><img className="loader" src="/static/img/dark-slow-wheel.gif" /></div> :
			this._getContentNode();
		return (<div style={_maskStyle}>
			<div style={_drawerStyle}>
				<h1>
					<a onClick={this._exit} style={_exitStyle}><i className="fa fa-times"></i></a>
				</h1>
				{contentNode}
				
			</div>
		</div>);
	},

	_exit: function () {
		this.setState({
			alignmentModel: null,
			isPending: true
		});
		this.props.onExit();
	},

	componentDidMount: function () {
	    this._fetchData();
	},

	_fetchData: function () {
		var showModel = new AlignmentShowModel({ id: this.props.locusId });
		showModel.fetch( (err, res) => {
			if (this.isMounted()) this.setState({
				alignmentModel: showModel,
				isPending: false
			});
		});
	},

	_getContentNode: function () {
		var dropdownElements = _.map(this.props.strainData, d => {
			return {
				name: d.name,
				value: d.key
			};
		});
		var initialDropdownValue = dropdownElements[0].value;
		var sequenceNode = this._getSequenceNode();

		var model = this.state.alignmentModel;
		var locusData = model.getLocusDiagramData();
		return (<div>
			<DropdownSelector elements={dropdownElements} defaultActiveValue={initialDropdownValue} />
			<LocusDiagram
				focusLocusDisplayName={model.attributes.display_name} contigData={locusData.contigData}
				data={locusData.data} domainBounds={locusData.domainBounds}
			/>
			{sequenceNode}
		</div>);
	},

	_getSequenceNode: function () {
		var node;
		if (this.state.showSequence) {
			// TEMP fake some sequence data
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
					visible: false
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
