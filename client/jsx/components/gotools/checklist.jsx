"use strict";

var React = require("react");
var _ = require("underscore");

var Checklist = React.createClass({
	propTypes: {
		elements: React.PropTypes.array.isRequired, // [ { name: "Doggy Woggy", key: "dog" }, ...]
		initialActiveElementKeys: React.PropTypes.array,
		onSelect: React.PropTypes.func // (activeElementKeys) =>
	},

	getDefaultProps: function () {
		return {
			initialActiveElementKeys: []
		};
	},

	getInitialState: function () {
		return {
			activeElementKeys: this.props.initialActiveElementKeys
		};
	},

	render: function () {
		var _currentActive = this.state.activeElementKeys;
		var inputs = _.map(this.props.elements, (d, i) => {
			var _isActive = _currentActive.indexOf(d.key) >= 0;
			var _onClick = e => {
				// e.preventDefault();
				e.nativeEvent.stopImmediatePropagation();
				// add or remove key from active
				if (_isActive) {
					_currentActive = _.filter(_currentActive, _d => {
						return _d !== d.key;
					});
				} else {
					_currentActive.push(d.key);
				}
				if (this.props.onSelect) this.props.onSelect(_currentActive);
				this.setState({ activeElementKeys: _currentActive });
			};

			var widthPercent = `${1 / this.props.elements.length * 100}%`;
			return (
			        <div className="checklist-element-container" style={{ display: "inline-block", width: widthPercent }} key={"radioElement" + i}>
					<input type="checkbox" onChange={_onClick} name={d.key} value={d.key} checked={_isActive} style={{ margin: 0 }}>
						<label onClick={_onClick}>{d.name}</label>
					</input>
				</div>
			);		
		});

		return (
			<div>
				<form className="checklist" action="">
					{inputs}
				</form>
			</div>
		);
	}

});

module.exports = Checklist;
