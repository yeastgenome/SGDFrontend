
$(document).ready(function() {

    $.getJSON('/backend/locus/' + locus['id'] + '/interaction_details?callback=?', function(data) {
        var interaction_table = create_interaction_table(data);
        create_download_button("interaction_table_download", interaction_table, locus['display_name'] + "_interactions");
        create_analyze_button("interaction_table_analyze", interaction_table, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> interactors", true);
  	    create_analyze_button("phys_gen_union", interaction_table, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> interactors", false);

        if(B > 0) {
  	        create_analyze_button_with_list("phys", get_physical_interactors(data), "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> physical interactors");
  	    }
  	    if(A > 0) {
  	        create_analyze_button_with_list("gen", get_genetic_interactors(data), "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> genetic interactors");
  	    }
  	    if(C > 0) {
  	        create_analyze_button_with_list("phys_gen_intersect", get_physical_and_genetic_interactors(data), "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> both physical and genetic interactors");
  	    }
        if (A + B + C === 0 ) {
            $("#interaction_table_download").hide();
            $("#interaction_table_analyze").hide();
        }
	});

	$.getJSON('/backend/locus/' + locus['id'] + '/interaction_graph?callback=?', function(data) {
	    if(data != null && data["nodes"].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, true, "interaction");
            var slider = create_slider("slider", graph, data["min_evidence_cutoff"], data["max_evidence_cutoff"], function slider_filter(new_cutoff) {return "node, edge[evidence >= " + new_cutoff + "]";});
            create_cy_download_button(graph, "cy_download", locus['display_name'] + '_interaction_graph')

            if(data["max_phys_cutoff"] >= data["min_evidence_cutoff"] && data["max_gen_cutoff"] >= data["min_evidence_cutoff"]) {
                create_discrete_filter("union_radio", graph, slider, all_filter, data["max_evidence_cutoff"]);
                create_discrete_filter("physical_radio", graph, slider, physical_filter, data["max_phys_cutoff"]);
                create_discrete_filter("genetic_radio", graph, slider, gen_filter, data["max_gen_cutoff"]);
                $("#discrete_filter").show();
            }
            else {
                $("#discrete_filter").hide();
            }
        }
        else {
            hide_section("network");
        }
    });

});

function create_interaction_table(data) {
    var options = {};
    if("Error" in data) {
        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(interaction_data_to_table(data[i], i));
            if(data[i]["locus1"]["id"] == locus['id']) {
                genes[data[i]["locus2"]["id"]] = true;
            }
            else {
                genes[data[i]["locus1"]["id"]] = true;
            }
        }

        set_up_header('interaction_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": "No interaction data for " + locus['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("interaction_table", options);
}

function get_physical_interactors(data) {
    var bioent_ids = {};
    for(var i=0; i < data.length; i++) {
        if(data[i]["interaction_type"] == "Physical") {
            if(data[i]["locus1"]["id"] == locus['id']) {
                bioent_ids[data[i]["locus2"]["id"]] = true;
            }
            else {
                bioent_ids[data[i]["locus1"]["id"]] = true;
            }
        }
    }
    return Object.keys(bioent_ids);
}

function get_genetic_interactors(data) {
    var bioent_ids = {};
    for(var i=0; i < data.length; i++) {
        if(data[i]["interaction_type"] == "Genetic") {
            if(data[i]["locus1"]["id"] == locus['id']) {
                bioent_ids[data[i]["locus2"]["id"]] = true;
            }
            else {
                bioent_ids[data[i]["locus1"]["id"]] = true;
            }
        }
    }
    return Object.keys(bioent_ids);
}

function get_physical_and_genetic_interactors(data) {
    var physical_ids = get_physical_interactors(data);
    var genetic_ids = get_genetic_interactors(data);

    var genetic_dict = {};
    for(var i=0; i < genetic_ids.length; i++) {
        genetic_dict[genetic_ids[i]] = true;
    }

    var intersect_ids = [];
    for(i=0; i < physical_ids.length; i++) {
        if(physical_ids[i] in genetic_dict) {
            intersect_ids.push(physical_ids[i]);
        }
    }
    return intersect_ids;
}

function all_filter() {
    return "node, edge";
}

function physical_filter() {
    return "node, edge[class_type = 'PHYSICAL']";
}

function gen_filter() {
    return "node, edge[class_type = 'GENETIC']";
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
	.selector("edge[class_type = 'GENETIC']")
	.css({
		'line-color': "#7FBF7B"
	})
	.selector("edge[class_type = 'PHYSICAL']")
	.css({
		'line-color': "#AF8DC3"
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
