
$(document).ready(function() {

	$.getJSON('/backend/go/' + ontology['id'] + '/ontology_graph?callback=?', function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data);
        create_cy_download_button(cy, "cy_download", ontology['display_name'] + '_go_ontology_graph')
	});

    $.getJSON('/backend/go/' + ontology['id'] + '/locus_details?callback=?', function(data) {
	  	var go_table = create_go_table(data);
	  	create_analyze_button("go_table_analyze", go_table, "<a href='" + ontology['link'] + "' class='gene_name'>" + ontology['display_name'] + "</a> genes", true);
  	    create_download_button("go_table_download", go_table, ontology['display_name'] + "_annotations");
	});
	
});

function create_go_table(data) {
	var datatable = [];
	var genes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(go_data_to_table(data[i], i));
		genes[data[i]["locus"]["id"]] = true;
	}

    set_up_header('go_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["bDestroy"] = true;
	options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + ontology['display_name']};
    options["aoColumns"] = [
            {"bSearchable":false, "bVisible":false}, //evidence_id
            {"bSearchable":false, "bVisible":false}, //analyze_id
            null, //gene
            {"bSearchable":false, "bVisible":false}, //gene systematic name
            {"bSearchable":false, "bVisible":false}, //gene ontology term
            {"bSearchable":false, "bVisible":false}, //gene ontology term id
            null, //qualifier
            {"bSearchable":false, "bVisible":false}, //aspect
            {"bSearchable":false, "bVisible":false}, //method
            null, //evidence
            null, //source
            null, //assigned on
            null, //annotation_extension
            null // reference
            ];
    options["aaData"] = datatable;

    return create_table("go_table", options);
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
		'background-color': "#43a0df",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector('edge')
    .css({
        'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 12,
        'color': 'grey',
		'width': 2,
		'source-arrow-shape': 'triangle'
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'width': 30,
		'height': 30,
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	});
//	.selector("node[sub_type='HAS_CHILDREN']")
//	.css(
//		{'background-color': "#165782"
//	})
//	.selector("node[sub_type='HAS_DESCENDANTS']")
//	.css(
//		{'background-color': "#43a0df"
//	})
//	.selector("node[sub_type='NO_DESCENDANTS']")
//	.css(
//		{'background-color': "#c9e4f6"
//	});

var layout = {
    "name": "breadthfirst",
	"circle": true
};