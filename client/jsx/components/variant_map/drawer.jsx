/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var AlignmentShowModel = require("../../models/alignment_show_model.jsx");
var MultiAlignmentViewer = require("./multi_alignment_viewer.jsx");
var LocusDiagram = require("../viz/locus_diagram.jsx");
var Parset = require("../viz/parset.jsx");

// router stuff
var Router = require("react-router");
var { Route, RouteHandler, Link, Transition } = Router;

var HEIGHT_WITH_SEQUENCE = 680;
var HEIGHT_WITHOUT_SEQUENCE = 345;

var Drawer = React.createClass({
	mixins: [Router.Navigation, Router.State],

	propTypes: {
		isProteinMode: React.PropTypes.bool,
		locusId: React.PropTypes.number.isRequired,
		locusName: React.PropTypes.string.isRequired,
		locusHref: React.PropTypes.string.isRequired,
		strainIds: React.PropTypes.array.isRequired
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
		this.transitionTo("variantViewerIndex");
	},

	_fetchData: function () {
		var showModel = new AlignmentShowModel({
			id: this.props.locusId,
			strainIds: this.props.strainIds
		});
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
		
		this.setState({
			highlightedAlignedSegment: [start, end],
			parsetVisible: true
		});
	},

	_getContentNode: function () {
		var sequenceNode = this._getSequenceNode();
		var parsetNode = this._getParsetNode();

		var model = this.state.alignmentModel;
		var locusData = model.getLocusDiagramData();
		var variantData = model.getVariantData(this.props.isProteinMode);
		var watsonTracks = model.attributes.strand === "+" ? 2 : 1;

		var _onSetX1Scale = scale => {
			this.setState({ x1Scale: scale });
		};
		var _onVariantMouseOver = (start, end) => {
			var _highlightDomain;
			if (model.attributes.strand === "+") {
				_highlightDomain = [start - 1, end - 1];
			} else {
				_highlightDomain = [end - 1, start - 1];
			}
			_highlightDomain = _.sortBy(_highlightDomain);
			this._highlightSegment(_highlightDomain[0], _highlightDomain[1]);
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
				relativeCoordinateAxis={true} proteinCoordinateAxis={this.props.isProteinMode}
				hasControls={false}
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
		var contigData = this.state.alignmentModel.getLocusDiagramData().contigData;
		var text = `${_refCoord[0]}..${_refCoord[1]}`;
		// if a SNP (actually one nucleotide) make the text refer to the position, not a range
		if (Math.abs(_refCoord[1] - _refCoord[0]) === 1) {
			var _coord = (this.state.alignmentModel.attributes.strand === "+") ? _refCoord[0] : _refCoord[1];
			text = _coord.toString();
		}

		return (<Parset 
			isVisible={this.state.parsetVisible}
			x1Coordinates={parsetX1Coord}
			x2Coordinates={parsetX2Coord}
			text={text}
			contigDisplayName={contigData.display_name}
			contigHref={contigData.link}
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
			if (isRelative) offset -= (this.props.isProteinMode ? 3 : 1);
			var _relEnd = _coord.end - _coord.start;
			x1Start = _relEnd - x1Start;
			x1End = _relEnd - x1End;
			return [offset + x1End, offset + x1Start];
		}
		return [offset + x1Start, offset + x1End];
	},

	_getSequenceNode: function () {
		var node;
		if (this.state.showSequence) {
			var _sequences = this.state.alignmentModel.formatSequences(this.props.isProteinMode, this.props.strainIds);
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
			var _canShowSequence = this.state.alignmentModel.canShowSequence(this.props.isProteinMode);
			var _onClick = _canShowSequence ? this._showSequence : null;
			var _klass = _canShowSequence ? "button secondary small" : "button secondary small disabled";
			node = <p className="text-center" style={{ marginTop: "1rem" }}><a className={_klass} onClick={_onClick}>Show Sequence</a></p>;
		}
		return node;
	},

	_showSequence: function (e) {
		e.stopPropagation();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ showSequence: true });
	}
});

module.exports = Drawer;
