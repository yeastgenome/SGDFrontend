/** @jsx React.DOM */
"use strict";

var React = require("react");
var d3 = require("d3");
var _ = require("underscore");

var CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
var FlexibleTooltip = require("../widgets/flexible_tooltip.jsx");
var StandaloneAxis = require("./standalone_axis.jsx");
var Legend = require("./blast_legend.jsx");

var HEIGHT = 12;
var POINT_WIDTH = 10;

module.exports = React.createClass({
	mixins: [CalcWidthOnResize],

	getDefaultProps: function () {
	        var _identity = (d) => { return d; };
		return {
		        data: null, // *
                        colorValue: function (d) { return d; },
                        colorScale: function (d, i) { return "#DF8B93" },
                        hasTooltip: false,
                        hasNonZeroWidth: false,
                        hasYAxis: true,
                        labelRatio: 0.5,
                        left: 50,
                        labelValue: _identity,
                        maxY: null,
                        nodeOpacity: function (d) { return "auto"; },
                        filter: null,
                        scaleType: "linear",
                        yValue: _identity,
                        start: null,
                        legendColor: null,
			tracks: 5			
		};
	},

	getInitialState: function () {
		return {
		        DOMWidth: 355,
			widthScale: null,
                        tooltipVisible: false,
                        tooltipText: "",
                        tooltipLeft: 0,
                        tooltipTop: 0,
                        tooltipHref: null,
                        filterIsApplied: true
		};
	},

	render: function () {

		var state = this.state;
		var props = this.props;

		// require widthScale to continue
		if (! state.widthScale) return <div></div>;
		
		// create y axis, if hasYaxis
                var data = this._getData();
                var _maxY = this.props.maxY;
                var axisNode =  <StandaloneAxis 
                                 scaleType={props.scaleType} 
                                 domain={[0, _maxY]} 
                                 labelText="Query" 
                                 left={props.left} 
                                 leftRatio={props.labelRatio} 
                                 transitionDuration={500} 
                />;
                
                var tooltipNode = props.hasTooltip ? (<FlexibleTooltip visible={state.tooltipVisible}
                                left={state.tooltipLeft} top={state.tooltipTop} text={state.tooltipText}
                        />) : null;
		
		var _onMouseOver = (e) => { this._handleMouseOver(e, d); };

		var allBars = [];
		var preBars = [];
		var h = 0;
		_.map(data, d => { 
		       if (!d.same_row) {
		       	  h += 2*HEIGHT;
		       }
		       var bar = this._getBarNode(d, h);
		       if (d.same_row) {
			     preBars.push(bar);
		       }
		       else if (preBars) {
		       	     allBars.push(<svg style={{ width: "90%", left: this.props.left, height: HEIGHT, position: "relative", background: "light=grey"}}>{preBars}</svg>);
			     preBars = [bar];
		       }
		       else {
		             preBars.push(bar);
		       }
		});

		allBars.push(<svg style={{ width: "90%", left: this.props.left, height: HEIGHT, position: "relative", background: "light-grey"}}>{preBars}</svg>);
		
		allBars.push(<svg style={{ height: HEIGHT, position: "relative"}}></svg>); // empty row for extra space between bars and legend
    
		var legendBar = (<Legend 
                                  elements={props.legendColor}
                                  leftRatio={props.labelRatio}
                />);
		
		return (
			<div className="locus-diagram" onMouseLeave={this._clearMouseOver} onClick={this._clearMouseOver}>
			     	{axisNode}
				<div className="locus-diagram-viz-container" style={{ position: "relative" }}>
				        {tooltipNode}
					{allBars}
					<div className="bar-nodes-container clearfix" style={{ position: "relative", height: HEIGHT*3 }}>
                                 	     {legendBar}
                                	</div>
				</div>
			</div>
		);
	},

	componentDidMount: function () {
                this._calculateWidthScale();
        },

        componentWillReceiveProps: function (nextProps) {
                this._calculateWidthScale(nextProps);
        },

        // called by mixin
        _calculateWidth: function () {
                this._calculateWidthScale();
        },

	_calculateWidthScale: function (props) {
	        var scaleTypes = {
		        linear: d3.scale.linear(),
			sqrt: d3.scale.sqrt()
                };
		var _baseScale = scaleTypes[this.props.scaleType];
									    
		var _props = props ? props : this.props;
		var _maxY = _props.maxY || d3.max(_props.data, _props.yValue); // defaults to maxY prop, if defined
		var _width = this.getDOMNode().getBoundingClientRect().width;
		var _scale = _baseScale.domain([0, _maxY]).range([0, _width * (1-_props.labelRatio)]);
		this.setState({ widthScale: _scale });
	},

	_getData: function () {
                var hasFilter = this.props.filter && this.state.filterIsApplied;
                var data = this.props.data;
                if (hasFilter) {
                        data = _.filter(data, this.props.filter);
                }
		return data;
	},

	_getBarNode: function (d, h) {
		// var startX = this._getScale(d.start) + this.props.left;
		// var endX = this._getScale(d.end) + this.props.left;

		var startX = this._getScale(d.start);
                var endX = this._getScale(d.end);

		// var relativeStartX = 0;
		// var relativeEndX = endX - startX;
	
		var pathString = this._getTrapezoidStringPath(startX, endX, d.strand);

		var _opacity = 0.5;
		
		// interaction handlers
		var _onMouseover = (e) => {
			this._handleMouseOver(e, d, h);
		};
		var _onClick = (e) => {
			this._handleClick(e, d);
		}

		var _color = this.props.colorScale(this.props.colorValue(d));
		
		var shapeNode;
		// large enough for trapezoid
		if ((endX - startX) > POINT_WIDTH) {
			  shapeNode = <path d={pathString} fill={_color} opacity={_opacity} onClick= {_onClick} onMouseOver={_onMouseover} />;
		} else {  // too small; rect
			shapeNode = <rect x={0} width={endX - startX} height={HEIGHT} opacity={_opacity} onClick= {_onClick} onMouseOver={_onMouseover} />;
		}

		var _transform = this._getGroupTransform(d);
		return (
			<g transform={_transform}>
				{shapeNode}
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
		var _x = this._getScale(Math.min(d.start, d.end));
		var _y = this._getMidpointY();
		return {
		        x: _x,
			y: _y
		};
	},

	_getMidpointY: function () {
		// return (this.props.watsonTracks) * (HEIGHT + TRACK_SPACING) + TRACK_SPACING;
		// return (this.props.watsonTracks) * HEIGHT;
		return '';
	},

	// from relative start, relative end, and bool isWatson, return the string to draw a trapezoid
	_getTrapezoidStringPath: function (relativeStartX, relativeEndX, strand) {
		var pointWidth = Math.min(POINT_WIDTH, (relativeEndX - relativeStartX));
	
		var points;
		if (strand >= 0) {
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
				{ x: relativeStartX + pointWidth, y: 0},
				{ x: relativeEndX, y: 0},
				{ x: relativeEndX, y: HEIGHT },
				{ x: relativeStartX + pointWidth, y: HEIGHT },
				{ x: relativeStartX, y: HEIGHT / 2 },
				{ x: relativeStartX + pointWidth, y: 0}
			];
		}

		var areaFn = d3.svg.line()
			.x( d => { return d.x; })
			.y( d => { return d.y; });

		// return areaFn(points) + "Z";

		return areaFn(points);

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

	_handleMouseOver: function (e, d, h) {
                // get the position
		var _tooltipLeft = this._getScale(d.start) + this.props.left + 10;
      		var _tooltipTop = h;

                if (this.props.onMouseOver) {
                        this.props.onMouseOver(d);
                }

                if (this.props.hasTooltip) {
                        this.setState({
                                tooltipVisible: true,
                                tooltipText: `${this.props.labelValue(d)}`,
                                tooltipTop: _tooltipTop,
                                tooltipLeft: _tooltipLeft,
                        });
                }

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

	_getScale: function (coord) {
		return this.state.widthScale(coord);
	}


});
