/** @jsx React.DOM */
"use strict";
var Radium = require("radium");
var React = require("react");
var _ = require("underscore");

var Checklist = require("../widgets/checklist.jsx");
var DidClickOutside = require("../mixins/did_click_outside.jsx");

var WIDTH = 150;
var IMAGE_WIDTH = 174;
var IMAGE_HEIGHT = 274;
var REFERENCE_STRAIN_ID = 1;

var StrainSelector = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		store: React.PropTypes.object,
		onUpdate: React.PropTypes.func // onUpdate()
	},

	getInitialState: function () {
		return {
			isActive: false,
		};
	},

	render: function () {
		return (
			<div className="strain-selector" style={{ position: "relative", height: "2.4rem" }}>
				{this._getActiveNode()}
				<a className="button dropdown small secondary" onClick={this._toggleActive}><i className="fa fa-check-square" /> Strains</a>
			</div>
		);
	},

	didClickOutside: function () {
		this.setState({ isActive: false });
	},

	_toggleActive: function (e) {
		e.preventDefault();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ isActive: !this.state.isActive });
	},

	_getActiveNode: function () {
		if (!this.state.isActive) return null;

		var _style = {
			position: "absolute",
			top: "3rem",
			padding: "1rem",
			background: "#efefef",
			width: WIDTH,
			zIndex: 2
		};

		var _stopClick = e => {
			e.nativeEvent.stopImmediatePropagation();
		};
		var _onSelect = keys => {
			console.log(keys)
			// this.props.store.setActiveStrainIds(keys);
		};
		var currentActiveIds = this.props.store.getVisibleStrainIds();
		var metaData = this.props.store.getStrainMetaData()
			.filter( d => { return d.id !== REFERENCE_STRAIN_ID; });

		var _elements = metaData.map( d => {
			return { name: d.name, key: d.id };
		});
		var _onSelect = ids => {
			this.props.store.setVisibleStrainIds(ids);
			if (typeof this.props.onUpdate === "function") this.props.onUpdate();
		};
		return (
			<div onClick={_stopClick} style={_style}>
				<div>
					<span style={{ fontSize: "0.875rem" }}>S288C (reference)</span>
					<Checklist elements={_elements} initialActiveElementKeys={currentActiveIds} onSelect={_onSelect} />
				</div>
			</div>
		);
	}
});

module.exports = Radium(StrainSelector);
