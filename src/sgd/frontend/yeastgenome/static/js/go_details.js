$(document).ready(function() {

  	$.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/go_details', function(data) {
  	    var mc_bp_go_table = create_go_table("mc_bp", "No manually curated biological process terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "manually curated" && x["go"]["go_aspect"] == "biological process"}, data);
        create_download_button("mc_bp_go_table_download", mc_bp_go_table, locus['display_name'] + "_manual_bp_go");

        var mc_mf_go_table = create_go_table("mc_mf", "No manually curated molecular function terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "manually curated" && x["go"]["go_aspect"] == "molecular function"}, data);
        create_download_button("mc_mf_go_table_download", mc_mf_go_table, locus['display_name'] + "_manual_mf_go");

        var mc_cc_go_table = create_go_table("mc_cc", "No manually curated cellular component terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "manually curated" && x["go"]["go_aspect"] == "cellular component"}, data);
        create_download_button("mc_cc_go_table_download", mc_cc_go_table, locus['display_name'] + "_manual_cc_go");

        var htp_bp_go_table = create_go_table("htp_bp", "No high-throughput biological process terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "high-throughput" && x["go"]["go_aspect"] == "biological process"}, data);
        create_download_button("htp_bp_go_table_download", htp_bp_go_table, locus['display_name'] + "_htp_bp_go");

        var htp_mf_go_table = create_go_table("htp_mf", "No high-throughput molecular function terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "high-throughput" && x["go"]["go_aspect"] == "molecular function"}, data);
        create_download_button("htp_mf_go_table_download", htp_mf_go_table, locus['display_name'] + "_htp_mf_go");

        var htp_cc_go_table = create_go_table("htp_cc", "No high-throughput cellular component terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "high-throughput" && x["go"]["go_aspect"] == "cellular component"}, data);
        create_download_button("htp_cc_go_table_download", htp_cc_go_table, locus['display_name'] + "_htp_cc_go");

        var comp_bp_go_table = create_go_table("comp_bp", "No computational biological process terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "computational" && x["go"]["go_aspect"] == "biological process"}, data);
        create_download_button("comp_bp_go_table_download", comp_bp_go_table, locus['display_name'] + "_computational_bp_go");

        var comp_mf_go_table = create_go_table("comp_mf", "No computational molecular function terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "computational" && x["go"]["go_aspect"] == "molecular function"}, data);
        create_download_button("comp_mf_go_table_download", comp_mf_go_table, locus['display_name'] + "_computational_mf_go");

        var comp_cc_go_table = create_go_table("comp_cc", "No computational cellular component terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "computational" && x["go"]["go_aspect"] == "cellular component"}, data);
        create_download_button("comp_cc_go_table_download", comp_cc_go_table, locus['display_name'] + "_computational_cc_go");

        var transformed_data = [];
        var mc_count = 0;
        var htp_count = 0;
        var comp_count = 0;
        for (var i=0; i < data.length; i++) {
            transformed_data.push(go_data_to_table(data[i], i));
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
	var headers = ["Evidence ID", "Analyze ID", "",  "Gene Format Name", "Qualifier", "Gene Ontology Term ID", "Gene Ontology Term ", "Aspect", "Annotation Extension", "Evidence", "Method", "Source", "Assigned On", "Reference"]
	// var headers = ["Evidence ID", "Analyze ID", "", "Gene", "Gene Format Name", "Gene Ontology Term", "Gene Ontology Term ID", "Qualifier", "Aspect", "Method", "Evidence", "Source", "Assigned On", "Reference", "Relationships"]     ;
        create_download_button_no_table("go_download_all", headers, transformed_data, locus['display_name'] + "_go_annotations")

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

  	$.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/go_graph', function(data) {
            if(data['nodes'].length > 1) {
		var analyze_genes = [];
                for (var i = 0; i < data["nodes"].length; i++) {
                    if (data["nodes"][i]["data"]["type"] === 'BIOENTITY') {
                        var bioent_id = data["nodes"][i]["data"]["dbentity_id"]
                        analyze_genes.push(bioent_id.toString());
                    }
                }
                create_analyze_button_with_list(
                    "cy_shared_go_gene_analyze",
                    analyze_genes,
                    "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> Shared GO Annotations",
                    true
                );

                var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, false, "go");
                var slider = create_slider("slider", graph, data['min_cutoff'], data['max_cutoff'], slider_filter, data['max_cutoff']+1);

		create_cy_download_button(graph, "cy_download", locus['display_name'] + '_go_graph')
		
  	    }
	    else {
		hide_section("network");
	    }
	});
});

function create_go_table(prefix, message, filter, data) {
    var options = {};
    options["aoColumns"] = [
            {"bSearchable":false, "bVisible":false,"aTargets":[0],"mData":0}, //evidence_id
            {"bSearchable":false, "bVisible":false,"aTargets":[1],"mData":1}, //analyze_id
            {"bSearchable":false, "bVisible":false,"aTargets":[2],"mData":2}, //gene
            {"bSearchable":false, "bVisible":false,"aTargets":[3],"mData":3}, //gene systematic name
            {"aTargets":[4],"mData":4}, //gene ontology term  ----> qualifier
            {"bSearchable":false, "bVisible":false,"aTargets":[5],"mData":5}, //gene ontology term id
            {"aTargets":[6],"mData":6}, //qualifier ----> gene ontology term
            {"bSearchable":false, "bVisible":false,"aTargets":[7],"mData":7}, //aspect
            {"aTargets":[8],"mData":8}, //evidence ----> annotation_extension
            {"aTargets":[9],"mData":9}, //method  ----> evidence
            {"bSearchable":false, "bVisible":false, "aTargets":[10],"mData":10}, //source  ----> method
            {"aTargets":[11],"mData":11}, //assigned on ----> source
            {"aTargets":[12],"mData":12}, //annotation_extension ----> assigned on
            {"aTargets":[13],"mData":13} // reference
            ];
    options["bPaginate"] = true;
    options["aaSorting"] = [[5, "asc"]];

    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var gos = {};
        for (var i=0; i < data.length; i++) {
            if(filter(data[i])) {
                datatable.push(go_data_to_table(data[i], i));
                gos[data[i]['go']['id']] = true;
            }
        }
        set_up_header(prefix + '_go_table', datatable.length, 'entry', 'entries', Object.keys(gos).length, 'Gene Ontology term', 'Gene Ontology terms');

        options["oLanguage"] = {"sEmptyTable": message};
        options["aaData"] = datatable;

        if(Object.keys(gos).length == 0) {
            $("#" + prefix + "_go").hide();
            $("#" + prefix + "_subsection").hide();
        }
    }

	$("#" + prefix + "_go_table_analyze").hide();

    return create_table(prefix + "_go_table", options);
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
	.selector("node[category='FOCUS']")
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
