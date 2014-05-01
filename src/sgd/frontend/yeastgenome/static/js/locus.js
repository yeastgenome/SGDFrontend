
$(document).ready(function() {
  	$.getJSON(locus_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
  			var graph = create_cytoscape_vis("cy", layout, graph_style, data);
  		}
		else {
			hide_section("network");
		}
	});

	//Hack because footer overlaps - need to fix this.
    add_footer_space("resources");
});

var graph_style = cytoscape.stylesheet()
	.selector('node')
	.css({
		'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 14,
		'text-outline-width': 3,
		'text-outline-color': '#888',
		'text-valign': 'center',
		'color': '#fff',
		'width': 30,
		'height': 30,
		'border-color': '#fff'
	})
	.selector('edge')
	.css({
		'width': 2
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[type='INTERACTOR']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888',
		'background-color': "#D0A9F5"
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
	}
};
