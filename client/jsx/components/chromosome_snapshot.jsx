/** @jsx React.DOM */
var React = require("react");
var d3 = require("d3");

var FlexibleTooltip = require("./flexible_tooltip.jsx");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			path: null,
			delay: 0
		};
	},

	getInitialState: function () {
		return {
			tooltipVisible: false,
			tooltipText: "",
			tooltipLeft: 0,
			tooltipTop: 0,
			toolTipHref: null,
		};
	},

	render: function () {
		var state = this.state;

		var textNode = this.props.path ? ([<span key="textLabel">{this.props.displayName + " - "}</span>, <a key="textAnchor" href={this.props.path}>Overview</a>]) : this.props.displayName;
		return (
			<div className="chromosome-snapshot-container" onMouseLeave={this._clearTooltip} >
				<FlexibleTooltip visible={state.tooltipVisible} href={state.tooltipHref}
					left={state.tooltipLeft} top={state.tooltipTop} text={state.tooltipText}
				/>
				<p className="chromosome-text-node">
					{textNode}
				</p>
				<div className="feature-container clearfix"></div>
			</div>
		);
	},

	// render features with d3
	componentDidMount: function () {
		// declare some scales
		var widthScale = d3.scale.linear().domain([0, this.props.maxFeatures]).range([0, $(this.getDOMNode()).width()])
		var colorScale = d3.scale.category20();

		// bind data to selection
		var sel = d3.select(this.getDOMNode())
		var features = sel.select(".feature-container").selectAll('feature-node').data(this.props.features);

		// exit
		features.exit().remove();

		// append divs for each feature
		var _this = this; // proxy "this" to also use d3 node in callbacks
		features.enter().append("div")
			.attr({ class: "feature-node"})
			.style({
				float: 'left',
				width: "0px",
				height: "15px",
				"background-color": (d, i) => { return colorScale(i); },
				border: 'none',
				opacity: 0.6
			})
			.on("mouseover", function (d) {
				features.style({ opacity: 0.6 });
				d3.select(this).style({ opacity: 1 });
				_this._updateTooltip(d, this);
			})
			.on("mouseleave", () => {
				$(".flexible-tooltip").removeClass("active");
			});


		// animate width to feature size
		features.transition().duration(1000).delay(this.props.delay)
			.style({
				width: (d) => { return widthScale(d.value) + 'px'; }
			});
	},

	_updateTooltip: function (d, node) {
		var _href = this.props.pathRoot ? this.props.pathRoot + d.name : null;

		this.setState({
			tooltipVisible: true,
			tooltipText: d.name.replace(/_/g, " ") + " - " + d.value.toLocaleString() + " features",
			tooltipTop: node.offsetTop,
			tooltipLeft: node.offsetLeft + node.getBoundingClientRect().width/2,
			tooltipHref: _href
		});
	},

	_clearTooltip: function () {
		d3.select(this.getDOMNode()).selectAll(".feature-node").style({ opacity: 0.6 });
		this.setState({ tooltipVisible: false });
	}
});
