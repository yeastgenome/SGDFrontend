"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var DEFAULT_DOM_SIDE_SIZE = 400; // height and width\
var FONT_SIZE = 14;
var HEADER_HEIGHT = 60;
var NODE_SIZE = 16;
var CANVAS_SIZE = 8000;
var LABEL_WIDTH = 120;

module.exports = React.createClass({
	propTypes: {
		data: React.PropTypes.array.isRequired,
		onClick: React.PropTypes.func,
		strainData: React.PropTypes.array.isRequired
	},

	getInitialState: function () {
		return {
			canvasScrollX: 0,
			DOMWidth: DEFAULT_DOM_SIDE_SIZE,
			DOMHeight: DEFAULT_DOM_SIDE_SIZE,
			mouseOverId: null,
		};
	},

	render: function () {
		var _scrollZoneSize = this.props.data.length * NODE_SIZE;
		var _canvasX = this._getCanvasX();
		var _canvasHeight = this._getYScale().range()[1] + HEADER_HEIGHT;

		var strainLabelsNode = this._getLabelsNode();
		var overlayNode = null// TEMP this._getOverlayNode();

		return (<div className="variant-heatmap" style={{ height: "100%", position: "relative"}}>
			{strainLabelsNode}
			<div ref="outerScroll" style={{ width: this.state.DOMWidth - LABEL_WIDTH, height: _canvasHeight, overflowX: "scroll", position: "relative", left: LABEL_WIDTH }}>
				<div style={{ position: "relative", width: _scrollZoneSize }}>
					<canvas ref="canvas" width={CANVAS_SIZE} height={_canvasHeight} style={{ position: "absolute", left: _canvasX }}/>
				</div>
				{overlayNode}
			</div>
		</div>);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this.refs.outerScroll.getDOMNode().onscroll = _.throttle(this._checkScroll, 100);
	},

	_getOverlayNode: function () {
		var chunkedData = this._getChunkedData();
		var rectNodes = _.map(chunkedData, (d, i) => {
			// UI events
			var _onClick;
			if (this.props.onClick) _onClick = e => {
				e.stopPropagation();
			    e.nativeEvent.stopImmediatePropagation();
				this.props.onClick(d);
			};
			var _onMouseOver = e => {
				e.stopPropagation();
			    e.nativeEvent.stopImmediatePropagation();
				this._onMouseOver(e, d);
			};

			// highlight if mouseover
			var mouseOverNode = null;
			if (d.id === this.state.mouseOverId) {
				mouseOverNode = <rect width={NODE_SIZE * d.variationData.length} height={NODE_SIZE} x={LABEL_WIDTH} y={0} stroke="yellow" fill="none" strokeWidth={2} />;
			}
			var _transform = `translate(0, ${i * NODE_SIZE})`;
			return (<g key={"heatmapOverlay" + i} transform={_transform}>
				{mouseOverNode}
				<rect onMouseOver={_onMouseOver} width={this.state.DOMWidth} height={NODE_SIZE} x={0} y={0} opacity={0} stroke="none" onClick={_onClick}/>
				<text dy={13} fontSize={FONT_SIZE}>{d.name}</text>
			</g>);
		});

		var _canvasY = this._getCanvasY();
		return (<svg ref="svg" style={{ position: "absolute", top: _canvasY, width: this.state.DOMWidth, height: CANVAS_SIZE, cursor: "pointer" }}>
			{rectNodes}
		</svg>);
	},

	// check to see if the scroll y needs to be redrawn
	_checkScroll: function () {
		var scrollLeft = this.refs.outerScroll.getDOMNode().scrollLeft;
		var scrollDelta = Math.abs(scrollLeft - this.state.canvasScrollX)
		if (scrollDelta > CANVAS_SIZE / 4) {
			this.setState({ canvasScrollX: scrollLeft });
		}
	},

	componentDidUpdate: function () {
		this._renderCanvas();
	},

	_onMouseOver: function (e, d) {
		// TODO, don't make canvas re-draw here
		this.setState({
			mouseOverId: d.id
		});
	},

	_calculateWidth: function () {
		var _clientRect = this.getDOMNode().getBoundingClientRect();
		this.setState({
			DOMWidth: _clientRect.width,
			DOMHeight: _clientRect.height
		});
	},

	_getChunkedData: function () {
		var _canvasX = this._getCanvasX();
		var _nodesPerCanvas = Math.round(CANVAS_SIZE / NODE_SIZE)
		var _dataStartIndex = Math.round(this._getXScale().invert(_canvasX));
		return this.props.data.slice(_dataStartIndex, _dataStartIndex + _nodesPerCanvas);
	},

	_getLabelsNode: function () {
		var nodes = this.props.strainData.map( (d, i) => {
			var _style = {
				position: "absolute",
				left: 0,
				top: HEADER_HEIGHT + i * NODE_SIZE - 3,
				fontSize: FONT_SIZE
			};
			return <span key={"strainLabel" + i} style={_style}>{d.name}</span>;
		});

		return (<div style={{ position: "relative" }}>
			{nodes}
		</div>);
	},


	_getXScale: function () {
		var _totalY = this.props.data.length * NODE_SIZE;
		return d3.scale.linear()
			.domain([0, this.props.data.length])
			.range([0, _totalY]);
	},

	_getYScale: function () {
		return d3.scale.linear()
			.domain([0, this.props.strainData.length])
			.range([0, this.props.strainData.length * NODE_SIZE]);
	},

	_getCanvasX: function () {
		return Math.max(0, this.state.canvasScrollX - CANVAS_SIZE / 2);
	},

	_renderCanvas: function () {
		// get canvas context and clear
		var ctx = this.refs.canvas.getDOMNode().getContext("2d");
		ctx.clearRect(0, 0, CANVAS_SIZE, this.state.DOMHeight);
		ctx.font = FONT_SIZE + "px Lato";

		// render rows of features with strain variation in each column
		var colorScale = d3.scale.linear()
			.domain([0, 1])
			.range(["blue", "white"]);

		// get data that fits into canvas
		var chunkOfData = this._getChunkedData();

		chunkOfData.forEach( (d, i) => {
			ctx.save();
			ctx.fillStyle = "black";
			ctx.translate(0, 0);
			ctx.rotate(-Math.PI/2);
			ctx.textAlign = "left";
			ctx.fillText(d.name, -LABEL_WIDTH / 2, (i + 1) * NODE_SIZE - 3);
			ctx.restore();

			d.variationData.forEach( (_d, _i) => {
				// get color and draw rect
				ctx.fillStyle = colorScale(_d);
				ctx.fillRect(i * NODE_SIZE, _i * NODE_SIZE + HEADER_HEIGHT, NODE_SIZE, NODE_SIZE);
			});
		});
	}
});
