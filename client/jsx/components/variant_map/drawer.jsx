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
		isProteinMode: React.PropTypes.bool,
		locusId: React.PropTypes.number.isRequired,
		onExit: React.PropTypes.func.isRequired,
		strainData: React.PropTypes.array.isRequired
	},

	getDefaultProps: function () {
		return {
			isProteinMode: false
		};
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
			left: 0,
			bottom: _height,
			zIndex: 10
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
		return (<div>
			<div style={_maskStyle} onClick={this._exit} />
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
		var _rawVariantData = this.props.isProteinMode ? model.attributes.variant_data_protein : model.attributes.variant_data_dna;
		var _start = model.attributes.coordinates.start;
		var variantData = _.map(_rawVariantData, d => {
			return {
				coordinateDomain: [d.start + _start, d.end + _start]
			};
		});
		return (<div>
			<DropdownSelector elements={dropdownElements} defaultActiveValue={initialDropdownValue} />
			<LocusDiagram
				focusLocusDisplayName={model.attributes.display_name} contigData={locusData.contigData}
				data={locusData.data} domainBounds={locusData.domainBounds} variantData={variantData}
				showVariants={true}
			/>
			{sequenceNode}
		</div>);
	},

	_getSequenceNode: function () {
		var node;
		if (this.state.showSequence) {
			var _baseArray = this.props.isProteinMode ? this.state.alignmentModel.attributes.aligned_protein_sequences : this.state.alignmentModel.attributes.aligned_dna_sequences;
			var _sequences = _.map(_baseArray, d => {
				return {
					name: d.strain_display_name,
					href: d.strain_link,
					sequence: d.sequence
				};
			});

			var segments = this.state.alignmentModel.formatSegments();
			var exampleData = {
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
				<MultiAlignmentViewer segments={segments} sequences={_sequences} />
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
