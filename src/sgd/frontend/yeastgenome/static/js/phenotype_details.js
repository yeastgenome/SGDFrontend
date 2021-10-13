
$(document).ready(function() {
  	$.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/phenotype_details', function(data) {
  	    var phenotype_table = create_phenotype_table(data);
        create_download_button("phenotype_table_download", phenotype_table, locus['display_name'] + "_phenotypes");
        $("#phenotype_table_analyze").hide();
  	});

  	$.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/phenotype_graph', function(data) {
  		if(data['nodes'].length > 1) {
  			var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, false, "phenotype");
  			var slider = create_slider("slider", graph, data['min_cutoff'], data['max_cutoff'], slider_filter, data['max_cutoff']+1);
            create_cy_download_button(graph, "cy_download", locus['display_name'] + '_phenotype_graph')
  		}
		else {
			hide_section("network");
		}
	});
});

function create_phenotype_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {'sWidth': '250px'}, null];
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

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {'sWidth': '250px'}, null];
        options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + locus['display_name']};
        options["aaData"] = datatable;
        options["scrollX"] = true;
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
		'background-color': "#D0A9F5"
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
