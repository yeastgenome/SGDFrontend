/** @jsx React.DOM */
"use strict";

var React = require("react");

var GenomeSnapshotModel = require("../models/genome_snapshot_model.jsx");
var NavBar = require("../components/navbar.jsx");
var TableAlternative = require("../components/table_alternative.jsx");
var SunburstBarChart = require("../components/viz/sunburst_bar_chart.jsx");
var BarChart = require("../components/viz/bar_chart.jsx");

var snapshotView = {};
snapshotView.render = function () {

	// render date
	var currentDate = new Date()
	document.getElementsByClassName("date-container")[0].innerHTML =
		` - ${currentDate.getMonth()+1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;

	// render nav bar
	var navElements = [
		{ name: "Genome Inventory", target: "genomeInventory" },
		{ name: "GO Annotations", target: "goAnnotations" },
		{ name: "Phenotype Annotations", target: "phenotypeAnnotations" }
	];
	React.renderComponent(
		<NavBar title="Genome Snapshot" elements={navElements} />,
		document.getElementsByClassName("navbar-container")[0]
	);

	// TEMP!!! QA endpoind
	var genomeModel = new GenomeSnapshotModel({ url: "http://sgd-qa.stanford.edu/webservice/snapshot?callback=?"});
	genomeModel.fetch( (err, nestedData) => {

		var featuresData = nestedData.featuresData;
		React.renderComponent(
			<TableAlternative vizType="genomeSnapshot" isInitiallyTable={false} graphData={featuresData.graphData} tableData={featuresData.tableData} />,
			document.getElementsByClassName("genome-snapshot-target")[0]
		);

		var goData = nestedData.goData;
		React.renderComponent(
			<SunburstBarChart data={goData} />,
			document.getElementsByClassName("go-snapshot-target")[0]
		);

		var phenotypeData = nestedData.phenotypeData;
		var _colorValue = (d) => { return "#DF8B93"; }
		var _yValue = (d) => { return d.annotation_count; };
		var _labelValue = (d) => { return d.display_name; };

		var barChart = (
			<BarChart
				data={phenotypeData} yValue={_yValue}
				labelValue={_labelValue} labelRatio={0.15}
				hasTooltip={true} colorScale={_colorValue}
				yAxisLabel="Genes Products Annotated"
			/>
		);
		React.renderComponent(barChart, document.getElementsByClassName("phenotype-snapshot-target")[0]);

	});
};

module.exports = snapshotView;
