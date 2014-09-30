/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var SequenceDetailsModel = require("../../models/sequence_details_model.jsx");
var SequenceNeighborsModel = require("../../models/sequence_neighbors_model.jsx");
var StandaloneAxis = require("./standalone_axis.jsx");

var AXIS_LABELING_HEIGHT = 22;
var HEIGHT = 17;
var POINT_WIDTH = 10;
var TRACK_SPACING = 10;

var VIZ_HEIGHT_FN = function (tracksPerStrand) {
	return (tracksPerStrand * 2) * (HEIGHT + TRACK_SPACING) + 2 * TRACK_SPACING;
};

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			baseUrl: null,
			data: null, // { locci: [] }
			domainBounds: null, // [0, 100]
			hasControls: true,
			focusLocusDisplayName: null,
			showSubFeatures: false,
			tracksPerStrand: 3 // TEMP
		};
	},

	getInitialState: function () {
		return {
			domain: this.props.domainBounds,
			DOMWidth: 600,
			mouseoverOpacityString: null
		};
	},

	render: function () {
		var height = VIZ_HEIGHT_FN(this.props.tracksPerStrand);

		var controlsNode = this._getControlsNode();
		var axisNode = (<StandaloneAxis 
			domain={this._getScale().domain()} orientation="bottom"
			gridTicks={true} ticks={null}
			height={height + AXIS_LABELING_HEIGHT}
		/>);

		var locciNodes = _.map(this.props.data.locci, (d) => { return this._getLocusNode(d); });
		return (
			<div className="locus-diagram">
				{controlsNode}
				<div className="locus-diagram-viz-container" style={{ position: "relative" }}>
					<div className="locus-diagram-axis-container" style={{ position: "absolute", top: 0, width: "100%" }}>
						{axisNode}
					</div>
					<svg ref="svg" className="locus-svg" style={{ width: "100%", height: height, position: "relative" }}>
						<line className="midpoint-marker" x1="0" x2={this.state.DOMWidth} y1={height /2} y2={height /2} />
						{locciNodes}
					</svg>
				</div>
			</div>
		);
	},

	// Get width from DOM to redo scale.
	// If can render, setup d3 zoom/panning.
	// If can't render, get data.
	componentDidMount: function () {
		this._calculateWidth();
		this._setupZoomEvents();
	},


	// returns an svg "g" element, with embedded shapes
	_getLocusNode: function (d) {
		var isFocusLocus = d.locus.display_name === this.props.focusLocusDisplayName;

		if (this.props.showSubFeatures &&  d.tags.length) {
			// var tagNodes = this._getSubFeatureNodes(d.tags, isWatsonStrand, d.start, _isFocusLocus);
			return this._getLocusWithSubFeaturesNode(d, isFocusLocus);
		} else {
			return this._getSimpleLocusNode(d, isFocusLocus);
		}
	},

	_getLocusWithSubFeaturesNode: function (d, isFocusLocus) {
		var subFeatureNodes = this._getSubFeatureNodes(d.start, d.end, d.tags, (d.track > 0), isFocusLocus);

		var _transformX = this._getTransformObject(d).x;
		var _transform = `translate(${_transformX}, 0)`;
		return (
			<g transform={_transform}>
				{subFeatureNodes}
			</g>
		);
	},

	_getSubFeatureNodes: function (chromStart, chromEnd, tags, isWatson, isFocusLocus) {
		var scale = this._getScale();

		// calc the last feature, to know where to draw arrow
		var lastSubFeature = _.max(tags, (d) => { return d.relative_start; });

		var colorScale = d3.scale.category10();
		return _.map(tags, (d, i) => {

			var handleMouseover = (e) => { this._handleMouseOver(e, d); };

			// TEMP
			var fill = colorScale(d.class_type);

			var start = d.relative_start;
			var end = d.relative_end;

			// special treatment for crick strand features
			if (!isWatson) {
				var width = chromEnd - chromStart;
				var _start = width - end;
				var _end = width - start;
				start = _start;
				end = _end;
			}

			// scale relative starts to x scale
			var startX = scale(chromStart + start - 0.5) - scale(chromStart);
			var endX = scale(chromStart + end + 0.5) - scale(chromStart);

			// decide if intron and last subfeature
			var isIntron = d.class_type === "INTRON";
			var isLast = d === lastSubFeature;

			// TODO
			// text node
			// var textNode = <text>d.displayName</text>;

			// properties for all possible nodes
			var _transformY = this._getTransformObject(d).y;
			var _transform = `translate(0, ${_transformY})`;
			var _opacity = d.display_name === this.state.mouseoverOpacityString ? 1 : 0.6;
			
			// last non intron, add arrow
			if (isLast && !isIntron) {
				var pathString = this._getTrapezoidStringPath(startX, endX, isWatson);
				return (<g transform={_transform}>
					<path d={pathString}  onMouseOver={handleMouseover} opacity={_opacity} fill={fill} />
				</g>);
			// intron, line
			} else if (isIntron) {
				var pathString = `M${startX} ${HEIGHT/2} C ${startX + (endX - startX) * 0.25} ${HEIGHT / 5}, ${startX + (endX - startX) * 0.75} ${HEIGHT / 5}, ${endX} ${HEIGHT / 2}`
				return (<g transform={_transform}>
					<path d={pathString} onMouseOver={handleMouseover} opacity={_opacity} stroke="black" fill="none" />
				</g>);
			// everything else, rectangle
			} else {
				return (<g transform={_transform}>
					<rect onMouseOver={handleMouseover} opacity={_opacity} x={startX} width={endX - startX} height={HEIGHT} fill={fill} />
				</g>);
			}
		});
	},

	_getSimpleLocusNode: function (d, isFocusLocus) {
		var scale = this._getScale();
		var startX = scale(Math.min(d.start, d.end));
		var endX = scale(Math.max(d.start, d.end));

		var relativeStartX = 0;
		var relativeEndX = endX - startX;

		var pathString = this._getTrapezoidStringPath(relativeStartX, relativeEndX, (d.track > 0));

		var _fill = isFocusLocus ? "rgb(31, 119, 180)" : "#999";
		var _transform = this._getGroupTransform(d);

		// text node
		var _approxWidth = d.locus.display_name.length * 8;
		var _onClick = (e) => { this._onLocusSelect(e, d); };
		var _textX = relativeEndX / 2;
		var _textY = HEIGHT - 4;
		var _textTransform = `translate(${_textX}, ${_textY})`;
		var _opacity = d.locus.display_name === this.state.mouseoverOpacityString ? 1 : 0.6;
		var textNode = <text className="locus-diagram-anchor" onClick={_onClick} transform={_textTransform} textAnchor="middle">{d.locus.display_name}</text>;
		// hide text if too small
		if (_approxWidth > relativeEndX) textNode = null;

		var _onMouseover = (e) => {
			this._handleMouseOver(e, d);
		};

		return (
			<g transform={_transform}>
				<path d={pathString} fill={_fill} opacity={_opacity} onMouseOver={_onMouseover} />
				{textNode}
			</g>
		);
	},

	// returns the transform string used to position the g element for a locus
	_getGroupTransform: function (d) {
		var obj = this._getTransformObject(d);
		return `translate(${obj.x}, ${obj.y})`;
	},

	// returns  transform x y coordinates
	_getTransformObject: function (d) {
		var scale = this._getScale();
		var _x = scale(Math.min(d.start, d.end));
		var _y = (VIZ_HEIGHT_FN(this.props.tracksPerStrand) / 2) - d.track * (HEIGHT + TRACK_SPACING);
		if (d.track < 0) _y -= HEIGHT;

		return {
			x: _x,
			y: _y
		};
	},

	// from relative start, relative end, and bool isWatson, return the string to draw a trapezoid
	_getTrapezoidStringPath: function (relativeStartX, relativeEndX, isWatson) {
		var pointWidth = Math.min(POINT_WIDTH, (relativeEndX - relativeStartX));

		var points;
		if (isWatson) {
			points = [
				{ x: relativeStartX, y: 0 },
				{ x: relativeEndX - pointWidth, y: 0 },
				{ x: relativeEndX, y: HEIGHT / 2 },
				{ x: relativeEndX - pointWidth, y: HEIGHT },
				{ x: relativeStartX, y: HEIGHT },
				{ x: relativeStartX, y: 0 }
			];
		} else {
			points = [
				{ x: relativeStartX + pointWidth, y: 0 },
				{ x: relativeEndX, y: 0 },
				{ x: relativeEndX, y: HEIGHT },
				{ x: relativeStartX + pointWidth, y: HEIGHT },
				{ x: relativeStartX, y: HEIGHT / 2 }
			];
		}

		var areaFn = d3.svg.line()
			.x( (d) => { return d.x; })
			.y( (d) => { return d.y; })
		return areaFn(points) + "Z";
	},

	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width;
		this.setState({ DOMWidth: _width });
	},

	// Set the new domain; it may want some control in the future.
	_setDomain: function (newDomain) {
		// don't let the new domain go outside domain bounds
		var _lb = Math.max(newDomain[0], this.props.domainBounds[0]);
		var _rb = Math.min(newDomain[1], this.props.domainBounds[1]);

		// show at least 10 bp
		if (_rb - _lb < 10) return;

		this.setState({
			domain: [_lb, _rb]
		});
	},

	_handleMouseOver: function (e, d) {
		var opacityString = d.locus ? d.locus.display_name : d.display_name;
		this.setState({
			mouseoverOpacityString: opacityString
		});
	},

	_onLocusSelect: function (e, d) {
		e.preventDefault();
		document.location.href = d.locus.link;
	},

	_getScale: function () {
		var _width = this.state.DOMWidth;
		if (!_width) return false;

		return d3.scale.linear().domain(this.state.domain).range([0, _width]);
	},

	// Subtracts 10% to both sides of the chart.
	_zoomIn: function (e) {
		e.preventDefault();
		var domain = this.state.domain;
		var domainRange = domain[1] - domain[0];
		var domainDelta = domainRange * 0.10;
		this._setDomain([domain[0] + domainDelta, domain[1] - domainDelta]);
		this._setupZoomEvents();
	},

	// Adds 10% to both sides of the chart.
	_zoomOut: function (e) {
		e.preventDefault();
		var domain = this.state.domain;
		var domainRange = domain[1] - domain[0];
		var domainDelta = domainRange * 0.10;
		this._setDomain([domain[0] - domainDelta, domain[1] + domainDelta]);
		this._setupZoomEvents();
	},

	// left 10%
	_stepLeft: function (e) {
		e.preventDefault();
		var domain = this.state.domain;
		var domainRange = domain[1] - domain[0];
		var domainDelta = domainRange * 0.10;
		this._setDomain([domain[0] - domainDelta, domain[1] - domainDelta]);
		this._setupZoomEvents();
	},

	// right 10%
	_stepRight: function (e) {
		e.preventDefault();
		var domain = this.state.domain;
		var domainRange = domain[1] - domain[0];
		var domainDelta = domainRange * 0.10;
		this._setDomain([domain[0] + domainDelta, domain[1] + domainDelta]);
		this._setupZoomEvents();
	},

	// setup d3 zoom and pan behavior
	_setupZoomEvents: function () {
		var scale = this._getScale()
		var zoom = d3.behavior.zoom()
			.x(scale)
			.on("zoom", () => {
				this._setDomain(scale.domain());
			});
		var svg = d3.select(this.refs["svg"].getDOMNode());
		svg.call(zoom);
	},

	// Get the controls if needed, and disable the right buttons.
	_getControlsNode: function () {
		var controlsNode = null;

		if (this.props.hasControls) {
			var stateDomain = this.state.domain;
			var propsDomain = this.props.domainBounds;

			var leftDisabled = stateDomain[0] <= propsDomain[0];
			var leftDisabledClass = leftDisabled ? "disabled secondary" : "secondary";
			var rightDisabled = stateDomain[1] >= propsDomain[1];
			var rightDisabledClass =  rightDisabled ? "disabled secondary" : "secondary";
			var stepLeft = leftDisabled ? null : this._stepLeft;
			var stepRight = rightDisabled ? null : this._stepRight;

			var outDisabled = leftDisabled && rightDisabled;
			var outDisabledClass = outDisabled ? "disabled secondary" : "secondary";
			var inDisabled = false;
			var inDisabledClass = inDisabled ? "disabled secondary" : "secondary";
			var zoomIn = inDisabled ? null : this._zoomIn;
			var zoomOut = outDisabled ? null : this._zoomOut;

			controlsNode = (<div className="locus-diagram-control-container clearfix">
				<ul className="locus-diagram-button-group round button-group">
					<li><a className={`tiny button ${leftDisabledClass}`} onClick={stepLeft}><i className="fa fa-backward"></i></a></li>
					<li><a className={`tiny button ${rightDisabledClass}`} onClick={stepRight}><i className="fa fa-forward"></i></a></li>
				</ul>
				<ul className="locus-diagram-button-group round button-group">
					<li><a className={`tiny button ${inDisabledClass}`} onClick={zoomIn}><i className="fa fa-plus"></i></a></li>
					<li><a className={`tiny button ${outDisabledClass}`} onClick={zoomOut}><i className="fa fa-minus"></i></a></li>
				</ul>
			</div>);
		}

		return controlsNode;
	}
});

