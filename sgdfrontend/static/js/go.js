
$(document).ready(function() {

	$.getJSON(go_details_link, function(data) {
	  	var go_table = create_go_table(data);
	  	create_analyze_button("all_go_table_analyze", go_table, analyze_link, analyze_filename, true);
  	    create_download_button("all_go_table_download", go_table, download_table_link, download_filename);
  	    create_show_child_button("go_table_show_children", go_table, data, go_details_all_link, go_data_to_table, function(table_data) {
            $("#all_go_header").html(table_data.length);

            var genes = {};
            for (var i=0; i < table_data.length; i++) {
                genes[table_data[i][1]] = true;
            }
            $("#all_go_subheader").html(Object.keys(genes).length);
  	    });
	});

	$.getJSON(ontology_graph_link, function(data) {
  		create_cytoscape_vis("cy", layout, graph_style, data);
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
  	$("#all_go_subheader_type").html("genes");

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["bDestroy"] = true;
	options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + display_name};
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
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
        'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 12,
        'color': 'grey',
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
    "name": "breadthfirst",
	"fit": false
};
