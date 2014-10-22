/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");
var HelpIcon = require("../widgets/help_icon.jsx");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			data: [] // * []
		};
	},

	render: function () {
		var _infoText = 'List of references used specifically on this page as citations for information in the Overview (e.g. gene names, aliases, Descriptions), Summary Paragraph, or History sections. The complete list of curated references associated with this locus can be found by clicking on the "Literature" tab for this locus.';

		var listNode = this._getListNode();
		return (<div>
	        <h2>
	        	References <HelpIcon text={_infoText} isInfo={true} /> <span className="label secondary round">15</span>
	        </h2>
	        {listNode}
		</div>);
	},

	_getListNode: function () {
		var itemNodes = _.map(this.props.data, r => {
			var _text = r.citation.replace(r.display_name, "");
			var refNodes = _.map(r.urls, ref => {
				return <li><a href={ref.link}>{ref.display_name}</a></li>;
			});
			refNodes.unshift(<li><a href={r.link}>SGD Paper</a></li>)
			return (<li>
				<a href={r.link}>{r.display_name}</a> {_text} <small>PMID: {r.pubmed_id}</small>
				<ul className="ref-links">
					{refNodes}
				</ul>
			</li>);
		});

		return <ol>{itemNodes}</ol>;
	}
});
