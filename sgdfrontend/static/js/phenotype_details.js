
$(document).ready(function() {
  	$.getJSON(phenotype_details_link, function(data) {
  	    var phenotype_table = create_phenotype_table(data);
        create_download_button("phenotype_table_download", phenotype_table, download_table_link, download_table_filename);
        $("#phenotype_table_analyze").hide();
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

    //Get resources
	$.getJSON(phenotype_resources_link, function(data) {
	  	set_up_resources("mutant_resource_list", data['Mutant Resources']);
	  	set_up_resources("phenotype_resource_list", data['Phenotype Resources']);
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function create_phenotype_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {'sWidth': '250px'}, null];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var phenotypes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            phenotypes[data[i]['bioconcept']['id']] = true;
        }

        $("#phenotype_header").html(data.length);
        $("#phenotype_subheader").html(Object.keys(phenotypes).length);

        if(Object.keys(phenotypes).length == 1) {
            $("#phenotype_subheader_type").html('phenotype');
        }
        else {
            $("#phenotype_subheader_type").html('phenotypes');
        }
        if(datatable.length == 1) {
            $("#phenotype_header_type").html("entry for ");
        }
        else {
            $("#phenotype_header_type").html("entries for ");
        }

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {'sWidth': '250px'}, null];
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
		'width': 2,
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888',
	})
	.selector("node[type='BIOCONCEPT']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888',
		'background-color': "#D0A9F5",
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
