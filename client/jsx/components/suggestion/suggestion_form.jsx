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
			<h1>SGD Suggestions and Questions</h1>
			<hr />
			{formNode}
		</div>);
	},

	_getFormNode: function () {
		if (this.state.isComplete) {
			return (<div>
			       <div className="row">
			       	    <p><b>Thank you for your suggestion.</b></p>
				    <p>A copy of your email has been sent to <b> {this.state.userEmail} </b>. If you do not receive this email shortly, then you may have entered an invalid email address.</p>
				    <ul>
					<li>Form_Name=Suggestion</li>
					<li>Name={this.state.userName}</li>
					<li>Address={this.state.userEmail}</li>
					<li>Subject={this.state.subject}</li>
					<li>Text={this.state.message}</li>
				    </ul>
				    <p>Thanks for helping to improve SGD.</p>
			       </div>
			 </div>);
			
		} 
		else if (this.state.isPending) {

		     return (<div>
			       <div className="row">
			       	    <p><b>Please fix your email address or verify the captcha before submitting the info.</b></p>
			       </div>
			 </div>);
			
		}
		else {
			return (<div>
				<form onSubmit={this._onSubmit}>
					<div className="row">
						<div className="large-12 columns">
							<p>Please fill in your name and e-mail address to send mail to a curator sgd-helpdesk@lists.stanford.edu</p>
							<label>Name: <span className='red'>(Required)</span></label><br></br>
							<input type='text' placeholder='Your name' ref='name' size='50' required='true'></input><p></p>
							<label>E-mail: <span className='red'>(Required)</span></label><br></br>
							<input type='text' placeholder='Your email address' ref='internet' size='50' required='true'></input><p></p>
							<label>Subject:</label><br></br>
							<input type='text' placeholder='a subject' ref='subject' size='50'></input><p></p>
							<label>Please enter your message here:</label><br></br>
							<textarea ref='text' rows='10' cols='50'></textarea><p></p>
							<input type='checkbox' ref='send_user_copy' unchecked></input> Send me a copy<p></p>
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

		var name = this.refs.name.value.trim();
		var email = this.refs.internet.value.trim();
                var subject = this.refs.subject.value.trim();
                var message = this.refs.text.value.trim();
                var sendUserCopy = this.refs.send_user_copy.checked;
		/* console.log(sendUserCopy) */
		/* return */

		$.ajax({
			url: "/send_data",
			data_type: 'json',
			type: 'POST',
			data: { 'name':    name,
                                'email':   email,
				'subject': subject,
                                'message': message,
				'sendUserCopy': sendUserCopy,
				'googleResponse': this.state.userRecaptchaResponse
                        },
			success: function(data) {
			      this.setState({isComplete: true});
			}.bind(this),
			error: function(xhr, status, err) {
			      this.setState({isPending: true}); 
			}.bind(this) 
		});
 
		this.setState({
			userName:  name,
			userEmail: email,
			subject:   subject,
			message:   message,
			sendUserCopy: sendUserCopy
                });

	}
});
