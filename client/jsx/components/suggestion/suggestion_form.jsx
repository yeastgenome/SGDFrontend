/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var GoogleRecaptcha = require("../widgets/google_recaptcha.jsx");

module.exports = React.createClass({
	getInitialState: function () {
		return {
			isComplete: false,
			isPending: false,
			userError: null,
			userName: null,
			userEmail: null,
			userRecaptchaResponse: null,
			subject: null,
			message: null,
			sendUserCopy: true
		};
	},

	render: function () {
		return (<div>
			<h1>Suggestion</h1>
			<hr />
			<GoogleRecaptcha onComplete={this._onCompleteCaptcha}/>
		</div>);
	},

	_onCompleteCaptcha: function (response) {
		this.setState({
			userRecaptchaResponse: response
		});
	}
});
