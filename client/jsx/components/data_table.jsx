/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");
var d3 = require("d3");

/*
	A react component that renders a table, then uses jQuery data tables to spice it up.
*/
module.exports = React.createClass({

	render: function () {
		var headerRows = this._getHeaderRows();
		var bodyRows = this._getBodyRows();

		return (
			<div className="table-scroll-container">
				<table >
					<thead>
						{headerRows}
					</thead>
					<tbody>
						{bodyRows}
					</tbody>
				</table>
			</div>
		);
	},

	_getBodyRows: function () {
		var bodyRows = this.props.data.rows.map( (r, i) => {
			return (
				<tr key={"row" + i}>
					{r.map( (d, i) => {
						{/* if data is obj with href and value, make a link, otherwise just plain text if just a string */}
						var textNode = (d.href && d.value) ? <a href={d.href}>{d.value}</a> : d;
						return <td key={"cell" + i}>{textNode}</td>;
					})}
				</tr>
			);
		});

		return bodyRows;
	},

	_getHeaderRows: function () {
		var maxRowWidth = d3.max(this.props.data.headers, (r) => { return r.length; });

		var headerRows = _.map(this.props.data.headers, (r) => {
			var cells = _.map(r, (d, i) => {
				// add a colspan if needed to make rows of equal col width
				var _colSpan = null;
				if (i === r.length - 1 && r.length < maxRowWidth) {
					_colSpan = maxRowWidth - i;
				}

				{/* if data is obj with href and value, make a link, otherwise just plain text if just a string */}
				var textNode = (d.href && d.value) ? <a href={d.href}>{d.value}</a> : d;
				return <td key={"cell" + i} colSpan={_colSpan}>{textNode}</td>;
			});
			return <tr>{cells}</tr>;
		});

		return headerRows;
	}
});
