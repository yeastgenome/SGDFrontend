
$(document).ready(function() {

	$.getJSON(go_details_link, function(data) {
	  	var go_table = create_go_table(data);
	  	create_analyze_button("go_table_analyze", go_table, analyze_link, analyze_filename, true);
  	    create_download_button("go_table_download", go_table, download_table_link, download_filename);

        if(child_count > count) {
            create_show_child_button("go_table_show_children", go_table, data, go_details_all_link, go_data_to_table, function(table_data) {
                var genes = {};
                for (var i=0; i < table_data.length; i++) {
                    genes[table_data[i][1]] = true;
                }
                set_up_header('go_table', table_data.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');
            });
        }
	});

	$.getJSON(ontology_graph_link, function(data) {
  		create_cytoscape_vis("cy", layout, graph_style, data);

        if(data['all_children'] != null && data['all_children'].length > 0) {
            var children_div = document.getElementById("children");
            for(var i=0; i < data['all_children'].length; i++) {
                var a = document.createElement('a');
                a.innerHTML = data['all_children'][i]['display_name'];
                a.href = data['all_children'][i]['link']
                children_div.appendChild(a);

                if(i != data['all_children'].length-1) {
                    var comma = document.createElement('span');
                    comma.innerHTML = ', ';
                    children_div.appendChild(comma);
                }
            }
        }
        else {
            $("#children_wrapper").hide()
        }
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("annotations");

});

function create_go_table(data) {
	var datatable = [];
	var genes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(go_data_to_table(data[i], i));
		genes[data[i]["bioentity"]["id"]] = true;
	}
    set_up_header('go_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["bDestroy"] = true;
	options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + display_name};
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
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
    .selector("node[id='NodeMoreChildren']")
	.css({
		'width': 30,
		'height': 30,
        'shape': 'rectangle'
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
