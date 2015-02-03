"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var getJaggedScale = require("./get_jagged_scale.jsx");
var MultiScaleAxis = require("./multi_scale_axis.jsx");

// TEMP vars
var AXIS_HEIGHT = 30;
var FONT_SIZE = 14;
var LABEL_WIDTH = 180;
var PX_PER_CHAR = 9.25;
var TICK_HEIGHT = 6;

module.exports = React.createClass({

	propTypes: {
		onMouseOverCoordinates: React.PropTypes.func, // (start, end) =>
		onMouseOverXCoordinates: React.PropTypes.func, // (startX, endX) =>
		segments: React.PropTypes.array.isRequired,
		sequences: React.PropTypes.array.isRequired
	},

	getInitialState: function () {
		return {
			activeSequenceName: null,
			mouseOverSegmentIndex: null
		};
	},

	render: function () {
		var labelsNode = this._getLabelsNode();
		var segmentNodes = this._getSegmentNodes();
		var visibleSequenceNodes = this._getVisibleSegmentNodes();

		var xScale = this._getXScale();
		var maxX = xScale.range()[xScale.range().length - 1];

		// TEMP constant height
		return (<div>
			{labelsNode}
			<div style={{ width: "100%", overflow: "scroll" }}>
				<div style={{ width: maxX + LABEL_WIDTH }}>
					<MultiScaleAxis segments={this.props.segments} scale={xScale} />
					<svg ref="svg" style={{ width: "100%", height: 600 }}>
						{segmentNodes}
						{visibleSequenceNodes}
					</svg>
				</div>
			</div>
		</div>);
	},

	_onSegmentMouseOver: function (e, d, i) {
		var xScale = this._getXScale();
		if (this.props.onMouseOverXCoordinates) {
			var _startX = xScale(d.domain[0]);
			var _endX = xScale(d.domain[1]);
			this.props.onMouseOverXCoordinates(_startX, _endX);
		}
		if (this.props.onMouseOverCoordinates) {
			var _start = d.domain[0];
			var _end = d.domain[1];
			this.props.onMouseOverCoordinates(_start, _end);
		}
		this.setState({
			mouseOverSegmentIndex: i
		});
	},

	_clearMouseOver: function () {
		this.setState({
			mouseOverSegmentIndex: null
		});
	},

	_getLabelsNode: function () {
		var yScale = this._getYScale();
		var labelNodes = _.map(this.props.sequences, (s, i) => {
			var _style = {
				position: "absolute",
				right: "1rem",
				top: yScale(s.name) + 26
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
			// var _visibleColor = s.visible ? "#17B0EF" : "black";
			var _fill = (i === this.state.mouseOverSegmentIndex) ? "gray" : "none";
			var _opacity = 0.5;
			var _onMouseOver = e => {
				this._onSegmentMouseOver(e, s, i);
			}
			return <rect onMouseOver={_onMouseOver} key={"segRect" + i} x={_x} y={_y} width={_width} height={_height} fill={_fill} stroke="none" opacity={_opacity} style={{ pointerEvents: "all" }} />;
		});
	},

	_getVisibleSequenceNodes: function (seg, i) {
		var xScale = this._getXScale();
		var yScale = this._getYScale();
		return _.map(this.props.sequences, (seq, _i) => {
			var _seqText = seq.sequence.slice(seg.domain[0] - 1, seg.domain[1] - 1)
			var _transform = `translate(${xScale(seg.domain[0]) - PX_PER_CHAR / 2}, ${yScale(seq.name)})`;
			var _onMouseOver = e => {
				this.setState({
					activeSequenceName: seq.name,
					mouseOverSegmentIndex: i
				});
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
