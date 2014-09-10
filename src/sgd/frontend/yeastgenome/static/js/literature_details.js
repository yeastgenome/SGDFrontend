
$(document).ready(function() {

  	get_json(literature_details_link, function(data) {
  	    set_up_reference_list("primary", "primary_list", "primary_list_empty_message", "primary_list_wrapper", "primary_list_download", download_link, display_name + "_primary_citations", data['primary']);
        set_up_reference_list("additional", "additional_list", "additional_list_empty_message", "additional_list_wrapper", "additional_list_download", download_link, display_name + "_additional_citations", data['additional']);
  		set_up_reference_list("review", "review_list", "review_list_empty_message", "review_list_wrapper", "review_list_download", download_link, display_name + "_review_citations", data['review']);
  		set_up_reference_list("go", "go_list", "go_list_empty_message", "go_list_wrapper", "go_list_download", download_link, display_name + "_go_citations", data['go']);
  		set_up_reference_list("phenotype", "phenotype_list", "phenotype_list_empty_message", "phenotype_list_wrapper", "phenotype_list_download", download_link, display_name + "_phenotype_citations", data['phenotype']);
  		set_up_reference_list("interaction", "interaction_list", "interaction_list_empty_message", "interaction_list_wrapper", "interaction_list_download", download_link, display_name + "_interaction_citations", data['interaction']);
  		set_up_reference_list("regulation", "regulation_list", "regulation_list_empty_message", "regulation_list_wrapper", "regulation_list_download", download_link, display_name + "_regulation_citations", data['regulation']);
    });

  	get_json(literature_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
  			var graph = create_cytoscape_vis("cy", layout, graph_style, data);
            create_cy_download_button(graph, "cy_download", download_network_link, display_name + '_literature_graph')
  		}
		else {
			hide_section("network");
		}
	});

});

function set_up_reference_list(header_id, list_id, message_id, wrapper_id, download_button_id, download_link, download_filename, data) {
    data.sort(function(a, b) {return b['year'] - a['year']});

    set_up_header(header_id, data.length, 'reference', 'references');
	set_up_references(data, list_id);

	if (data.length == 0) {
		$("#" + message_id).show();
		$("#" + wrapper_id).hide();
	}
	$("#" + download_button_id).click(function f() {
		download_citations(list_id, download_link, download_filename);
	});
}

var graph_style = cytoscape.stylesheet()
	.selector('node')
	.css({
		'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 14,
		'text-outline-width': 3,
		'text-valign': 'center',
		'width': 10,
		'height': 10,
		'border-color': '#fff',
		'background-color': "#D0A9F5",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector('edge')
	.css({
		'width': 2
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'width': 30,
		'height': 30,
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[type='REFERENCE']")
	.css({
		'shape': 'oval',
		'text-outline-color': '#888',
		'color': '#fff',

		'width': 100,
		'height': 30
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
