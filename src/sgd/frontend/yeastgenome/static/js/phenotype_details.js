
$(document).ready(function() {
    $("#phenotype_table_analyze").hide();
  	$.getJSON(phenotype_details_link, function(data) {
  	    var phenotype_table = create_phenotype_table(data);
        create_download_button("phenotype_table_download", phenotype_table, download_table_link, download_table_filename);
        phenotype_table.fnFilter(filter);
  	});

  	$.getJSON(phenotype_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
  			var graph = create_cytoscape_vis("cy", layout, graph_style, data);
  			var slider = create_slider("slider", graph, data['min_cutoff'], data['max_cutoff'], slider_filter, data['max_cutoff']+1);
  		}
		else {
			hide_section("network");
		}
	});
});

function create_phenotype_table(data) {
    var options = {"bPaginate":  true,
                    "aaSorting": [[4, "asc"]],
                    "aoColumns":  [
                        {"bSearchable":false, "bVisible":false}, //Evidence ID
                        {"bSearchable":false, "bVisible":false}, //Analyze ID
                        {"bSearchable":false, "bVisible":false}, //Gene
                        {"bSearchable":false, "bVisible":false}, //Gene Systematic Name
                        null, //Phenotype
                        {"bVisible":false}, //Phenotype Slim
                        null, //Experiment Type
                        {"bVisible":false}, //Experiment Type Category
                        null, //Mutant Informaiton
                        null, //Strain Background
                        null, //Chemical
                        {'sWidth': '250px'}, //Details
                        null //Reference
                    ]
    };


    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var phenotypes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            phenotypes[data[i]['phenotype']['id']] = true;
        }

        set_up_header('phenotype_table', datatable.length, 'entry', 'entries', Object.keys(phenotypes).length, 'phenotype', 'phenotypes');

        options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("phenotype_table", options);
}

function slider_filter(new_cutoff) {
    var filter = "node[gene_count >= " + new_cutoff + "], edge";
    return filter;
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
		'width': 2
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[type='OBSERVABLE']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888',
		'background-color': "#AF8DC3"
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
