"use strict";

var React = require("react");
var _ = require("underscore");

module.exports = React.createClass({

	// elements, i.e.[ { name: "Doggy Woggy", key: "dog" }, ...]
	// onSelect called with activeElementKey as only argument
	getDefaultProps: function () {

		return {
			elements: [],
			initialActiveElementKey: null,
			onSelect: null,
		};
	},

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
		var inputs = _.map(this.props.elements, (d) => {
			var _onClick = (e) => {
				e.preventDefault();
				this.setState({
					activeElementKey: d.key
				});
			};
			var _checked = d.key === this.state.activeElementKey;
			return (
				<div className="radio-element-container" style={{ display: "inline-block" }}>
					<input type="radio" onClick={_onClick} name={d.key} value={d.key} checked={_checked}>
						<label>{d.name}</label>
					</input>
				</div>
			);
			
		});
		return (
			<form className="radio-selector" action="">
				{inputs}
			</form>
		);
	}

});
