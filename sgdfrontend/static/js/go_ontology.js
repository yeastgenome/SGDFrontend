
$(document).ready(function() {

	$.getJSON(ontology_graph_link, function(data) {
  		create_cytoscape_vis("cy", layout, graph_style, data);
	});

    $.getJSON(go_details_link, function(data) {
	  	var go_table = create_go_table(data);
	  	create_analyze_button("all_go_table_analyze", go_table, analyze_link, analyze_filename, true);
  	    create_download_button("all_go_table_download", go_table, download_table_link, download_filename);
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("all_go");

});

function create_go_table(data) {
	var datatable = [];
	var genes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(go_data_to_table(data[i], i));
		genes[data[i]["bioentity"]["id"]] = true;
	}

  	$("#all_go_header").html(data.length);
  	$("#all_go_subheader").html(Object.keys(genes).length);

    if(Object.keys(genes).length == 1) {
        $("#all_go_subheader_type").html('gene');
    }
    else {
        $("#all_go_subheader_type").html('genes');
    }
    if(datatable.length == 1) {
        $("#all_go_header_type").html("entry for ");
    }
    else {
        $("#all_go_header_type").html("entries for ");
    }

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["bDestroy"] = true;
	options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + display_name};
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
	options["aaData"] = datatable;

    return create_table("all_go_table", options);
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
		'source-arrow-shape': 'triangle'
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
    "name": "breadthfirst",
	"circle": true
};