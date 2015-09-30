"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({
	// elements, i.e.[ { name: "Doggy Woggy", key: "dog" }, ...]
	// onSelect(activeElementKey)
	propTypes: {
		elements: React.PropTypes.array.isRequired,
		initialActiveElementKey: React.PropTypes.string,
		onSelect: React.PropTypes.func,
		orientation: React.PropTypes.string // "horizontal" or "vertical"
	},

	getDefaultProps: function () { return { orientation: "horizontal" }; },

	getInitialState: function () {
		return {
			activeElementKey: this.props.initialActiveElementKey
		};
	},

	componentDidUpdate: function () {
		if (this.props.onSelect) {
			this.props.onSelect(this.state.activeElementKey)
		}
	},

	shouldComponentUpdate: function(nextProps, nextState) {
		return !(this.state.activeElementKey === nextState.activeElementKey);
	},

	render: function () {
		var inputs = _.map(this.props.elements, (d, i) => {
			var _onClick = (e) => {
				this.setState({
					activeElementKey: d.key
				});
			};
			var _checked = d.key === this.state.activeElementKey;

			// make the width as wide as possible
			var _width = (this.props.orientation === "horizontal") ? `${1 / this.props.elements.length * 100}%` : "auto";
			var _display = (this.props.orientation === "horizontal") ? "inline-block" : "block";
			return (
				<div className="radio-element-container" style={{ display: _display, width: _width }} key={"radioElement" + i}>
					<input type="radio" onChange={_onClick} id={d.key} value={d.key} checked={_checked}>
						<label onClick={_onClick}>{d.name}</label>
					</input>
				</div>
			);
			
		});
		return (
			<div className="radio-selector">
				{inputs}
			</div>
		);
	}

});
