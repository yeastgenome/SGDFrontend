import React from 'react';
import d3 from 'd3';
import _ from 'underscore';

const CalcWidthOnResize = require("../mixins/calc_width_on_resize.jsx");
const FlexibleTooltip = require("../widgets/flexible_tooltip.jsx");
const StandaloneAxis = require("../blast/standalone_axis.jsx");

const HEIGHT = 22;
const BAR_COLOR = "#F5F5F5";
const LEGEND_COLOR = "#F5FFFA";

const OPACITY = 0.5;
// const BAR_START = 60;
const BAR_START = 75;

const GREEN = "#008000";
const MAGENTA =	"#FF00FF";
const ORANGE = "#FFA500";

const DEFAULT_DOM_SIDE_SIZE = 315; 
const TOOLTIP_DELAY = 25;

const enzyme_type_to_color = { "3' overhang": GREEN,
    			       "5' overhang": MAGENTA,
			       "blunt end": ORANGE };
 
module.exports = React.createClass({

	mixins: [CalcWidthOnResize],

	getDefaultProps() {	
		return { data: null,
		         seqLength: null,
			 left: 10,
			 scaleType: "linear" };
		      
	},

	getInitialState() {
		return {
		        DOMWidth: DEFAULT_DOM_SIDE_SIZE,
                        DOMHeight: 2 * DEFAULT_DOM_SIDE_SIZE,
			mouseOverId: null,
                        quickMouseOverId: null,
			widthScale: null,
                        tooltipVisible: false,
			tooltipText: null,
			tooltipLeft: BAR_START,
			tooltipTop: null,
			tooltipData: null,
		};
	},

	render() {

		var state = this.state;
		var props = this.props;

		// require widthScale to continue
		if (!state.widthScale) return <div ref="wrapper"></div>;
		
		// create y axis, if hasYaxis
                var data = this.props.data;
                var seqLength = this.props.seqLength;
 		var left = this.props.left + BAR_START;
                var axisNode =  <StandaloneAxis 
                                 scaleType='linear' 
                                 domain={[0, seqLength]} 
                                 labelText='bp' 
                                 left={left}
                                 leftRatio='0.1' 
                                 transitionDuration={100} 
                />;
                
		var legendNodes = [];
		legendNodes.push(<svg style={{ width: "100%", left: props.left, height: HEIGHT, position: "relative"}}>{this._getLegendNode4WC(seqLength)}</svg>);
		legendNodes.push(<svg style={{ width: "100%", left: props.left, height: HEIGHT, position: "relative"}}>{this._getLegendNode4enzymes(seqLength)}</svg>); 

		var [modText, dateText] = this._getModDate();

		var allBars = [];
		
		var h = 0;
		var enzymes = Object.keys(data).sort();
		for (var i = 0; i < enzymes.length; i++) {
		       // h += 1.2*HEIGHT; 
		       h += 1.198*HEIGHT;     
		       var bar = this._getBarNode(enzymes[i], data[enzymes[i]], seqLength, h);
		       allBars.push(<svg style={{ width: "100%", left: props.left, height: HEIGHT, position: "relative"}}>{bar}</svg>);
		}

		return (<div ref="wrapper" className="blast-bar-graph" onMouseLeave={this._onMouseLeave}>
			     {axisNode}
		             <div className="blast-bar-container" style={{ position: "relative" }}>
			     	  {this._getTooltipNode()}
				  {allBars}
			     </div>
			     {legendNodes}
			     <div>
				{modText}
			     	{dateText}
			     </div>
		</div>);
	},

	componentDidMount() {
                this._calculateWidthScale();
        },

        componentWillReceiveProps() {
                this._calculateWidthScale();
        },

        // called by mixin
        _calculateWidth() {
                this._calculateWidthScale();
        },

	_calculateWidthScale() {

		var baseScale = d3.scale.linear();
				
		var maxY = this.props.seqLength;
		var width = this.refs.wrapper.getBoundingClientRect().width;
		var labelRatio = 0.1;
		var scale = baseScale.domain([0, maxY]).range([0, width * (1-labelRatio)]);
		this.setState({ widthScale: scale });
	},

	_getBarNode(enzyme, d, seqLen, h) {

		var cutPositionsW  = d['cut_site_on_watson_strand'].split(",");
		var cutPositionsC = d['cut_site_on_crick_strand'].split(",");
		var offset = parseInt(d['offset']);
		var overhang = parseInt(d['overhang']);
		var recognition_seq = d['recognition_seq'];
                var enzyme_type = d['enzyme_type'];
		var cutTicks = [];
		var cutSites = [];
		var coordW1 = [];
		var coordW2 = [];
		var cutSiteW = [];
		var cutSiteC = [];
		for (var i = 0; i < cutPositionsW.length; i++) {
		    if (cutPositionsW[i] == '') {
                       continue;
	            }  
		    var cutSite = parseInt(cutPositionsW[i]);
		    var	color =	"red";
		    var x = BAR_START + this._getScale(cutSite);
		    var y = 5;
		    cutSites.push(cutSite);
		    cutSiteW.push(cutSite);
		    cutTicks.push(<circle cx={x+1} cy={y-2} r={3} stroke={color} stroke-width={1} fill={color} />);	         
		    cutTicks.push(<rect x={x} y={y} width={2} height={7} fill={color} opacity={OPACITY} />);
		}
		for (var i = 0; i < cutPositionsC.length; i++) {		    
		    if (cutPositionsC[i] == '') {
		        continue;
		    }
		    var cutSite = parseInt(cutPositionsC[i]);
		    var color = "blue";
		    x = BAR_START + this._getScale(cutSite);
                    y = 10;
		    cutSiteC.push(cutSite);
		    cutSites.push(cutSite);
		    cutTicks.push(<circle cx={x+1} cy={y+9} r={3} stroke={color} stroke-width={1} fill={color} />);
		    cutTicks.push(<rect x={x} y={y} width={2} height={7} fill={color} opacity={OPACITY} />); 
		}
		
		cutSites.push(seqLen)
		var cutFragments = this._getFragments(cutSites);
		
		var startX = this._getScale(0);
                var endX = this._getScale(seqLen);

                var textX = endX-100;
                var textColor = enzyme_type_to_color[enzyme_type];
				
                var transform = this._getGroupTransform(startX, endX);
						
		var fragments = cutFragments.sort(function(a, b){return b-a}).join(", ");
		var cSiteW = cutSiteW.sort(function(a, b){return a-b}).join(", ");
		var cSiteC = cutSiteC.sort(function(a, b){return a-b}).join(", "); 
		if (cSiteW == "") {
		   cSiteW = "None";
		}
		if (cSiteC == "") {
		      cSiteC = "None";
                }
		var mouseOverData = { "offset (bp)": offset,
		    		      "overhang (bp)": overhang,
				      "recognition sequence": recognition_seq,
				      "enzyme type": enzyme_type,
				      "fragment size (bp)": fragments,
				      "cut site on W strand": cSiteW,
				      "cut site on C strand": cSiteC };
		
		var mouseOverId = enzyme;		
                var tooltipTop = h-15;
                var tooltipLeft = BAR_START+320;

		var _onMouseover = (e) => {
                        this._onMouseOver(e, mouseOverId, tooltipTop, tooltipLeft, false, mouseOverData, "Enzyme: "+enzyme);
                };
		
                return (<g transform={transform}>
			   <rect onMouseOver={_onMouseover}
			   	 x={BAR_START} 
				 width={endX - startX} 
				 height={HEIGHT} 
				 fill={BAR_COLOR} 
				 opacity={OPACITY} />
			   <rect x={BAR_START} 
			   	 y={10} 
				 width={endX - startX} 
				 height={2} 
				 fill="black" 
				 opacity={OPACITY} />
			   <rect onMouseOver={_onMouseover}
			   	 x={0}
                                 y={0}
                                 width={BAR_START-2}
                                 height={HEIGHT}
                                 fill={BAR_COLOR}
                                 opacity={OPACITY} />
			   <text x={2} 
				 y={HEIGHT-5} 
				 font-family="Times New Roman" 
				 font-size="14" 
				 fill={textColor}>{enzyme}</text>
			  { cutTicks }
                        </g>
                );
        },
		
	_getLegendNode4enzymes(seqLen) {

		var startX = this._getScale(0);
                var endX = this._getScale(seqLen);

                var transform = this._getGroupTransform(startX, endX);

	        return (<g transform={transform}>
		       	   <rect x={0}
                                 width={endX - startX + BAR_START}
                                 height={HEIGHT}
                                 fill={LEGEND_COLOR}
                                 opacity={OPACITY} />
			   <text x={105}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
                                 fill={GREEN}>Green</text>
			   <text x={148}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
				 fill="black">enzyme name = 3' overhang</text>
                           <text x={341}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
                                 fill={MAGENTA}>Magenta</text>
                           <text x={401}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
                                 fill="black">enzyme name = 5' overhang</text>
			   <text x={595}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
                                 fill={ORANGE}>Orange</text>
                           <text x={645}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
                                 fill="black">enzyme name = blunt end</text>
                        </g>
                );	

	},

	 _getLegendNode4WC(seqLen) {

                var startX = this._getScale(0);
                var endX = this._getScale(seqLen);

                var transform = this._getGroupTransform(startX, endX);

                return (<g transform={transform}>
                           <rect x={0}
                                 width={endX - startX + BAR_START}
                                 height={HEIGHT}
                                 fill={LEGEND_COLOR}
                                 opacity={OPACITY} />
                           <text x={50}
                                 y={HEIGHT-4}
                                 font-family="Times New Roman"
                                 font-size="18"
                                 fill="black">Keys:</text>
                           <circle cx={140} cy={HEIGHT-10} r={3} stroke="red" stroke-width={1} fill="red" />
                           <rect x={139} y={HEIGHT-10} width={2} height={7} fill="red" opacity={OPACITY} />
                           <text x={148}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
                                 fill="black">:  Recognition sequence in Watson (5'->3') strand</text>
                           <circle cx={488} cy={HEIGHT-8} r={3} stroke="blue" stroke-width={1} fill="blue" />
                           <rect x={487} y={HEIGHT-15} width={2} height={7} fill="blue" opacity={OPACITY} />
                           <text x={495}
                                 y={HEIGHT-5}
                                 font-family="Times New Roman"
                                 font-size="14"
                                 fill="black">:  Recognition sequence in Crick (3'->5') strand</text>
                        </g>
                );

        },

	_getModDate() {
	
		var today = new Date();
                var day = today.getDate();
                var month = today.getMonth()+1; // January is 0!
                var year = today.getFullYear();
                if (day < 10) {
                    day = '0' + day;
                }
                if (month < 10) {
                    month = '0' + month;
                }
                today = year + "-" + month + "-" + day;
                var mod = "SGD";
                var modText = <span className="legend-entry-container" style={{left: "2%", position: "relative"}}>{mod}</span>
                var dateText = <span className="legend-entry-container" style={{left: "85%", position: "relative"}}>{today}</span>

		return [modText, dateText]

	},

	_getFragments(cutSites) {
		var cutSitesSorted = cutSites.sort(function(a, b){return a-b});
                var preCutSite = 0;
		var found = {};
		var cutFragments = [];
                for (var i = 0; i < cutSitesSorted.length; i++) {
                    var cutSize = cutSitesSorted[i] - preCutSite;
                    if (cutSize != 0 && found[cutSize] != 1) {
                        cutFragments.push(cutSize);
                        found[cutSize] = 1;
                    }
                    preCutSite = cutSitesSorted[i];
                }
		return cutFragments;
	},

	// returns the transform string used to position the g element for a locus
	_getGroupTransform(start, end) {
		var obj = this._getTransformObject(start, end);
		return `translate(${obj.x}, ${obj.y})`;
	},

	// returns  transform x y coordinates
	_getTransformObject(start, end) {
		var _x = this._getScale(Math.min(start, end));
		var _y = this._getMidpointY();
		return {
		        x: _x,
			y: _y
		};
	},

	_getMidpointY() {
		return '';
	},
	
	_getTooltipNode() {
                return (
                        <div >
                                <FlexibleTooltip
                                        visible={this.state.tooltipVisible}
					text={this.state.tooltipText} 
					data={this.state.tooltipData}
					title={this.state.tooltipTitle}
                                        left={this.state.tooltipLeft} 
					top={this.state.tooltipTop}
					onMouseOver={this._clearMouseOverTimeout}
                                />
                        </div>
                );
        },

	_clearMouseOverTimeout() {
                if (this._mouseOverTimeout) clearTimeout(this._mouseOverTimeout);
        },
	
	_onMouseLeave(e) {
                if (this._mouseLeaveTimeout) clearTimeout(this._mouseLeaveTimeout);
                this._mouseLeaveTimeout = setTimeout( () => {
                        this.setState({ tooltipVisible: false,
					mouseOverId: null,
					tooltipText: null,
					tooltipTitle: null,
					tooltipData: null,
					tooltipLeft: null,
                                	tooltipTop: null
			});
                }, TOOLTIP_DELAY);
	},

	_onMouseOver(e, mouseOverId, tooltipTop, tooltipLeft, mouseOverText, mouseOverData, title) {
                this._clearMouseOverTimeout();
                this._mouseOverTimeout = setTimeout( () => {
		        this.setState({
                                mouseOverId: mouseOverId,
                                tooltipVisible: true,
				tooltipText: mouseOverText,
				tooltipData:  mouseOverData,
				tooltipTitle: title,
				tooltipLeft: tooltipLeft,
				tooltipTop: tooltipTop
                        });
                }, TOOLTIP_DELAY);

                this.setState({
                        quickMouseOverId: mouseOverId,
                });
        },

	_getScale(coord) {
		return this.state.widthScale(coord);
	}

});
