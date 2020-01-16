"use strict";

import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';

class RadioSelector extends React.Component{
	// elements, i.e.[ { name: "Doggy Woggy", key: "dog" }, ...]
	// onSelect(activeElementKey)
	constructor(props){
		super(props);
		this.state = {
			activeElementKey: this.props.initialActiveElementKey
		};
	}


	componentDidUpdate() {
		if (this.props.onSelect) {
			this.props.onSelect(this.state.activeElementKey)
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return !(this.state.activeElementKey === nextState.activeElementKey);
	}

	render() {
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
					<input type="radio" onChange={_onClick} id={d.key} value={d.key} checked={_checked} />
					<label onClick={_onClick}>{d.name}</label>
				</div>
			);
			
		});
		return (
			<div className="radio-selector">
				{inputs}
			</div>
		);
	}

}

RadioSelector.propTypes = {
	elements: PropTypes.array.isRequired,
	initialActiveElementKey: PropTypes.string,
	onSelect: PropTypes.func,
	orientation: PropTypes.string // "horizontal" or "vertical"
}

RadioSelector.defaultProps = {
	orientation: "horizontal"
}

export default RadioSelector;
