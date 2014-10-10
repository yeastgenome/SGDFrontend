/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
var ChromosomeThumb = require("./chromosome_thumb.jsx");
var FlexibleTooltip = require("../flexible_tooltip.jsx");
var SequenceDetailsModel = require("../../models/sequence_details_model.jsx");
var SequenceNeighborsModel = require("../../models/sequence_neighbors_model.jsx");
var StandaloneAxis = require("./standalone_axis.jsx");

var AXIS_LABELING_HEIGHT = 24;
var HEIGHT = 17;
var POINT_WIDTH = 10;
var TRACK_SPACING = 10;
var MIN_BP_WIDTH = 200; // show at least 200 BP

var VIZ_HEIGHT_FN = function (watsonTracks, crickTracks) {
	return ((watsonTracks) * (HEIGHT + TRACK_SPACING) +  TRACK_SPACING + 
		(crickTracks) * (HEIGHT + TRACK_SPACING) + TRACK_SPACING
	);
};

module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	getDefaultProps: function () {
		return {
			baseUrl: null,
			contigData: null, // {}
			data: null, // { locci: [] }
			domainBounds: null, // [0, 100]
			hasControls: true,
			hasChromosomeThumb: true,
			focusLocusDisplayName: null,
			showSubFeatures: false,
			crickTracks: 1,
			watsonTracks: 1
		};
	},

	getInitialState: function () {
		return {
			domain: this.props.domainBounds,
			DOMWidth: 355,
			mouseoverId: null,
			tooltipVisible: false,
			tooltipLeft: 0,
			tooltipTop: 0,
			tooltipTitle: null,
			tooltipData: null,
			tooltipHref: null
		};
	},

	render: function () {
		var height = VIZ_HEIGHT_FN(this.props.watsonTracks, this.props.crickTracks);

		var controlsNode = this._getControlsNode();

		var _ticks = (this.state.DOMWidth > 400) ? null : 3;
		var axisNode = (<StandaloneAxis 
			domain={this._getScale().domain()} orientation="bottom"
			gridTicks={true} ticks={_ticks}
			height={height + AXIS_LABELING_HEIGHT}
		/>);

		var locciNodes = _.map(this.props.data.locci, d => { return this._getLocusNode(d); });
		return (
			<div className="locus-diagram" onMouseLeave={this._clearMouseOver} onClick={this._clearMouseOver}>
				{controlsNode}
				<div className="locus-diagram-viz-container" style={{ position: "relative" }}>
					<FlexibleTooltip
						visible={this.state.tooltipVisible} left={this.state.tooltipLeft} top={this.state.tooltipTop}
						title={this.state.tooltipTitle} data={this.state.tooltipData}
						href={this.state.tooltipHref}
					/>
					<div className="locus-diagram-axis-container" style={{ position: "absolute", top: 0, width: "100%" }}>
						{axisNode}
					</div>
					<svg ref="svg" className="locus-svg" style={{ width: "100%", height: height, position: "relative" }}>
						<line className="midpoint-marker" x1="0" x2={this.state.DOMWidth} y1={this._getMidpointY()} y2={this._getMidpointY()} />
						{locciNodes}
					</svg>
				</div>
			</div>
		);
	},

	// Update width to that of real DOM.
	componentDidMount: function () {
		this._calculateWidth();
	},

	componentDidUpdate: function (prevProps, prevState) {
		// If the width is updated, setup zoom events again.
		if (this.state.DOMWidth !== prevState.DOMWidth) this._setupZoomEvents();

		// If a new default domain (prob strain change, reset domain), and setup zoom events after 0.1 sec.
		if (this.props.domainBounds !== prevProps.domainBounds) {
			this.setState({ domain: this.props.domainBounds }); // don't use _setDomain to force it
			setTimeout( () => {
				if (this.isMounted()) this._setupZoomEvents();
			}, 100);
		}
	},

	// returns an svg "g" element, with embedded shapes
	_getLocusNode: function (d) {
		var isFocusLocus = d.locus.display_name === this.props.focusLocusDisplayName;

		if (this.props.showSubFeatures &&  d.tags.length) {
			return this._getLocusWithSubFeaturesNode(d, isFocusLocus);
		} else {
			return this._getSimpleLocusNode(d, isFocusLocus);
		}
	},

	_getLocusWithSubFeaturesNode: function (d, isFocusLocus) {
		var _transformX = this._getTransformObject(d).x;
		var _transform = `translate(${_transformX}, 0)`;
		var subFeatureNodes = this._getSubFeatureNodes(d.start, d.end, d.tags, (d.strand === "+"), isFocusLocus, _transformX);
		return (
			<g transform={_transform}>
				{subFeatureNodes}
			</g>
		);
	},

	_getSubFeatureNodes: function (chromStart, chromEnd, tags, isWatson, isFocusLocus, groupTransformX) {
		var scale = this._getScale();

		// calc the last feature, to know where to draw arrow
		var lastSubFeature = _.max(tags, d => { return d.relative_start; });

		// tweak d3 color scale to use SGD purple for CDS
		var colorScale = d3.scale.category10();
		var _cRangd = colorScale.range();
		_cRangd[0] = "#696599";
		colorScale = colorScale.range(_cRangd);

		return _.map(tags, (d, i) => {
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

			// text node
			var _textX = startX  + (endX - startX) / 2;
			var _textY = isIntron ? 0 : HEIGHT - 4;
			var _textTransform = `translate(${_textX}, ${_textY})`;
			var _textFill = d.class_type === "CDS" ? "white" : "black";
			var textNode = <text transform={_textTransform} textAnchor="middle" fill={_textFill}>{d.display_name.replace(/_/g, " ")}</text>;
			// hide text if too small
			var _approxWidth = d.display_name.length * 8;
			if (_approxWidth > (endX - startX)) textNode = null;

			// properties for all possible nodes
			var _transformY = this._getTransformObject(d).y;
			var groupTransform = `translate(0, ${_transformY})`;
			var opacity = d.id === this.state.mouseoverId ? 1 : 0.8;

			// mouseover callback
			var mouseoverObj = _.clone(d);
			mouseoverObj.x = groupTransformX + startX;
			var handleMouseover = e => { this._handleMouseOver(e, mouseoverObj); };
			
			// assign node for shape based on data
			var shapeNode;
			// last non intron, add arrow
			if (isLast && !isIntron) {
				var pathString = this._getTrapezoidStringPath(startX, endX, (d.track > 0));
				shapeNode = <path d={pathString}  onMouseOver={handleMouseover} opacity={opacity} fill={fill} />;
			// intron, line
			} else if (isIntron) {
				var pathString = `M${startX} ${HEIGHT/2} C ${startX + (endX - startX) * 0.25} ${HEIGHT / 5}, ${startX + (endX - startX) * 0.75} ${HEIGHT / 5}, ${endX} ${HEIGHT / 2}`;
				shapeNode = <path d={pathString} onMouseOver={handleMouseover} opacity={opacity} stroke="black" fill="none" />;
			// everything else, rectangle
			} else {
				shapeNode = <rect onMouseOver={handleMouseover} opacity={opacity} x={startX} width={endX - startX} height={HEIGHT} fill={fill} />;
			}

			return (
				<g transform={groupTransform}>
					{shapeNode}
					{textNode}
				</g>
			);
		});
	},

	_getSimpleLocusNode: function (d, isFocusLocus) {
		var scale = this._getScale();
		var startX = scale(Math.min(d.start, d.end));
		var endX = scale(Math.max(d.start, d.end));

		var relativeStartX = 0;
		var relativeEndX = endX - startX;

		var pathString = this._getTrapezoidStringPath(relativeStartX, relativeEndX, (d.track > 0));
		
		var focusKlass = isFocusLocus ? " focus" : "";

		// text node
		var _approxWidth = d.locus.display_name.length * 8;
		var _onClick = (e) => { this._onLocusSelect(e, d); };
		var _textX = relativeEndX / 2;
		var _textY = HEIGHT - 4;
		var _textTransform = `translate(${_textX}, ${_textY})`;
		var _opacity = d.id === this.state.mouseoverId ? 1 : 0.8;
		var textNode = <text className={`locus-diagram-anchor${focusKlass}`} onClick={_onClick} transform={_textTransform} textAnchor="middle">{d.locus.display_name}</text>;
		// hide text if too small
		if (_approxWidth > relativeEndX) textNode = null;

		// interaction handlers
		var _onMouseover = (e) => {
			this._handleMouseOver(e, d);
		};
		var _onClick = (e) => {
			this._handleClick(e, d);
		}

		var _transform = this._getGroupTransform(d);
		return (
			<g transform={_transform}>
				<path className={`locus-node${focusKlass}`} d={pathString}opacity={_opacity} onClick= {_onClick} onMouseOver={_onMouseover} />
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
		var _y = this._getMidpointY() - d.track * (HEIGHT + TRACK_SPACING);
		if (d.track < 0) _y -= HEIGHT;

		return {
			x: _x,
			y: _y
		};
	},

	_getMidpointY: function () {
		return (this.props.watsonTracks) * (HEIGHT + TRACK_SPACING) + TRACK_SPACING;
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
			.x( d => { return d.x; })
			.y( d => { return d.y; });

		return areaFn(points) + "Z";
	},

	_calculateWidth: function () {
		var _width = this.getDOMNode().getBoundingClientRect().width;
		this.setState({ DOMWidth: _width });
	},

	// Set the new domain; it may want some control in the future.
	_setDomain: function (newDomain) {
		this._clearMouseOver();

		// TEMP be more forgiving with new domain
		// don't let the new domain go outside domain bounds
		var _lb = Math.max(newDomain[0], this.props.domainBounds[0]);
		var _rb = Math.min(newDomain[1], this.props.domainBounds[1]);

		// make sure not TOO zoomed in
		if (_rb - _lb < MIN_BP_WIDTH) return;

		this.setState({
			domain: [_lb, _rb]
		});
	},

	_handleMouseOver: function (e, d) {
		// get the position
		var target = e.currentTarget;
		var _width = target.getBBox().width;
		var _transformObj = this._getTransformObject(d);
		var _tooltipLeft = Math.min(this.state.DOMWidth, (d.x || _transformObj.x) + _width / 2);
		_tooltipLeft = Math.max(5, _tooltipLeft);
		var _tooltipTop = _transformObj.y + HEIGHT / 3;
		var _tooltipData = this._formatTooltipData(d);

		this.setState({
			mouseoverId: d.id,
			tooltipData: _tooltipData.data,
			tooltipTitle: _tooltipData.title,
			tooltipHref: _tooltipData.href,
			tooltipVisible: true,
			tooltipLeft: _tooltipLeft,
			tooltipTop: _tooltipTop
		});
	},

	_formatTooltipData: function (d) {
		var _title;
		if (d.locus) {
			_title = (d.locus.display_name === d.locus.format_name) ? d.locus.display_name : `${d.locus.display_name} (${d.locus.format_name})`;
		} else {
			_title = d.display_name.replace(/_/g, " ");
		}
			
		// dynamic key value object
		var _data = {};
		if (d.locus) {
			_data[d.locus.locus_type] = d.locus.headline;
			// TODO add chrom number 
			_data["Coordinates"] = `${d.start.toLocaleString()} - ${d.end.toLocaleString()}`;
			_data["Length"] = (d.end - d.start).toLocaleString() + " bp";
		} else {
			_data["Relative Coordinates"] = `${d.relative_start} - ${d.relative_end}`;
			_data["Length"] = (d.relative_end - d.relative_start).toLocaleString() + " bp";
		}

		return {
			title: _title,
			data: _data,
			href: d.locus ? d.locus.link : null
		};
	},

	_clearMouseOver: function () {
		this.setState({
			mouseoverId: null, 
			tooltipVisible: false
		}); 
	},

	_handleClick: function (e, d) {
		e.preventDefault();
		if (d.locus.link) {
			document.location = d.locus.link;
		}
	},

	_onLocusSelect: function (e, d) {
		e.preventDefault();
		document.location.href = d.locus.link;
	},

	_getScale: function () {
		return d3.scale.linear().domain(this.state.domain).range([0, this.state.DOMWidth]);
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
		var scale = this._getScale();
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

			// chromosome reference labeling
			var chromThumb = this._getChromosomeThumb();

			controlsNode = (
				<div className="locus-diagram-control-container">
					<div className="row control-row">
						<div className="medium-8 columns">
							{chromThumb}
						</div>
						<div className="medium-4 columns end clearfix">
							<ul className="locus-diagram-button-group round button-group">
								<li><a className={`tiny button ${leftDisabledClass}`} onClick={stepLeft}><i className="fa fa-backward"></i></a></li>
								<li><a className={`tiny button ${rightDisabledClass}`} onClick={stepRight}><i className="fa fa-forward"></i></a></li>
							</ul>
							<ul className="locus-diagram-button-group round button-group">
								<li><a className={`tiny button ${inDisabledClass}`} onClick={zoomIn}><i className="fa fa-plus"></i></a></li>
								<li><a className={`tiny button ${outDisabledClass}`} onClick={zoomOut}><i className="fa fa-minus"></i></a></li>
							</ul>
						</div>
					</div>
				</div>
			);
		}

		return controlsNode;
	},

	_getChromosomeThumb: function () {
		var chromThumb = <span>&nbsp;</span>;
		// neighbor diagram with chrom thumb prop
		if (this.props.hasChromosomeThumb &&!this.props.showSubFeatures) {
			chromThumb = (<ChromosomeThumb
				totalLength={this.props.contigData.length} domain={this.state.domain}
				centromerePosition={this.props.contigData.centromerePosition} isChromosome={this.props.contigData.isChromosome}
			/>);
		// details diagram
		} else if (this.props.showSubFeatures) {
			var _subN = this.props.data.locci[0].tags.length;
			var _labelText = (_subN > 1) ? "subfeatures" : "subfeature";
			chromThumb = <h3 className="subfeature-label-text">Subfeatures - S288C<span className="round secondary label">{_subN} {_labelText}</span></h3>;
		}

		return chromThumb;
	},

	_getFocusLocus: function () {
		// require focus locus display name
		if (!this.props.focusLocusDisplayName) return false;

		var _locci = this.props.data.locci;
		return _.filter(_locci, d => { return d.locus.display_name === this.props.focusLocusDisplayName; })[0];
	},
});
