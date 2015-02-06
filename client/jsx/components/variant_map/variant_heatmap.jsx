"use strict";
var d3 = require("d3");
var React = require("react");
var _ = require("underscore");

var ColorScaleLegend = require("./color_scale_legend.jsx");
var FlexibleTooltip = require("../widgets/flexible_tooltip.jsx");

var DEFAULT_DOM_SIDE_SIZE = 400; // height and width\
var FONT_SIZE = 14;
var HEADER_HEIGHT = 120;
var NODE_SIZE = 16;
var MAX_CANVAS_SIZE = 8000;
var LABEL_WIDTH = 120;
var TOOLTIP_DELAY = 250;

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
			tooltipVisibile: false
		};
	},

	render: function () {
		var _scrollZoneSize = this._getScrollSize();
		var _canvasX = this._getCanvasX();
		var _canvasSize = this._getCanvasSize();
		var _canvasHeight = this._getYScale().range()[1] + HEADER_HEIGHT;

		var strainLabelsNode = this._getLabelsNode();
		var overlayNode = this._getOverlayNode();
		var tooltipNode = this._getTooltipNode();
		var indicatorNode = this._getPositionIndicator();

		return (<div>
			<div className="panel" style={{ position: "relative", zIndex: 1 }}>
				<div className="variant-heatmap" style={{ height: "100%", position: "relative"}}>
					{strainLabelsNode}
					<div ref="outerScroll" style={{ width: this.state.DOMWidth - LABEL_WIDTH - 18, height: _canvasHeight, overflowX: "scroll", position: "relative", left: LABEL_WIDTH }}>
						<div style={{ position: "relative", width: _scrollZoneSize }}>
							{tooltipNode}
							<canvas ref="canvas" width={_canvasSize} height={_canvasHeight} style={{ position: "absolute", left: _canvasX }}/>
						</div>
						{overlayNode}
					</div>
				</div>
			</div>
			<div className="row">
				<div className="columns small-6">
					<ColorScaleLegend />
				</div>
				<div className="columns small-6">
					{indicatorNode}					
				</div>
			</div>
		</div>);
	},

	componentDidMount: function () {
		this._calculateWidth();
		this.refs.outerScroll.getDOMNode().onscroll = _.throttle(this._checkScroll, 100);
		this._renderCanvas();
	},

	componentDidUpdate: function (prevProps, prevState) {
	    if (prevProps.data !== this.props.data) {
	    	this._renderCanvas();
	    }
	},

	_getPositionIndicator: function () {
		var xScale = this._getXScale();
		var leftRatio = this.state.canvasScrollX / xScale.range()[1];
		var widthRatio = Math.min(1, (this.state.DOMWidth / xScale.range()[1]));

		var barStyle = {
			position: "absolute",
			left: `${leftRatio * 100}%`,
			width: `${widthRatio * 100}%`,
			height: "100%",
			background: "#e1e1e1"
		};
		return (<div className="variant-map-progress-bar" style={{ position: "relative", width: "100%", height: 30, border: "1px solid #e1e1e1" }}>
			<div className="variant-map-progress-bar-inner" style={barStyle} />
		</div>);
	},

	_getOverlayNode: function () {
		var chunkedData = this._getChunkedData();
		var xScale = this._getXScale();
		var nodeHeight = this.props.strainData.length * NODE_SIZE + HEADER_HEIGHT;

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
				mouseOverNode = <rect width={NODE_SIZE} height={nodeHeight - HEADER_HEIGHT} x={0} y={HEADER_HEIGHT} stroke="yellow" fill="none" strokeWidth={2} />;
			}
			var _transform = `translate(${i * NODE_SIZE}, 0)`;
			return (<g key={"heatmapOverlay" + i} transform={_transform}>
				{mouseOverNode}
				<rect onMouseOver={_onMouseOver} onClick={_onClick} width={NODE_SIZE} height={nodeHeight} x={0} y={0} stroke="none" opacity={0} />
			</g>);
		});

		var _canvasX = this._getCanvasX();
		var _canvasSize = this._getCanvasSize();
		return (<svg ref="svg" style={{ position: "absolute", left: _canvasX, width: _canvasSize, height: nodeHeight, cursor: "pointer" }}>
			{rectNodes}
		</svg>);
	},

	_getScrollSize: function () {
		return this.props.data.length * NODE_SIZE;
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
			this._renderCanvas();
		}
	},

	_onMouseOver: function (e, d) {
		if (this._mouseoverTimeout) clearTimeout(this._mouseoverTimeout);
		this._mouseoverTimeout = setTimeout( () => {
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
		var _nodesPerCanvas = Math.round(_canvasSize / NODE_SIZE)
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
		var _canvasSize = this._getCanvasSize();
		return Math.max(0, this.state.canvasScrollX - _canvasSize / 2);
	},

	_getTooltipNode: function () {
		if (!(this.state.mouseOverId && this.state.tooltipVisible)) return null;

		var xScale = this._getXScale();
		var yScale = this._getYScale();
		var locus = _.findWhere(this.props.data, { id: this.state.mouseOverId });
		if (!locus) return null;

		var title = { name: locus.name, href: locus.href };
		var top = HEADER_HEIGHT; // TEMP
		var left = xScale(this.props.data.indexOf(locus));

		return (<FlexibleTooltip
			top={top} left={left}
			visible={true} orientation="bottom"
			text={locus.name}
			href={locus.href}
		/>);
	},

	_renderCanvas: function () {
		// get canvas context and clear
		var _canvasSize = this._getCanvasSize();
		var ctx = this.refs.canvas.getDOMNode().getContext("2d");
		ctx.clearRect(0, 0, _canvasSize, this.state.DOMHeight);
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
			ctx.fillText(d.name, - HEADER_HEIGHT + 3, (i + 1) * NODE_SIZE - 3);
			ctx.restore();

			d.variationData.forEach( (_d, _i) => {
				// get color and draw rect
				var _color = (_d === null) ? "#79050D" : colorScale(_d);
				ctx.fillStyle = _color;
				ctx.fillRect(i * NODE_SIZE, _i * NODE_SIZE + HEADER_HEIGHT, NODE_SIZE, NODE_SIZE);
			});
		});
	}
});
