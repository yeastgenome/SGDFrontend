"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");
var Radium = require("radium");

var FlexibleTooltip = require("../widgets/flexible_tooltip.jsx");

var DEFAULT_DOM_SIDE_SIZE = 315; // height and width
var SCROLL_CONTAINER_HEIGHT = 800;
var FONT_SIZE = 14;
var HEADER_HEIGHT = 120;
var DEFAULT_NODE_SIZE = 16;
var MAX_CANVAS_SIZE = 8000;
var LABEL_WIDTH = 100;
var TOOLTIP_DELAY = 250;
var SCROLLBAR_HEIGHT = 15;
var LARGE_DATA_SIZE = 6500;
var DEFAULT_BORDER_COLOR = "#EBDD71";

var ScrollyHeatmap = React.createClass({
	propTypes: {
		data: React.PropTypes.array.isRequired, // [{ name: "some123", id: "123", data: [0.1, 0.5, ...]}, ...]
		nodeSize: React.PropTypes.number,
		originalNodeSize: React.PropTypes.number,
		onClick: React.PropTypes.func,
		strainData: React.PropTypes.array.isRequired, // [{ name: "foo", id: 1 }, ...]
		mouseOverBorderColor: React.PropTypes.string
	},

	getDefaultProps: function () {
		return {
			nodeSize: DEFAULT_NODE_SIZE,
			originalNodeSize: 16,//DEFAULT_NODE_SIZE,
			mouseOverBorderColor: DEFAULT_BORDER_COLOR
		};
	},

	getInitialState: function () {
		return {
			scrollPosition: 0,
			DOMWidth: DEFAULT_DOM_SIDE_SIZE,
			DOMHeight: DEFAULT_DOM_SIDE_SIZE,
			mouseOverId: null,
			canvasRatio: 1,
			tooltipVisibile: false,
		};
	},

	render: function () {
		var canvasRatio = this.state.canvasRatio;
		var _scrollZoneSize = this._getScrollSize();
		var _canvasX = this._getCanvasX();
		var _canvasWidth = (this._getXScale().range()[1] + SCROLLBAR_HEIGHT + LABEL_WIDTH) * canvasRatio;
		var _canvasSize = this._getCanvasSize() * canvasRatio;

		return (
			<div onMouseLeave={this._onMouseLeave}>
				<div style={{ position: "relative", zIndex: 1 }}>
					<div className="variant-heatmap" style={{ height: "100%", position: "relative"}}>
						<div ref="outerScroll" style={{ width: this.state.DOMWidth, height: SCROLL_CONTAINER_HEIGHT, overflowY: "scroll", position: "relative", left: 0 }}>
							{this._getTooltipNode()}
							<canvas ref="canvas" width={_canvasWidth} height={_canvasSize} style={{ position: "absolute", top: this.state.scrollPosition, left: _canvasX, width: _canvasWidth / canvasRatio }}/>
							<div style={{ position: "relative", height: _scrollZoneSize }}>									
							</div>
							{this._renderOverlayNode()}
						</div>
					</div>
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateDOMSize();
		this.refs.outerScroll.getDOMNode().onscroll = _.throttle(this._onScroll, 10);
		this._updateCanvasRatio( () => {
			this._drawCanvas();
		});
	},

	componentDidUpdate: function (prevProps, prevState) {
		if (prevProps.data !== this.props.data) {
	    	this._drawCanvas();
	    }
	    // maybe reset scroll
	    if (prevProps.data.length !== this.props.data.length || this.props.data.length === 0) {
	    	this._resetScroll();
	    } else if (prevProps.data[0].name !== this.props.data[0].name) {
			this._resetScroll();
	    }
	},

	// calculate drawing ratio to solve blurry high DPI canvas issue
	// cb passed to cb for this.setState
	_updateCanvasRatio: function (cb) {
		// query device pixel ratio
		var ctx = this.refs.canvas.getDOMNode().getContext("2d");
		var devicePixelRatio = window.devicePixelRatio || 1;
		var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio || 1;

        var _canvasRatio = devicePixelRatio / backingStoreRatio;
        this.setState({ canvasRatio: _canvasRatio }, cb)
	},

	_resetScroll: function () {
		this.refs.outerScroll.getDOMNode().scrollTop = 0;
	},

	_onMouseLeave: function (e) {
		if (this._mouseLeaveTimeout) clearTimeout(this._mouseLeaveTimeout);
		this._mouseLeaveTimeout = setTimeout( () => {
			this.setState({ tooltipVisible: false });
		}, TOOLTIP_DELAY);
	},

	_onScroll: function (e) {
		var scrollEl = this.refs.outerScroll.getDOMNode();
		this.setState({
			scrollPosition: scrollEl.scrollTop,
			tooltipVisible: false
		});
		this._drawCanvas();
	},

	_renderOverlayNode: function () {
		var chunkedData = this._getChunkedData();
		if (chunkedData.length === 0) return null;
		var xScale = this._getXScale();
		var nodeSize = this.props.nodeSize;
		var originalNodeSize = this.props.originalNodeSize;
		var widthNodes = chunkedData[0].data.length;
		var totalWidth = widthNodes * originalNodeSize + LABEL_WIDTH;
		var rectNodes = _.map(chunkedData, (d, i) => {
			// UI events
			var _onClick;
			if (this.props.onClick) _onClick = e => {
				e.stopPropagation();
			    e.nativeEvent.stopImmediatePropagation();
			    // this.setState({ tooltipVisible: false });
				this.props.onClick(d);
			};
			var _onMouseOver = e => {
				this._onMouseOver(e, d);
			};
			var _transform = `translate(0, ${nodeSize * i})`;
			// maybe init highlighting node
			var highlightNode = null;
			if (d.id === this.state.mouseOverId) {
				highlightNode = (<rect
					width={totalWidth - LABEL_WIDTH - 1} height={nodeSize} x={LABEL_WIDTH}
					fill="none" opacity="1"
					stroke={DEFAULT_BORDER_COLOR} strokeWidth={2}
					shapeRendering="crispEdges" onClick={_onClick}
				/>);
			}
			return (
				<g key={"scrollyNode" + i} transform={_transform}>
					<rect onClick={_onClick} onMouseOver={_onMouseOver}
						width={totalWidth} height={nodeSize}
						fill="white" opacity="0"
						stroke="none"
					/>
					{highlightNode}
				</g>
			);
		});

		return (<svg ref="svg" style={{ position: "absolute", top: this.state.scrollPosition, left: 0, width: totalWidth, height: chunkedData.length * nodeSize, cursor: "pointer" }}>
			{rectNodes}
		</svg>);
	},

	_getScrollSize: function () {
		var length = this.props.data.length;
		var offset = (length > LARGE_DATA_SIZE) ? 2800 : 0;  // manually make canvas smaller when very large
		return length * this.props.nodeSize - offset;
	},

	_getCanvasSize: function () {
		return this.state.DOMHeight * this.state.canvasRatio;
	},

	// check to see if the scroll y needs to be redrawn
	_checkScroll: function () {
		var _scrollSize = this._getScrollSize();
		var _canvasSize = this._getCanvasSize();
		var scrollLeft = Math.min(_scrollSize, this.refs.outerScroll.getDOMNode().scrollLeft);
		var scrollDelta = Math.abs(scrollLeft - this.state.canvasScrollX)
		if (scrollDelta > _canvasSize / 4) {
			this.setState({ canvasScrollX: scrollLeft });
			this._drawCanvas();
		}
	},

	_onMouseOver: function (e, d) {
		if (this._mouseOverTimeout) clearTimeout(this._mouseOverTimeout);
		this._mouseOverTimeout = setTimeout( () => {
			this.setState({
				mouseOverId: d.id,
				tooltipVisible: true
			});
		}, TOOLTIP_DELAY);

		this.setState({
			mouseOverId: d.id,
			tooltipVisible: false
		});
	},

	_calculateDOMSize: function () {
		var _clientRect = this.getDOMNode().getBoundingClientRect();
		this.setState({
			DOMWidth: _clientRect.width,
			DOMHeight: _clientRect.height
		});
	},

	_getChunkedData: function () {
		var _canvasX = this._getCanvasX();
		var _canvasSize = this._getCanvasSize();
		var _nodesPerCanvas = Math.round(_canvasSize / this.props.nodeSize)
		var _dataStartIndex = Math.round(this._getYScale().invert(this.state.scrollPosition));
		return this.props.data.slice(_dataStartIndex, _dataStartIndex + _nodesPerCanvas);
	},

	_getXScale: function () {
		return d3.scale.linear()
			.domain([0, this.props.strainData.length])
			.range([0, this.props.strainData.length * this.props.originalNodeSize]);
	},

	_getYScale: function () {
		var _totalY = this.props.data.length * this.props.nodeSize;
		return d3.scale.linear()
			.domain([0, this.props.data.length])
			.range([0, _totalY]);
	},

	_getCanvasX: function () {
		return 0; // TEMP
		var _canvasSize = this._getCanvasSize();
		return Math.max(0, this.state.canvasScrollX - _canvasSize / 2);
	},

	_getTooltipNode: function () {
		if (!this.state.tooltipVisible) return null;
		var locusData = _.findWhere(this.props.data, { id: this.state.mouseOverId });
		var scale = this._getYScale();
		var _left = LABEL_WIDTH;
		var _top = scale(this.props.data.indexOf(locusData));
		return (
			<div >
				<FlexibleTooltip
					visible={this.state.tooltipVisible} text={locusData.name}
					left={_left} top={_top}
					href={locusData.href}
				/>
			</div>
		);
	},

	_drawCanvas: function () {
		var canvasRatio = this.state.canvasRatio;
		// get canvas context and clear
		var ctx = this.refs.canvas.getDOMNode().getContext("2d");
		ctx.clearRect(0, 0, this.state.DOMWidth * canvasRatio, this.state.DOMHeight * canvasRatio);
		ctx.font = FONT_SIZE * canvasRatio + "px Lato";

		// render rows of features with strain variation in each column
		var colorScale = d3.scale.linear()
			.domain([0, 1])
			.range(["black", "#C2E3F6"]);

		// get data that fits into canvas
		var chunkOfData = this._getChunkedData();

		ctx.textAlign = "right";
		var textX, textY;
		chunkOfData.forEach( (d, i) => {
			// label
			ctx.fillStyle = "black";
			textX = (LABEL_WIDTH - 5) * canvasRatio;
			textY = ((i + 1) * this.props.nodeSize - 3) * canvasRatio;
			ctx.fillText(d.name, textX, textY);
			// draw nodes
			var x, y, color;
			var nodeSize = this.props.nodeSize * canvasRatio;
			var originalNodeSize = this.props.originalNodeSize * canvasRatio;
			d.data.forEach( (_d, _i) => {
				// get color and draw rect
				x = (_i * originalNodeSize) + (LABEL_WIDTH * canvasRatio);
				y = i * nodeSize;
				color = (_d === null) ? "white" : colorScale(_d);
				ctx.fillStyle = color;
				ctx.fillRect(x, y, originalNodeSize, nodeSize);
			});
		});
	}
});

// wrap export with Radium
module.exports = Radium(ScrollyHeatmap);
