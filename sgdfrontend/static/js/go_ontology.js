
$(document).ready(function() {

	$.getJSON(ontology_graph_link, function(data) {
  		create_cytoscape_vis("cy", layout, graph_style, data);
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("ontology");

});

var graph_style = cytoscape.stylesheet()
	.selector('node')
	.css({
		'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 14,
		'text-outline-width': 3,
		'text-valign': 'center',
		'width': 30,
		'height': 30,
		'border-color': '#fff',
		'background-color': "grey",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector('edge')
	.css({
		'width': 2,
		'target-arrow-shape': 'triangle'
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'width': 30,
		'height': 30,
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[sub_type='molecular function']")
	.css(
		{'background-color': "#7FBF7B"
	})
	.selector("node[sub_type='biological process']")
	.css(
		{'background-color': "#AF8DC3"
	})
	.selector("node[sub_type='cellular component']")
	.css(
		{'background-color': "#1F78B4"
});

var layout = {
    "name": "arbor",
	"liveUpdate": true,
	"ungrabifyWhileSimulating": true,
	"nodeMass":function(data) {
	    if(data.sub_type == 'FOCUS') {
		    return 10;
		}
		else {
			return 1;
		}
	},
    "maxSimulationTime": 5000
};