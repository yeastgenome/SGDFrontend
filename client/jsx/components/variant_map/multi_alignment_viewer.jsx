"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var getJaggedScale = require("./get_jagged_scale.jsx");
var MultiScaleAxis = require("./multi_scale_axis.jsx");

// TEMP vars
var AXIS_HEIGHT = 30;
var FONT_SIZE = 14;
var LABEL_WIDTH = 150;
var PX_PER_CHAR = 9.25;
var TICK_HEIGHT = 6;

module.exports = React.createClass({

	propTypes: {
		// highlightedSegmentDomain: null or [start, end]
		onHighlightSegment: React.PropTypes.func, // (start, end) =>
		onSetScale: React.PropTypes.func, // scale =>
		segments: React.PropTypes.array.isRequired,
		sequences: React.PropTypes.array.isRequired
	},

	getDefaultProps: function () {
		return {
			highlightedSegmentDomain: null
		};
	},

	getInitialState: function () {
		return {
			activeSequenceName: null,
		};
	},

	render: function () {
		var labelsNode = this._getLabelsNode();
		var segmentNodes = this._getSegmentNodes();
		var visibleSequenceNodes = this._getVisibleSegmentNodes();
		var highlightedSegmentNode = this._getHighlightedSegmentNode();

		var xScale = this._getXScale();
		var maxX = xScale.range()[xScale.range().length - 1];

		// TEMP constant height
		return (<div>
			{labelsNode}
			<div ref="scroller" style={{ width: "100%", overflow: "scroll" }}>
				<div style={{ width: maxX + LABEL_WIDTH }}>
					<MultiScaleAxis segments={this.props.segments} scale={xScale} />
					<svg ref="svg" style={{ width: "100%", height: 600 }}>
						{highlightedSegmentNode}
						{segmentNodes}
						{visibleSequenceNodes}
					</svg>
				</div>
			</div>
		</div>);
	},

	componentDidMount: function () {
		if (this.props.onSetScale) {
			var _scale = this._getXScale();
			this.props.onSetScale(_scale);
		}
		this.refs.scroller.getDOMNode().onscroll = this._onScroll;
	},

	_onScroll: function (e) {
		if (!this.props.onSetScale) return;
		var _scrollLeft = this.refs.scroller.getDOMNode().scrollLeft;
		var _xScale = this._getXScale();
		var _oldRange = _xScale.range();
		var _newRange = _oldRange.map( d => {
			return d - _scrollLeft;
		});
		var _newScale = _xScale
			.copy()
			.range(_newRange);
		this.props.onSetScale(_newScale);
	},

	_onSegmentMouseOver: function (e, d, i, sequenceName) {
		if (this.props.onHighlightSegment) {
			var _start = d.domain[0];
			var _end = d.domain[1];
			this.props.onHighlightSegment(_start, _end);
		}
		this.setState({ activeSequenceName: sequenceName });
	},

	_clearMouseOver: function () {
		if (this.props.onHighlightSegment) this.props.onHighlightSegment(null);
		this.setState({ activeSequenceName: null });
	},

	_getLabelsNode: function () {
		var yScale = this._getYScale();
		var labelNodes = _.map(this.props.sequences, (s, i) => {
			var _style = {
				position: "absolute",
				right: "1rem",
				top: yScale(s.name) + 28
			}
			var indicatorNode = (this.state.activeSequenceName === s.name) ? <i className="fa fa-chevron-right"></i> : null;
			return <a href={s.href} key={"sequenceAlignLabel" + i} target="_new" style={_style}>{indicatorNode} {s.name}</a>
		});
		return (<div style={{ position: "absolute", height: "100%", background: "#efefef", width: LABEL_WIDTH }}>
			{labelNodes}
		</div>);
	},

	_getSegmentNodes: function () {
		var xScale = this._getXScale();
		return _.map(this.props.segments, (s, i) => {
			var offset = s.visible ? PX_PER_CHAR / 2 : 0;
			var _x = xScale(s.domain[0]) - offset;
			var _y = 0;
			var _width = xScale(s.domain[1]) - xScale(s.domain[0]) + offset;
			var _height = this.props.sequences.length * FONT_SIZE + 3;
			var _fill = (i === this.state.mouseOverSegmentIndex) ? "#DEC113" : "none";
			var _opacity = 0.5;
			var _onMouseOver = e => {
				this._onSegmentMouseOver(e, s, i);
			}
			return <rect onMouseOver={_onMouseOver} key={"segRect" + i} x={_x} y={_y} width={_width} height={_height} fill={"none"} stroke="none" opacity={_opacity} style={{ pointerEvents: "all" }} />;
		});
	},

	_getHighlightedSegmentNode: function () {
		var hDom = this.props.highlightedSegmentDomain;
		if (!hDom) return null;
		var xScale = this._getXScale();
		var _x = xScale(hDom[0]);
		var _width = xScale(hDom[1]) - _x;
		var _fill = "#DEC113";
		var _opacity = 0.5;
		var _height = this.props.sequences.length * FONT_SIZE + 3;
		var _y = 0;
		return <rect x={_x} y={_y} width={_width} height={_height} fill={_fill} stroke="none" opacity={_opacity} />;
	},

	_getVisibleSequenceNodes: function (seg, i) {
		var xScale = this._getXScale();
		var yScale = this._getYScale();
		return _.map(this.props.sequences, (seq, _i) => {
			var _seqText = seq.sequence.slice(seg.domain[0] - 1, seg.domain[1] - 1)
			var _transform = `translate(${xScale(seg.domain[0])}, ${yScale(seq.name)})`;
			var _onMouseOver = e => {
				this._onSegmentMouseOver(e, seg, i, seq.name);
			};
			return <text onMouseOver={_onMouseOver} key={"variantSeqNode" + i + "_" + _i} transform={_transform} fontSize={FONT_SIZE} fontFamily="Courier" >{_seqText}</text>;
		});
	},

	_getSummarizedSegmentNode: function (startCoordinate, endCoordinate, key) {
		return null;
		var xScale = this._getXScale();
		var yScale = this._getYScale();

		var _yTranslate = (yScale.rangeExtent()[1] - yScale.rangeExtent()[0]) / 2;
		var _transform = `translate(0, ${_yTranslate})`;
		return (<g className="summarized-segment" key={key} transform={_transform}>
			<line stroke="black" strokeDasharray="3px 3px" x1={xScale(startCoordinate)} x2={xScale(endCoordinate)} y1="0" y2="0" style={{ shapeRendering: "crispEdges" }}/>
			<line stroke="black" strokeDasharray="3px 3px" x1={xScale(startCoordinate)} x2={xScale(endCoordinate)} y1="15" y2="15" style={{ shapeRendering: "crispEdges" }}/>
		</g>);
	},

	_getVisibleSegmentNodes: function () {
		return _.reduce(this.props.segments, (memo, seg, i) => {
			if (seg.visible) {
				memo = memo.concat(this._getVisibleSequenceNodes(seg, i));
			} else {
				memo.push(this._getSummarizedSegmentNode(seg.domain[0], seg.domain[1], "summarizedSequence" + i));
			}
			return memo;
		}, []);
	},

	// returns a d3 scale which has multiple linear scale segments corresponding to segments prop
	_getXScale: function () {
		return getJaggedScale(this.props.segments);
	},

	_getYScale: function () {
		var height = (this.props.sequences.length + 1) * (PX_PER_CHAR + 3);
		var names = _.map(this.props.sequences, s => { return s.name; });
		return d3.scale.ordinal()
			.domain(names)
			.rangePoints([PX_PER_CHAR + 3, height + PX_PER_CHAR]);
	}
});
