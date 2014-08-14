
$(document).ready(function() {
    $("#expression_table_analyze").hide();

  	$.getJSON(expression_details_link, function(data) {
        create_expression_chart(data['overview'], data['min_value'], data['max_value']);
  	    var expression_table = create_expression_table(data['datasets']);
        create_download_button("expression_table_download", expression_table, download_table_link, download_table_filename);
        $("#expression_table_analyze").hide();
  	});

  	$.getJSON(expression_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, true);
            create_cy_download_button(graph, "cy_download", download_network_link, display_name + '_expression_graph')
  		}
		else {
			hide_section("network");
		}
	});
});

function create_expression_table(data) {
    var options = {
        'bPaginate': true,
        'aaSorting': [[1, "asc"]],
        'aoColumns': [
            {"bSearchable":false, "bVisible":false}, //Evidence ID
            null, //Dataset
            null, //Description
            null, //Tags
            null, //Number of Conditions
            null, //Reference
            {"bVisible":false} //Histogram
            ]
    }
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var geo_ids = {};
        var evidence_ids = {};
        for (var i=0; i < data.length; i++) {
            if(!(data[i]['pcl_filename'] in evidence_ids)) {
                datatable.push(dataset_datat_to_table(data[i], i));
                evidence_ids[data[i]['pcl_filename']] = true;
                geo_ids[data[i]['geo_id']] = true;
            }
        }

        set_up_header('expression_table', datatable.length, 'dataset', 'datasets');

        options["oLanguage"] = {"sEmptyTable": "No expression data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("expression_table", options);
}

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
		'width': 'data(score)'
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[type='PHENOTYPE']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888',
		'background-color': "#D0A9F5"
    })
    .selector("edge[direction = 'positive']")
	.css({
		'line-color': "#AF8DC3"
	})
	.selector("edge[direction = 'negative']")
	.css({
		'line-color': "#7FBF7B"
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
