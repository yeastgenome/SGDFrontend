"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var ColorScaleLegend = require("./color_scale_legend.jsx");

var DEFAULT_DOM_SIDE_SIZE = 400; // height and width
var FONT_SIZE = 14;
var HEADER_HEIGHT = 120;
var DEFAULT_NODE_SIZE = 16;
var MAX_CANVAS_SIZE = 8000;
var LABEL_WIDTH = 130;
var TOOLTIP_DELAY = 250;
var SCROLLBAR_HEIGHT = 15;
var LARGE_DATA_SIZE = 6500;

var ScrollyHeatmap = React.createClass({
	propTypes: {
		data: React.PropTypes.array.isRequired, // [{ name: "some123", id: "123", data: [0.1, 0.5, ...]}, ...]
		nodeSize: React.PropTypes.number,
		onClick: React.PropTypes.func,
		strainData: React.PropTypes.array.isRequired // [{ name: "foo", id: 1 }, ...]
	},

	getDefaultProps: function () {
		return { nodeSize: DEFAULT_NODE_SIZE };
	},

	getInitialState: function () {
		return {
			canvasScrollX: 0,
			DOMWidth: DEFAULT_DOM_SIDE_SIZE,
			DOMHeight: DEFAULT_DOM_SIDE_SIZE,
			mouseOverId: null,
			tooltipVisibile: false
		};
	},

	render: function () {
		var _scrollZoneSize = this._getScrollSize();
		var _canvasX = this._getCanvasX();
		var _canvasWidth = this._getXScale().range()[1] + SCROLLBAR_HEIGHT + LABEL_WIDTH;
		var _canvasSize = this._getCanvasSize();

		return (
			<div onMouseLeave={this._onMouseLeave} style={{ width: _canvasWidth }}>
				{this._getTooltipNode()}
				<div style={{ position: "relative", zIndex: 1 }}>
					<div className="variant-heatmap" style={{ height: "100%", position: "relative"}}>
						<div ref="outerScroll" style={{ width: this.state.DOMWidth, height: 800, overflowY: "scroll", position: "relative", left: 0 }}>
							<div style={{ position: "relative", height: _scrollZoneSize }}>	
								<canvas ref="canvas" width={_canvasWidth} height={_canvasSize} style={{ position: "absolute", left: _canvasX }}/>
							</div>
							{/* this._getOverlayNode() */}
						</div>
					</div>
				</div>
				<ColorScaleLegend />
			</div>
		);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this.refs.outerScroll.getDOMNode().onscroll = this._onScroll;
		this._drawCanvas();
	},

	componentDidUpdate: function (prevProps, prevState) {
	    if (prevProps.data !== this.props.data) {
	    	this._drawCanvas();
	    }
	},

	_onMouseLeave: function (e) {
		if (this._mouseLeaveTimeout) clearTimeout(this._mouseLeaveTimeout);
		this._mouseLeaveTimeout = setTimeout( () => {
			this.setState({ tooltipVisible: false });
		}, TOOLTIP_DELAY);
	},

	_onScroll: function (e) {
		this.setState({ tooltipVisible: false });
		this._checkScroll();
	},

	_getOverlayNode: function () {
		var chunkedData = this._getChunkedData();
		var xScale = this._getXScale();
		var nodeHeight = this.props.strainData.length * this.props.nodeSize + HEADER_HEIGHT;

		var rectNodes = _.map(chunkedData, (d, i) => {
			// UI events
			var _onClick;
			if (this.props.onClick) _onClick = e => {
				e.stopPropagation();
			    e.nativeEvent.stopImmediatePropagation();
			    this.setState({ tooltipVisible: false });
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
				mouseOverNode = <rect width={this.props.nodeSize} height={nodeHeight - HEADER_HEIGHT} x={0} y={HEADER_HEIGHT} stroke="yellow" fill="none" strokeWidth={2} />;
			}
			var _transform = `translate(${i * this.props.nodeSize}, 0)`;
			return (<g key={"heatmapOverlay" + i} transform={_transform}>
				{mouseOverNode}
				<rect onMouseOver={_onMouseOver} onClick={_onClick} width={this.props.nodeSize} height={nodeHeight} x={0} y={0} stroke="none" opacity={0} />
			</g>);
		});

		var _canvasX = this._getCanvasX();
		var _canvasSize = this._getCanvasSize();
		return (<svg ref="svg" style={{ position: "absolute", left: _canvasX, width: _canvasSize, height: nodeHeight, cursor: "pointer" }}>
			{rectNodes}
		</svg>);
	},

	_getScrollSize: function () {
		var length = this.props.data.length;
		var offset = (length > LARGE_DATA_SIZE) ? 2800 : 0;  // manually make canvas smaller when very large
		return length * this.props.nodeSize - offset;
	},

	_getCanvasSize: function () {
		var _scrollZoneSize = this._getScrollSize();
		return Math.min(_scrollZoneSize, MAX_CANVAS_SIZE);
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
			this.setState({ tooltipVisible: true });
		}, TOOLTIP_DELAY);

		this.setState({
			mouseOverId: d.id,
			tooltipVisible: false
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
		var _canvasSize = this._getCanvasSize();
		var _nodesPerCanvas = Math.round(_canvasSize / this.props.nodeSize)
		var _dataStartIndex = Math.round(this._getXScale().invert(_canvasX));
		return this.props.data.slice(_dataStartIndex, _dataStartIndex + _nodesPerCanvas);
	},

	// _getLabelsNode: function () {
	// 	var nodes = this.props.strainData.map( (d, i) => {
	// 		var _style = {
	// 			position: "absolute",
	// 			left: 0,
	// 			top: HEADER_HEIGHT + i * this.props.nodeSize - 3,
	// 			fontSize: FONT_SIZE
	// 		};
	// 		return <span key={"strainLabel" + i} style={_style}>{d.name}</span>;
	// 	});

	// 	return (<div style={{ position: "relative" }}>
	// 		{nodes}
	// 	</div>);
	// },

	_getXScale: function () {
		return d3.scale.linear()
			.domain([0, this.props.strainData.length])
			.range([0, this.props.strainData.length * this.props.nodeSize]);
	},

	_getYScale: function () {
		var _totalY = this.props.data.length * this.props.nodeSize;
		return d3.scale.linear()
			.domain([0, this.props.data.length])
			.range([0, _totalY]);
	},

	_getCanvasX: function () {
		var _canvasSize = this._getCanvasSize();
		return Math.max(0, this.state.canvasScrollX - _canvasSize / 2);
	},

	_getTooltipNode: function () {
		return null;
	},

	_drawCanvas: function () {
		// get canvas context and clear
		var _canvasSize = this._getCanvasSize();
		var ctx = this.refs.canvas.getDOMNode().getContext("2d");
		ctx.clearRect(0, 0, _canvasSize, this.state.DOMHeight);
		ctx.font = FONT_SIZE + "px Lato";

		// render rows of features with strain variation in each column
		var colorScale = d3.scale.linear()
			.domain([0, 1])
			.range(["black", "#C2E3F6"]);

		// get data that fits into canvas
		var chunkOfData = this._getChunkedData();

		chunkOfData.forEach( (d, i) => {
			ctx.fillStyle = "black";
			ctx.textAlign = "left";
			ctx.fillText(d.name, 0, (i + 1) * this.props.nodeSize - 3);

			d.data.forEach( (_d, _i) => {
				// get color and draw rect
				var _color = (_d === null) ? "white" : colorScale(_d);
				ctx.fillStyle = _color;
				ctx.fillRect(_i * this.props.nodeSize + LABEL_WIDTH, i * this.props.nodeSize, this.props.nodeSize, this.props.nodeSize);
			});
		});
	}
});

module.exports = ScrollyHeatmap;
