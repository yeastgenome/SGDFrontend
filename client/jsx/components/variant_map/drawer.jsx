/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var AlignmentShowModel = require("../../models/alignment_show_model.jsx");
var MultiAlignmentViewer = require("./multi_alignment_viewer.jsx");
var LocusDiagram = require("../viz/locus_diagram.jsx");
var Parset = require("../viz/parset.jsx");

var HEIGHT_WITH_SEQUENCE = 680;
var HEIGHT_WITHOUT_SEQUENCE = 345;

module.exports = React.createClass({

	propTypes: {
		isProteinMode: React.PropTypes.bool,
		locusId: React.PropTypes.number.isRequired,
		locusName: React.PropTypes.string.isRequired,
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
			highlightedSegment: null, // [0, 100] relative coord
			parsetVisible: false,
			locusX1Scale: function () {},
			parsetX1Coordinates: [0, 0],
			parsetX2Coordinates: [0, 0],
			parsetData: {}
		};
	},

	render: function () {
		// var _height = this.state.showSequence ? HEIGHT_WITH_SEQUENCE : HEIGHT_WITHOUT_SEQUENCE;
		var _screenHeight = window.innerHeight;
		var _drawerHeight = Math.min((this.state.showSequence ? 0.7 * _screenHeight : HEIGHT_WITHOUT_SEQUENCE), HEIGHT_WITH_SEQUENCE);
		var _maskHeight = _screenHeight - _drawerHeight;
		var _maskStyle = {
			position: "fixed",
			top: 0,
			right: 0,
			left: 0,
			height: _maskHeight,
			zIndex: 10
		};
		var _drawerWrapperStyle = {
			position: "fixed",
			bottom: 0,
			left: 0,
			right: 0,
			height: _drawerHeight,
			background: "#efefef",
			padding: "1rem",
			zIndex: 10,
			overflow: "scroll"
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
			<div style={_drawerWrapperStyle}>
				<div>
					<h1>
						<a onClick={this._exit} style={_exitStyle}><i className="fa fa-times"></i></a>
					</h1>
					<h1>{this.props.locusName}</h1>
					{contentNode}		
				</div>
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
		var sequenceNode = this._getSequenceNode();
		var parsetNode = this._getParsetNode();

		var model = this.state.alignmentModel;
		var locusData = model.getLocusDiagramData();
		var _rawVariantData = this.props.isProteinMode ? model.attributes.variant_data_protein : model.attributes.variant_data_dna;
		var _start = model.attributes.coordinates.start;
		var variantData = _.map(_rawVariantData, d => {
			var _factor = this.props.isProteinMode ? 3 : 1;
			return {
				coordinateDomain: [d.start * _factor + _start, d.end * _factor + _start]
			};
		});
		var watsonTracks = model.attributes.strand === "+" ? 2 : 1;

		var _onSetLocusDomain = (scale) => {
			this.setState({ locusX1Scale: scale });
		};

		return (<div>
			<h3>S288C Location: <a href={locusData.contigData.link}>{locusData.contigData.display_name}</a> {locusData.start}..{locusData.end}</h3>
			<LocusDiagram
				focusLocusDisplayName={model.attributes.display_name} contigData={locusData.contigData}
				data={locusData.data} domainBounds={locusData.domainBounds} variantData={variantData}
				showVariants={true} watsonTracks={watsonTracks} ignoreMouseover={true} highlightedRelativeCoordinates={this.state.highlightedSegment}
				onSetDomain={_onSetLocusDomain}
			/>
			{parsetNode}
			{sequenceNode}
		</div>);
	},

	_getParsetNode: function () {
		if (!this.state.showSequence) return null;

		return (<Parset 
			isVisible={this.state.parsetVisible}
			x1Coordinates={this.state.parsetX1Coordinates}
			x2Coordinates={this.state.parsetX2Coordinates}
			data={this.props.parsetData}
		/>);
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

			var _segments = this.state.alignmentModel.formatSegments(this.props.isProteinMode);
			var x1Scale = this.state.locusX1Scale;;
			var _onMouseOver = (start, end, startX, endX) => {
				var _coord = this.state.alignmentModel.attributes.coordinates;
				var _factor = this.props.isProteinMode ? 3 : 1;
				this.setState({
					highlightedSegment: [start * _factor, end * _factor],
					parsetX1Coordinates: [x1Scale(_coord.start + start), x1Scale(_coord.start + end)],
					parsetX2Coordinates: [startX, endX],
					parsetVisible: true
				});
			};
			node = (<div>
				<MultiAlignmentViewer
					segments={_segments} sequences={_sequences}
					onMouseOver={_onMouseOver}
				/>
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
