
$(document).ready(function() {

  	$.getJSON(literature_details_link, function(data) {
  	    set_up_reference_list("primary_header", "primary_list", "primary_message", "primary_wrapper", "export_primary", download_link, display_name + "_primary_citations", data, 'Primary Literature');
        set_up_reference_list("additional_header", "additional_list", "additional_message", "additional_wrapper", "export_additional", download_link, display_name + "_additional_citations", data, 'Additional Literature');
  		set_up_reference_list("review_header", "review_list", "review_message", "review_wrapper", "export_review", download_link, display_name + "_review_citations", data, 'Reviews');
  		set_up_reference_list("go_header", "go_list", "go_message", "go_wrapper", "export_go", download_link, display_name + "_go_citations", data, 'GO');
  		set_up_reference_list("phenotype_header", "phenotype_list", "phenotype_message", "phenotype_wrapper", "export_phenotype", download_link, display_name + "_phenotype_citations", data, 'Phenotype');
  		set_up_reference_list("interaction_header", "interaction_list", "interaction_message", "interaction_wrapper", "export_interaction", download_link, display_name + "_interaction_citations", data, 'Interaction');
  		set_up_reference_list("regulation_header", "regulation_list", "regulation_message", "regulation_wrapper", "export_regulation", download_link, display_name + "_regulation_citations", data, 'Regulation');
    });

  	$.getJSON(literature_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
  			create_cytoscape_vis("cy", layout, graph_style, data);
  		}
		else {
			hide_section("network");
		}
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("regulation");

});

function set_up_reference_list(header_id, list_id, message_id, wrapper_id, download_button_id, download_link, download_filename, data, topic) {
    var references = [];
    for (var i=0; i < data.length; i++) {
        if(data[i]['topic'] == topic) {
            references.push(data[i]['reference']);
        }
    }
    $("#" + header_id).html(references.length);
	set_up_references(references, list_id);
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
