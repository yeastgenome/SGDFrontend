"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var TICK_HEIGHT = 6;
var PX_PER_CHAR = 9.25;
var HEIGHT = 35;

module.exports = React.createClass({
	propTypes: {
		segments: React.PropTypes.array.isRequired,
		scale: React.PropTypes.func.isRequired
	},

	render: function () {
		var tickNodes = this._getTickNodes();
		var segmentNodes = this._getSegmentNodes();

		return (<svg ref="svg" style={{ width: "100%", height: HEIGHT }}>
			{tickNodes}
			{segmentNodes}
		</svg>);
	},

	_getSegmentNodes: function () {
		var scale = this.props.scale;
		var segmentNodes= _.map(this.props.segments, (s, i) => {
			var _y = HEIGHT - 1;
			var _offset = s.visible ? 0 : 1;
			return (<line key={"segmentLine" + i}
				x1={scale(s.domain[0])}
				x2={scale(s.domain[1] + _offset)}
				y1={_y}
				y2={_y}
				strokeDasharray={s.visible ? null : "3px 3px"}
				stroke="black"
				fill="none"
			/>);
		});
		return segmentNodes;
	},

	_getTickNodes: function () {
		var scale = this.props.scale;

		var tickData = _.reduce(this.props.segments, (memo, s) => {
			if (s.domain[1] - s.domain[0] === 1) {
				return memo;
			} else {
				memo.push(s.domain[1] + 1);
				return memo;
			}
		}, [1]);
		
		var tickNodes = _.map(tickData, (t, i) => {
			var _transform = `translate(${scale(t + 0.5)}, ${HEIGHT - TICK_HEIGHT - 1})`;
			var _textTransform = `translate(5, 0) rotate(-90)`;
			return (<g key={"tick" + i} transform={_transform}>
				<text textAnchor="left" transform={_textTransform}>{t}</text>
				<line x1="0" x2="0" y1="2" y2={TICK_HEIGHT + 2} stroke="black" fill="none" />
			</g>);
		});
		return <g>{tickNodes}</g>
	}
});
