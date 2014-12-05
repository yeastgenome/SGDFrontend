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
		var formNode = this._getFormNode();
		return (<div>
			<h1>Suggestion</h1>
			<hr />
			{formNode}
		</div>);
	},

	_getFormNode: function () {
		if (this.state.isPending) {
			return <p>Please wait...</p>;
		} else {
			return (<div>
				<form onSubmit={this._onSubmit}>
					<div className="row">
						<div className="large-12 columns">
							<label>Field1
								<input type="text" />
							</label>
							<GoogleRecaptcha onComplete={this._onCompleteCaptcha} />
							<input type="submit" value="Send" className="button secondary" />
						</div>
					</div>
				</form>
			</div>);
		}
	},

	_onCompleteCaptcha: function (response) {
		this.setState({
			userRecaptchaResponse: response
		});
	},

	_onSubmit: function (e) {
		e.preventDefault();
		this.setState({
			isPending: true
		});
	}
});
