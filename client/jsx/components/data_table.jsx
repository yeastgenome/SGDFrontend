/** @jsx React.DOM */
var React = require("react");
var _ = require("underscore");

/*
	A react component that renders a table, then uses jQuery data tables to spice it up.
*/
module.exports = React.createClass({

	render: function () {
		var headers = _.map(this.props.data.headers,(h, i) => {
			return ( <td key={"cell" + i}>{h}</td> );
		})
		var rows = _.map(this.props.data.rows, (r, i) => {
			return (
				<tr key={"row" + i}>
					{_.map(r, (d, i) => {
						{/* if data is obj with href and value, make a link, otherwise just plain text if just a string */}
						return (d.href && d.value) ?
							(<td key={"cell" + i}><a href={d.href}>{d.value}</a></td>) : (<td key={"cell" + i}>{d}</td>);
					})}
				</tr>
			);
		});

		return (
			<div className="table-scroll-container">
				<table >
					<thead>
						{headers}
					</thead>
					<tbody>
						{rows}
					</tbody>
				</table>
			</div>
		);
	}
});
