/** @jsx React.DOM */
var React = require("react");
var d3 = require("d3");

var FlexibleTooltip = require("./flexible_tooltip.jsx");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			path: null,
			delay: 0,
			nodeHeight: "15px"
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

		// text node can be a label with a link, just a label, or nothing
		var textNode;
		if (this.props.path && this.props.displayName) {
			textNode = [<span key="textLabel">{this.props.displayName + " - "}</span>, <a key="textAnchor" href={this.props.path}>Overview</a>];
		} else if (this.props.displayName) {
			textNode = this.props.displayName;
		} else {
			textNode = null;
		}

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
		var widthScale = d3.scale.linear()
			.domain([0, 1, this.props.maxFeatures])
			.range([0, 3, $(this.getDOMNode()).width() - 50]);

		// define color scale for features, as well as ORF statuses
		var colors = d3.scale.category20b().range();
		var orfStatusScale = d3.scale.ordinal().range(colors.slice(0, 3));
		var featureColorScale = d3.scale.ordinal().range(colors.slice(3, -1));

		// bind data to selection
		var sel = d3.select(this.getDOMNode());
		var features = sel.select(".feature-container").selectAll('feature-node').data(this.props.features);

		// exit
		features.exit().remove();

		// append divs for each feature
		var _this = this; // alias "this" to also use d3 node in callbacks
		features.enter().append("div")
			.attr({ class: "feature-node"})
			.style({
				float: 'left',
				width: "0px",
				height: this.props.nodeHeight,
				"background-color": (d, i) => { return featureColorScale(i); },
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
		var _rect = node.getBoundingClientRect();

		this.setState({
			tooltipVisible: true,
			tooltipText: `${d.value.toLocaleString()} ${d.name.replace(/_/g, " ")}s`,
			tooltipTop: node.offsetTop,
			tooltipLeft: node.offsetLeft + _rect.width/2,
			tooltipHref: _href
		});
	},

	_clearTooltip: function () {
		d3.select(this.getDOMNode()).selectAll(".feature-node").style({ opacity: 0.6 });
		this.setState({ tooltipVisible: false });
	}
});
