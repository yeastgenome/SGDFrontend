import React from 'react';
import _ from 'underscore';

const DownloadButton = React.createClass({
	getDefaultProps: function () {
		return {
			buttonId: null,
			isButton: true, // false makes a simpler anchor
			url: null, // *
			extension: ".txt",
			params: {},
			text: "Download"
		};
	},

	render: function () {
		var _paramKeys = _.keys(this.props.params);
		var inputNodes = _.map(_paramKeys, k => {
			return <input type="hidden" name={k} value={this.props.params[k]} />;
		});

		return (
			<form method="POST" action={this.props.url}>
				{inputNodes}
				<button id={this.props.buttonId} className="button small secondary">
					<i className="fa fa-download" /> {this.props.text} ({this.props.extension})
				</button>
			</form>
		);
	}
});

module.exports = DownloadButton;
