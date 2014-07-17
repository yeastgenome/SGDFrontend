
$(document).ready(function() {

    if(regulation_overview['paragraph'] != null) {
        document.getElementById("summary_paragraph").innerHTML = regulation_overview['paragraph']['text'];
        set_up_references(regulation_overview['paragraph']['references'], "summary_paragraph_reference_list");
    }

    if(target_count > 0) {
        $("#domain_table_analyze").hide();
		$.getJSON(protein_domains_link, function(data) {
            var domain_table = create_domain_table(data);
            if(domain_table != null) {
                create_download_button("domain_table_download", domain_table, download_table_link, domains_table_filename);
            }
		});
    }

    if(target_count > 0) {
	  	$.getJSON(binding_site_details_link, function(data) {
	        create_binding_site_table(data);
	    });
	}

	$.getJSON(regulation_details_link, function(data) {
  		if(target_count > 0) {
  		    var target_table = create_target_table(data);
  		    create_analyze_button("target_table_analyze", target_table, analyze_link, analyze_filename + " targets", true);
  	        create_analyze_button("analyze_targets", target_table, analyze_link, analyze_filename + " targets", false);
  	        create_download_button("target_table_download", target_table, download_table_link, targets_table_filename);

  	        $.getJSON(regulation_target_enrichment_link, function(enrichment_data) {
                var enrichment_table = create_enrichment_table("enrichment_table", target_table, enrichment_data);
                create_download_button("enrichment_table_download", enrichment_table, download_table_link, enrichment_table_filename);
                add_button_to_table('enrichment_table', 'recalculate', 'Recalculate With New Filter');
  	        });
  		}
  		else {
  	        $("#targets").hide();
            $("#domain").hide();
            $("#enrichment").hide();
  		}

  		var regulator_table = create_regulator_table(data);
  		create_analyze_button("regulator_table_analyze", regulator_table, analyze_link, analyze_filename + " targets", true);
  	    create_analyze_button("analyze_regulators", regulator_table, analyze_link, analyze_filename + " targets", false);
  	    create_download_button("regulator_table_download", regulator_table, download_table_link, regulators_table_filename);
  	});

    $.getJSON(regulation_graph_link, function(data) {
        if(data != null && data["nodes"].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, true);
            create_cy_download_button(graph, "cy_download", download_network_link, display_name + '_regulation_graph')
            var slider = create_slider("slider", graph, data["min_evidence_cutoff"], data["max_evidence_cutoff"], slider_filter);
            $("#min_evidence_count").html(data["min_evidence_cutoff"]);
            if(data["min_evidence_cutoff"] == 1) {
                $("#plural").hide();
            }
            if(data["max_target_cutoff"] >= data["min_evidence_cutoff"] && data["max_regulator_cutoff"] >= data["min_evidence_cutoff"]) {
                create_discrete_filter("all_radio", graph, slider, all_filter, data["max_evidence_cutoff"]);
                create_discrete_filter("targets_radio", graph, slider, target_filter, data["max_target_cutoff"]);
                create_discrete_filter("regulators_radio", graph, slider, regulator_filter, data["max_regulator_cutoff"]);
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

function create_domain_table(data) {
    var domain_table = null;
    if(data != null && data.length > 0) {
	    var datatable = [];
        var domains = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(domain_data_to_table(data[i]));
            domains[data[i]['domain']['id']] = true;
        }

        set_up_header('domain_table', datatable.length, 'entry', 'entries', Object.keys(domains).length, 'domain', 'domains');

        set_up_range_sort();

        var options = {};
        options["bPaginate"] = false;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null, null]
        options["aaData"] = datatable;

        domain_table = create_table("domain_table", options);
	}
	return domain_table;
}

function create_binding_site_table(data) {
    if(data.length > 0) {
        $("#binding").show();
	  	var list = $("#binding_motifs");
	    for (var i=0; i < data.length; i++) {
		    var evidence = data[i];

		    var a = document.createElement("a");
		    a.href = "http://yetfasco.ccbr.utoronto.ca/MotViewLong.php?PME_sys_qf2=" + evidence["motif_id"];
		    a.target = "_blank";
		    var img = document.createElement("img");
		    img.src = evidence["link"];
		    img.className = "yetfasco";

		    a.appendChild(img);
		    list.append(a);
	    }
	}
	else {
	    hide_section("binding");
	}
}

function create_target_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null]
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        var target_entry_count = 0;
        for (var i=0; i < data.length; i++) {
            if(data[i]["locus1"]["id"] == locus_id) {
                datatable.push(regulation_data_to_table(data[i], false));
                genes[data[i]["locus2"]["id"]] = true;
                target_entry_count = target_entry_count + 1;
            }
        }
        set_up_header('target_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null]
        options["aaData"] = datatable;
    }

	return create_table("target_table", options);
}

function create_regulator_table(data) {
    var datatable = [];
	var genes = {};
    var regulation_entry_count = 0;
	for (var i=0; i < data.length; i++) {
	    if(data[i]["locus2"]["id"] == locus_id) {
            datatable.push(regulation_data_to_table(data[i], true));
		    genes[data[i]["locus1"]["id"]] = true;
            regulation_entry_count = regulation_entry_count+1;
		}
  	}
    set_up_header('regulator_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

  	var options = {};
    options["bPaginate"] = true;
	options["aaSorting"] = [[2, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null]
	options["oLanguage"] = {"sEmptyTable": "No regulation data for " + display_name};
	options["aaData"] = datatable;

    return create_table("regulator_table", options);
}

function slider_filter(new_cutoff) {
    return "node, edge[evidence >= " + new_cutoff + "]";
}

function all_filter() {
    return "node, edge";
}

function target_filter() {
    return "node, edge[class_type = 'TARGET']";
}

function regulator_filter() {
    return "node, edge[class_type = 'REGULATOR']";
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
		'target-arrow-shape': 'triangle',
		'line-color': '#848484',
		'target-arrow-color': '#848484'
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[targ_evidence>0][sub_type!='FOCUS']")
	.css({
		'background-color': "#AF8DC3",
		'text-outline-color': '#888',
		'color': '#fff'
	})
	.selector("node[reg_evidence>0][sub_type!='FOCUS']")
	.css({
		'background-color': "#7FBF7B",
		'text-outline-color': '#888',
		'color': '#fff'
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