
$(document).ready(function() {
    $("#expression_table_analyze").hide();

  	get_json(expression_details_link, function(data) {
        if(data['datasets'].length > 0) {
            create_expression_chart(data['overview'], data['min_value'], data['max_value']);
        }
        else {
            $('#expression_overview_panel').hide();
            $('#expression_message').show();
        }
  	    var expression_table = create_expression_table(data['datasets']);
        create_download_button("expression_table_download", expression_table, download_table_link, download_table_filename);
        $("#expression_table_analyze").hide();
  	});

  	get_json(expression_graph_link, function(data) {
  		if(data != null && data['nodes'].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, true);
            var max_value = data["min_coeff"] + Math.min(data["max_coeff"] - data["min_coeff"], 10);
            var slider = create_slider("slider", graph, data["min_coeff"], max_value, function slider_filter(new_cutoff) {return "node, edge[score >= " + (new_cutoff/10) + "]";}, max_value+1);
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
        'aaSorting': [[3, "asc"]],
        'aoColumns': [
            {"bSearchable":false, "bVisible":false}, //Evidence ID
            {"bSearchable":false, "bVisible":false}, //Analyze ID
            {"bVisible":false}, //Histogram
            null, //Dataset
            null, //Description
            null, //Tags
            null, //Number of Conditions
            null //Reference
            ]
    }
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var reference_ids = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(dataset_datat_to_table(data[i], i));
            if(data[i]['reference'] != null) {
                reference_ids[data[i]['reference']['id']] = true;
            }
        }

        set_up_header('expression_table', datatable.length, 'dataset', 'datasets', Object.keys(reference_ids).length, 'reference', 'references');

        options["oLanguage"] = {"sEmptyTable": "No expression data for " + display_name,
                                'sSearch': 'Type a keyword (examples: “histone”, “stress”) into this box to filter for those rows within the table that contain the keyword. Type in more than one keyword to find rows containing all keywords: for instance, “transcription factor” returns rows that contain both “transcription and “factor”. To remove the filter, simply delete the text from the box.'};
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
