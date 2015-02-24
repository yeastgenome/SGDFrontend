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
		locusHref: React.PropTypes.string.isRequired,
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
			highlightedAlignedSegment: null, // [0, 100] relative coord to aligned sequence
			highlightedSegment: null, // [0, 100] relative coord
			parsetVisible: false,
			x1Scale: function () { return 0; },
			x2Scale: function () { return 0; }
		};
	},

	render: function () {
		var _screenHeight = window.innerHeight;
		var _drawerHeight = Math.min((this.state.showSequence ? 0.9 * _screenHeight : HEIGHT_WITHOUT_SEQUENCE), HEIGHT_WITH_SEQUENCE);
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
					<h1><a href={this.props.locusHref}>{this.props.locusName}</a></h1>
					{contentNode}		
				</div>
			</div>
		</div>);
	},

	componentDidMount: function () {
	    this._fetchData();
	},

	_exit: function () {
		this.setState({
			alignmentModel: null,
			isPending: true
		});
		this.props.onExit();
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

	_highlightSegment: function (start, end) {
		var model = this.state.alignmentModel;
		var _attr = model.attributes;
		var _coord = _attr.coordinates;
		var _refDomain = model.getReferenceCoordinatesFromAlignedCoordinates(start, end, this.props.isProteinMode);
		var x1Start = _refDomain.start;
		var x1End = _refDomain.end;
		var _factor = this.props.isProteinMode ? 3 : 1;
		
		this.setState({
			highlightedAlignedSegment: [start, end],
			highlightedSegment: [x1Start * _factor, x1End * _factor],
			parsetVisible: true
		});
	},

	_getContentNode: function () {
		var sequenceNode = this._getSequenceNode();
		var parsetNode = this._getParsetNode();

		var model = this.state.alignmentModel;
		var locusData = model.getLocusDiagramData();
		var _start = model.attributes.coordinates.start;
		var _end = model.attributes.coordinates.end;
		var variantData = model.getVariantData(this.props.isProteinMode);
		var watsonTracks = model.attributes.strand === "+" ? 2 : 1;

		var _onSetX1Scale = scale => {
			this.setState({ x1Scale: scale });
		};
		var _onVariantMouseOver = (start, end) => {
			if (model.attributes.strand === "+") {
				this._highlightSegment(start - _start, end - _start);
			} else {
				this._highlightSegment(_end - end, _end - start);
			}
		};

		var _refCoord = this._getRefHighlightedCoordinates(true);
		return (<div>
			<h3>S288C Location: <a href={locusData.contigData.link}>{locusData.contigData.display_name}</a> {locusData.start}..{locusData.end}</h3>
			<LocusDiagram
				focusLocusDisplayName={model.attributes.display_name} contigData={locusData.contigData}
				data={locusData.data} domainBounds={locusData.domainBounds} variantData={variantData}
				showVariants={true} watsonTracks={watsonTracks}
				ignoreMouseover={true} highlightedRelativeCoordinates={_refCoord}
				onSetScale={_onSetX1Scale} onVariantMouseOver={_onVariantMouseOver}
				relativeCoordinateAxes={true} hasControls={false}
			/>
			{parsetNode}
			{sequenceNode}
		</div>);
	},

	_getParsetNode: function () {
		if (!this.state.showSequence) return null;

		var _alignedCoord = this.state.highlightedAlignedSegment || [0, 0];
		var _refCoord = this._getRefHighlightedCoordinates(false);
		var parsetX1Coord = _refCoord
			.map( d => {
				return this.state.x1Scale(d);
			});
		var parsetX2Coord = _alignedCoord
			.map( d => {
				return this.state.x2Scale(d);
			});
		var text = `S288C Coordinates ${_refCoord[0] - 1}..${_refCoord[1] - 1}`;

		return (<Parset 
			isVisible={this.state.parsetVisible}
			x1Coordinates={parsetX1Coord}
			x2Coordinates={parsetX2Coord}
			text={text}
		/>);
	},

	_getRefHighlightedCoordinates: function (isRelative) {
		var model = this.state.alignmentModel;
		var _attr = model.attributes;
		var _coord = _attr.coordinates;
		var _alignedCoord = this.state.highlightedAlignedSegment || [0, 0];
		var _refDomain = model.getReferenceCoordinatesFromAlignedCoordinates(_alignedCoord[0], _alignedCoord[1], this.props.isProteinMode);
		var x1Start = _refDomain.start;
		var x1End = _refDomain.end;
		var offset = isRelative ? 0 : _coord.start;
		if (_attr.strand === "-") {
			var _relEnd = _coord.end - _coord.start + 2;
			x1Start = _relEnd - x1Start;
			x1End = _relEnd - x1End;
			return [offset + x1End, offset + x1Start];
		}
		return [offset + x1Start, offset + x1End];
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
			var _onSetX2Scale = scale => {
				this.setState({ x2Scale: scale });
			};
			node = (<div>
				<MultiAlignmentViewer
					segments={_segments} sequences={_sequences}
					onHighlightSegment={this._highlightSegment} onSetScale={_onSetX2Scale}
					highlightedSegmentDomain={this.state.highlightedAlignedSegment}
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
