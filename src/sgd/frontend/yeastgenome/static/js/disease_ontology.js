
$(document).ready(function() {
	$.getJSON('/backend/disease/' + ontology['id'] + '/ontology_graph', function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data, null, false, "diseaseOntology");
        create_cy_download_button(cy, "cy_download", ontology['display_name'] + '_disease_ontology_graph')
	});

    $.getJSON('/backend/disease/' + ontology['id'] + '/locus_details', function(data) {
	  	var disease_table = create_disease_table(data);
	  	create_analyze_button("disease_table_analyze", disease_table, "<a href='" + ontology['link'] + "' class='gene_name'>" + ontology['display_name'] + "</a> genes", true);
  	    create_download_button("disease_table_download", disease_table, ontology['display_name'] + "_annotations");
	});

});

function create_disease_table(data) {
	var datatable = [];
	var genes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(disease_data_to_table(data[i], i));
		genes[data[i]["locus"]["id"]] = true;
	}

    set_up_header('disease_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["bDestroy"] = true;
	options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + ontology['display_name']};
    options["aoColumns"] = [
        {"bSearchable":false, "bVisible":false}, // evidence_id
        {"bSearchable":false, "bVisible":false}, // some other id
        null, // gene
        {"bSearchable":false, "bVisible":false}, //gene systematic name
        null, //disease name
        {"bSearchable":false, "bVisible":false}, // doid
        {"bSearchable":false, "bVisible":false}, // null, empty
        null, // assay
        null, // method manual or htp
        null, // source
        null, // date
        null, // with
        null// reference
    ];
    options["aaData"] = datatable;

    return create_table("disease_table", options);
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

var layout = {
    "name": "breadthfirst",
	"circle": true
};