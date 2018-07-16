$(document).ready(function() {

  	$.getJSON('/backend/locus/' + locus['id'] + '/disease_details', function(data) {
  	    var mc_disease_table = create_disease_table("mc_disease", "No manually curated terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "manually curated"}, data);
        create_download_button("mc_disease_table_download", mc_disease_table, locus['display_name'] + "_manual_disease_do");

        var htp_disease_table = create_disease_table("htp_disease", "No high-throughput terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "high-throughput"}, data);
        create_download_button("htp_disease_table_download", htp_disease_table, locus['display_name'] + "_htp_disease_do");

        var comp_disease_table = create_disease_table("comp_disease", "No computational terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "computational"}, data);
        create_download_button("comp_disease_table_download", comp_disease_table, locus['display_name'] + "_computational_disease_do");


        var transformed_data = [];
        var mc_count = 0;
        var htp_count = 0;
        var comp_count = 0;
        for (var i=0; i < data.length; i++) {
            transformed_data.push(disease_data_to_table(data[i], i));
            if(data[i]['annotation_type'] == 'manually curated') {
                mc_count = mc_count + 1;
            }
            else if(data[i]['annotation_type'] == 'high-throughput') {
                htp_count = htp_count + 1;
            }
            else if(data[i]['annotation_type'] == 'computational') {
                comp_count = comp_count + 1;
            }
        }
        var headers = ["Evidence ID", "Analyze ID", "", "Gene", "Gene Format Name", "Disease Ontology Term", "Disease Ontology Term ID", "Qualifier", "Method", "Evidence", "Source", "Assigned On", "Reference", "Relationships"];
        create_download_button_no_table("disease_download_all", headers, transformed_data, locus['display_name'] + "_disease_annotations")

        if(mc_count == 0) {
            $("#manual_message").show();
        }
        if(htp_count == 0) {
            $("#htp_message").show();
        }
        if(comp_count == 0) {
            $("#comp_message").show();
        }
  	});

  	$.getJSON('/backend/locus/' + locus['id'] + '/disease_graph', function(data) {
        if(data['nodes'].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, false, "go");
            var slider = create_slider("slider", graph, data['min_cutoff'], data['max_cutoff'], slider_filter, data['max_cutoff']+1);
            create_cy_download_button(graph, "cy_download", locus['display_name'] + '_disease_graph')
  		}
		else {
			hide_section("network");
		}
	});
});

function create_disease_table(prefix, message, filter, data) {
    var options = {};
    options["aoColumns"] = [
            {"bSearchable":false, "bVisible":false}, //evidence_id
            {"bSearchable":false, "bVisible":false}, //analyze_id
            {"bSearchable":false, "bVisible":false}, //gene
            {"bSearchable":false, "bVisible":false}, //gene systematic name
            null, //gene ontology term
            {"bSearchable":false, "bVisible":false}, //gene ontology term id
            null, //qualifier
            null, //evidence
            {"bSearchable":false, "bVisible":false}, //method
            null, //source
            null, //assigned on
            null, //annotation_extension
            null // reference
            ];
    options["bPaginate"] = true;
    options["aaSorting"] = [[5, "asc"]];

    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var diseases = {};
        for (var i=0; i < data.length; i++) {
            if(filter(data[i])) {
                datatable.push(disease_data_to_table(data[i], i));
                diseases[data[i]['disease']['id']] = true;
            }
        }
        set_up_header(prefix + '_disease_table', datatable.length, 'entry', 'entries', Object.keys(diseases).length, 'Disease Ontology term', 'Disease Ontology terms');

        options["oLanguage"] = {"sEmptyTable": message};
        options["aaData"] = datatable;

        if(Object.keys(diseases).length == 0) {
            $("#" + prefix + "_disease").hide();
            $("#" + prefix + "_subsection").hide();
        }
    }

	$("#" + prefix + "_disease_table_analyze").hide();

    return create_table(prefix + "_disease_table", options);
}

function slider_filter(new_cutoff) {
    return "node[gene_count >= " + new_cutoff + "], edge";
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
    .selector("node[type='GO']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888',
		'background-color': "#7FBF7B"
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
