/** @jsx React.DOM */
"use strict";

var React = require("react");

// React port of the Google recaptcha, documented at https://developers.google.com/recaptcha/docs/display.
// *** NOTE, requires script tag to be included and loaded from google, see docs ***
//  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
module.exports = React.createClass({
	propTypes: {
		onComplete: React.PropTypes.func.isRequired // (response) =>
	},

	render: function () {
		return <div ref="gReCaptchaTarget" />;
	},

	componentDidMount: function () {
		setTimeout( () => {
			grecaptcha.render(this.refs.gReCaptchaTarget.getDOMNode(), {
				sitekey: "6LeL0P4SAAAAALBtOppCpB_XMdtRdtuZPRj_GuM3",
				callback: this.props.onComplete
			});  
		}, 500)

	}
});
