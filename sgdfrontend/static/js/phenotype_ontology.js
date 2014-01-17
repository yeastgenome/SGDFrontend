
$(document).ready(function() {

	$.getJSON(ypo_ontology_link, function(data) {
		$("#ontology").show();
		set_up_full_ontology("full_ontology", data);
	});

  	$.getJSON(ontology_graph_link, function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data);
	});

});

function set_up_full_ontology(ontology_list_id, data) {
	var list = document.getElementById(ontology_list_id);
	for (var i=0; i < data['elements'].length; i++) {
		var li = document.createElement('li');

        var link_a = document.createElement('a');
        link_a.innerText = data['elements'][i]['display_name'];
        link_a.href = data['elements'][i]['link'];

        li.appendChild(link_a);

		li.id = data['elements'][i]['id'];
		list.appendChild(li);
	}
	for (var child_id in data['child_to_parent']) {
		var parent_id = data['child_to_parent'][child_id];
		
		var parent = document.getElementById(parent_id);
		var ul = null;
		if(parent.children.length <= 2) {
			ul = document.createElement('ul');
			parent.appendChild(ul);
		}
		else {
			ul = parent.children[2];
		}
		var child = document.getElementById(child_id);
		list.removeChild(child);

        ul.appendChild(child);
    }
}

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
	.selector("node[sub_type='morphology']")
	.css(
		{'background-color': "#7FBF7B"
	})
	.selector("node[sub_type='fitness']")
	.css(
		{'background-color': "#AF8DC3"
	})
	.selector("node[sub_type='essentiality']")
	.css(
		{'background-color': "#1F78B4"
	})
	.selector("node[sub_type='interaction with host/environment']")
	.css(
		{'background-color': "#FB9A99"
	})
	.selector("node[sub_type='metabolism and growth']")
	.css(
		{'background-color': "#E31A1C"
	})
	.selector("node[sub_type='cellular processes']")
	.css(
		{'background-color': "#FF7F00"
	})
	.selector("node[sub_type='development']")
	.css(
		{'background-color': "#BF5B17"
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