/** @jsx React.DOM */
"use strict";

var React = require("react");

var FeaturesSnapshotModel = require("../models/features_snapshot_model.jsx");
var GoSnapshotModel = require("../models/go_snapshot_model.jsx");
var PhenotypeSnapshotModel = require("../models/phenotype_snapshot_model.jsx");

var NavBar = require("../components/navbar.jsx");
var TableAlternative = require("../components/table_alternative.jsx");
var SunburstBarChart = require("../components/viz/sunburst_bar_chart.jsx");
var BarChart = require("../components/viz/bar_chart.jsx");

var snapshotView = {};
snapshotView.render = function () {

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

	// render if .genome-snapshot-container is present
	var genomeSnapshotContainers = document.getElementsByClassName("snapshot-container");
	if (genomeSnapshotContainers.length) {

		// declare models to intereact with API
		var featuresSnapshotModel = new FeaturesSnapshotModel({ url: "http://sgd-qa.stanford.edu/webservice/sequence_snapshot?callback=?" });
		var goSnapshotModel = new GoSnapshotModel({ url: "http://sgd-qa.stanford.edu/webservice/go_snapshot?callback=?" });
		var phenotypeModel = new PhenotypeSnapshotModel({ url: "http://sgd-qa.stanford.edu/webservice/phenotype_snapshot?callback=?" });
		
		featuresSnapshotModel.fetch( (err, featuresData) => {

			// React.renderComponent(
			// 	<BarChart data={featuresData.combined} yValue={function(d){return d.value;}} labelValue={function(d){return d.name;}}/>,
			// 	document.getElementsByClassName("genome-snapshot-target")[0]	
			// );

			React.renderComponent(
				<TableAlternative vizType="bar" isInitiallyTable={false} graphData={featuresData.graphData} tableData={featuresData.tableData} />,
				document.getElementsByClassName("genome-snapshot-target")[0]
			);

			goSnapshotModel.fetch( (err, goData) => {
				// render TableAlternative with graphData and tableData
				React.renderComponent(
					<SunburstBarChart data={goData} />,
					document.getElementsByClassName("go-snapshot-target")[0]
				);
			});

			phenotypeModel.fetch( (err, phenotypeData) => {

				var _colorValue = (d) => { return "#666"; };
				var _yValue = (d) => { return d.annotation_count; };
				var _labelValue = (d) => { return d.display_name; };

				var barChart = (
					<BarChart
						data={phenotypeData} yValue={_yValue}
						labelValue={_labelValue} labelRatio={0.15}
						hasTooltip={true} colorScale={_colorValue}
						yAxisLabel="Genes Annotated"
					/>
				);
				React.renderComponent(barChart, document.getElementsByClassName("phenotype-snapshot-target")[0]);
			})
		});
	}
};

module.exports = snapshotView;
