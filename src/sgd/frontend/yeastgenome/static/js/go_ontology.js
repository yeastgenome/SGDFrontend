
$(document).ready(function() {
	$.getJSON('/redirect_backend?param=go/' + ontology['id'] + '/ontology_graph', function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data, null, false, "goOntology");
        create_cy_download_button(cy, "cy_download", ontology['display_name'] + '_go_ontology_graph')
	});

    $.getJSON('/redirect_backend?param=go/' + ontology['id'] + '/locus_details', function(data) {
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
			//Use of mData
            {"bSearchable":false, "bVisible":false,"aTargets":[0],"mData":0}, //evidence_id
            {"bSearchable":false, "bVisible":false,"aTargets":[1],"mData":1}, //analyze_id
            {"aTargets":[2],"mData":2}, //gene
            {"bSearchable":false, "bVisible":false,"aTargets":[3],"mData":3}, //gene systematic name
            {"aTargets":[4],"mData":4}, //gene ontology term  -----> qualifier
            {"bSearchable":false, "bVisible":false,"aTargets":[5],"mData":5}, //gene ontology term id
            {"aTargets":[6],"mData":6, "bVisible":false}, //qualifier   -----> gene ontology term
            {"bSearchable":false, "bVisible":false,"aTargets":[7],"mData":7}, //aspect
            {"aTargets":[8],"mData":8}, //evidence   -----> annotation_extension
            {"aTargets":[9],"mData":9}, //method -----> evidence
            {"bSearchable":false,"bVisible":false,"aTargets":[10],"mData":10}, //source -----> method
            {"aTargets":[11],"mData":11}, //assigned on -----> source
            {"aTargets":[12],"mData":12}, //annotation_extension -----> assigned on
            {"aTargets":[13],"mData":13} // reference  
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
