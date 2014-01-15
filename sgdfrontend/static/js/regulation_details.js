
$(document).ready(function() {

    if(target_count > 0) {
		$.getJSON(protein_domains_link, function(data) {
            var domain_table = create_domain_table(data);
            create_download_button("domains_table_download", domain_table, download_table_link, domains_table_filename);
		});
    }

    if(target_count > 0) {
	  	$.getJSON(binding_site_details_link, function(data) {
	        create_binding_site_table(data);
	    });
	}

	$.getJSON(regulation_details_link, function(data) {
  		if(target_count > 0) {
  		    var target_table = create_target_table(data["targets"]);
  		    create_analyze_button("targets_table_analyze", target_table, analyze_link, analyze_filename + ' targets', true);
  	        create_analyze_button("analyze_targets", target_table, analyze_link, analyze_filename + ' targets', false);
  	        create_download_button("targets_table_download", target_table, download_table_link, targets_table_filename);

  	        //$.getJSON(regulation_target_enrichment_link, function(enrichment_data) {
            //    var enrichment_table = create_enrichment_table("enrichment_table", target_table, enrichment_data);
            //    create_download_button("enrichment_table_download", enrichment_table, download_table_link, enrichment_table_filename);
  	        //});
  		}

  		if(regulator_count > 0) {
  		    var regulator_table = create_regulator_table(data["regulators"]);
  		    create_analyze_button("regulators_table_analyze", regulator_table, analyze_link, analyze_filename + ' targets', true);
  	        create_analyze_button("analyze_regulators", regulator_table, analyze_link, analyze_filename + ' targets', false);
  	        create_download_button("regulators_table_download", regulator_table, download_table_link, regulators_table_filename);
  		}
  	});

    $.getJSON(regulation_graph_link, function(data) {
        var graph = create_cytoscape_vis("cy", layout, graph_style, data);
        var multimax_slider = create_multimax_slider('slider', graph, data['min_evidence_cutoff'], data['max_evidence_cutoff'], slider_filter);
        create_discrete_filter('all_radio', graph, multimax_slider, all_filter, data['max_evidence_cutoff']);
        create_discrete_filter('targets_radio', graph, multimax_slider, target_filter, data['max_target_cutoff']);
        create_discrete_filter('regulators_radio', graph, multimax_slider, regulator_filter, data['max_regulator_cutoff']);
    });

});

function create_domain_table(data) {
    var domain_table = null;
    if(data != null && data.length > 0) {
        $("#domains").show();

	    var datatable = [];

        for (var i=0; i < data.length; i++) {
            datatable.push(domain_data_to_table(data[i]));
        }

        $("#domains_header").html(data.length);

        set_up_range_sort();

        var options = {};
        options["bPaginate"] = false;
        options["aaSorting"] = [[2, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null]
        options["aaData"] = datatable;

        domain_table = create_table("domains_table", options);
	}
	return domain_table;
}

function create_binding_site_table(data) {
    if(data.length > 0) {
        $("#binding").show();
	  	var list = $("#binding_motifs");
	    for (var i=0; i < data.length; i++) {
		    var evidence = data[i];

		    var a = document.createElement('a');
		    a.href = "http://yetfasco.ccbr.utoronto.ca/MotViewLong.php?PME_sys_qf2=" + evidence['motif_id']
		    a.target = "_blank";
		    var img = document.createElement('img');
		    img.src = evidence['img_url'];
		    img.className = "yetfasco";

		    a.appendChild(img);
		    list.append(a);
	    }
	}
	else {
	  	$("#navbar_binding").hide();
		$("#navbar_binding").removeAttr('data-magellan-arrival')
	}
}

function create_target_table(data) {
    var target_table = null;

	if(data.length > 0) {
	    $("#targets").show();
	  	var datatable = [];
	  	var genes = {};
	    for (var i=0; i < data.length; i++) {
		    datatable.push(regulation_data_to_table(data[i], false));
		    genes[data[i]['bioentity2']['id']] = true;
		}

  	    $("#targets_header").html(data.length);
  	    $("#targets_gene_header").html(Object.keys(genes).length);

  	    var options = {};
		options["bPaginate"] = true;
		options["aaSorting"] = [[4, "asc"]];
		options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null]
		options["aaData"] = datatable;

		target_table = create_table("targets_table", options);
  	}
    return target_table;
}

function create_regulator_table(data) {
    var regulator_table = null;

	if(data.length > 0) {
	    $("#regulators").show();
	  	var datatable = [];
	  	var genes = {};
	    for (var i=0; i < data.length; i++) {
		    datatable.push(regulation_data_to_table(data[i], true));
		    genes[data[i]['bioentity1']['id']] = true;
  	    }

  	    $("#regulators_header").html(data.length);
  	    $("#regulators_gene_header").html(Object.keys(genes).length);

  	    var options = {};
		options["bPaginate"] = true;
		options["aaSorting"] = [[2, "asc"]];
		options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null]
		options["aaData"] = datatable;

		regulator_table = create_table("regulators_table", options);
  	}
    return regulator_table;
}

function create_regulation_graph(data) {
    var graph_id = "cy";
  	var all_slider_id = "all_slider";
  	var target_slider_id = "targets_slider";
  	var regulator_slider_id = "regulators_slider";

  	var all_radio_id = "all_radio";
  	var target_radio_id = "targets_radio";
  	var regulator_radio_id = "regulators_radio";

  	var section_id = "network";
  	var section_navbar_id = "navbar_network";

  	if(data["nodes"].length > 1) {
  		cy = setup_regulation_cytoscape_vis(graph_id,
		all_slider_id, target_slider_id, regulator_slider_id,
		all_radio_id, target_radio_id, regulator_radio_id,
		layout, graph_style, data);
  	}
  	else {
  		$("#" + section_id).hide();
		$("#" + section_navbar_id).hide();
		$("#" + section_navbar_id).removeAtt('data-magellan-arrival')

		//Hack because footer overlaps - need to fix this.
		next_section = $("#regulators");
		next_section.append(document.createElement("br"));
		next_section.append(document.createElement("br"));
		next_section.append(document.createElement("br"));
		next_section.append(document.createElement("br"));
		next_section.append(document.createElement("br"));
		next_section.append(document.createElement("br"));
  	}
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

//Graph style
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
	.selector("node[class_type='TARGET'][sub_type!='FOCUS']")
	.css({
		'background-color': "#AF8DC3",
		'text-outline-color': '#888',
		'color': '#fff'
	})
	.selector("node[class_type='REGULATOR'][sub_type!='FOCUS']")
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

var evidence_max;
var evidence_min;
var target_max;
var regulator_max;

function setup_regulation_cytoscape_vis(graph_id, 
				all_slider_id, target_slider_id, regulator_slider_id,  
				all_radio_id, target_radio_id, regulator_radio_id,
				layout, style, data) {
	function f() {
		filter_cy(all_slider_id, target_slider_id, regulator_slider_id,
			all_radio_id, target_radio_id, regulator_radio_id);
	}
	
	cy = setup_cytoscape_vis(graph_id, layout, style, data, f);
			
	evidence_max = data['max_evidence_cutoff'];
	evidence_min = data['min_evidence_cutoff'];
	target_max = data['max_target_cutoff'];
	regulator_max = data['max_regulator_cutoff'];
	
	function g() {
		change_scale(all_slider_id, target_slider_id, regulator_slider_id,
			all_radio_id, target_radio_id, regulator_radio_id);
		filter_cy(all_slider_id, target_slider_id, regulator_slider_id,
			all_radio_id, target_radio_id, regulator_radio_id);
	}
	
	setup_slider(all_slider_id, evidence_min, Math.min(evidence_max, 10), Math.max(Math.min(evidence_max, 3), evidence_min), f);
	setup_slider(target_slider_id, evidence_min, Math.min(target_max, 10), Math.max(Math.min(target_max, 3), evidence_min), f);
	setup_slider(regulator_slider_id, evidence_min, Math.min(regulator_max, 10), Math.max(Math.min(regulator_max, 3), evidence_min), f);
	
	$("#" + target_slider_id).hide();
	$("#" + regulator_slider_id).show();
	
	if(data['max_target_cutoff'] < evidence_min) {
		$("#" + target_radio_id).attr('disabled', true);
	}
	if(data['max_regulator_cutoff'] < evidence_min) {
	    $("#" + regulator_radio_id).attr('disabled', true)
	}
	
	document.getElementById(all_radio_id).onclick = g;
	document.getElementById(target_radio_id).onclick = g;
	document.getElementById(regulator_radio_id).onclick = g;
}

function change_scale(all_slider_id, target_slider_id, regulator_slider_id,  
				all_radio_id, target_radio_id, regulator_radio_id) {
					
	var all = document.getElementById(all_radio_id).checked;
	var targ = document.getElementById(target_radio_id).checked;
	var reg = document.getElementById(regulator_radio_id).checked;
	
	var prev_value = 3;
	if(document.getElementById(all_slider_id).style.display == 'block') {
		prev_value = $("#" + all_slider_id).val();
	}
	else if(document.getElementById(target_slider_id).style.display == 'block') {
		prev_value = $("#" + target_slider_id).val();
	}
	else if(document.getElementById(regulator_slider_id).style.display == 'block') {
		prev_value = $("#" + regulator_slider_id).val();
	}
	
	if(all) {
		$("#" + all_slider_id).val(Math.min(evidence_max, prev_value));
		document.getElementById(all_slider_id).style.display = 'block';
		document.getElementById(target_slider_id).style.display = 'none';
		document.getElementById(regulator_slider_id).style.display = 'none';
	}
	else if(targ) {
		$("#" + target_slider_id).val(Math.min(target_max, prev_value));
		document.getElementById(all_slider_id).style.display = 'none';
		document.getElementById(target_slider_id).style.display = 'block';
		document.getElementById(regulator_slider_id).style.display = 'none';
	}
	else if(reg) {
		$("#" + regulator_slider_id).val(Math.min(regulator_max, prev_value));
		document.getElementById(all_slider_id).style.display = 'none';
		document.getElementById(target_slider_id).style.display = 'none';
		document.getElementById(regulator_slider_id).style.display = 'block';
	}
}



function filter_cy(all_slider_id, target_slider_id, regulator_slider_id,
					all_radio_id, target_radio_id, regulator_radio_id) {
						
	var all = document.getElementById(all_radio_id).checked;
	var targ = document.getElementById(target_radio_id).checked;
	var reg = document.getElementById(regulator_radio_id).checked;
		
    if(all) {
    	var cutoff;
    	if(evidence_max == evidence_min) {
    		cutoff = evidence_max;
    	}
    	else {
    		cutoff = $("#" + all_slider_id).val();
    	}
    	
        cy.elements("node[evidence >= " + cutoff + "]").css({'visibility': 'visible',});        
        cy.elements("node[evidence < " + cutoff + "]").css({'visibility': 'hidden',});
        
        cy.elements("edge[evidence >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("edge[evidence < " + cutoff + "]").css({'visibility': 'hidden',});
    }
    else if(targ) {
    	var cutoff;
    	if(target_max == evidence_min) {
    		cutoff = target_max;
    	}
    	else {
    		cutoff = $("#" + target_slider_id).val();
    	}
    	
        cy.elements("node[targ_evidence >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("node[targ_evidence < " + cutoff + "]").css({'visibility': 'hidden',});
        
        cy.elements("edge[class_type = 'TARGET'][evidence >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("edge[evidence < " + cutoff + "]").css({'visibility': 'hidden',});
        cy.elements("edge[class_type = 'REGULATOR']").css({'visibility': 'hidden',});
    }
    else if(reg) {
		var cutoff;
    	if(regulator_max == evidence_min) {
    		cutoff = regulator_max;
    	}
    	else {
    		cutoff = $("#" + regulator_slider_id).val();
    	}
    	
    	cy.elements("node[reg_evidence >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("node[reg_evidence < " + cutoff + "]").css({'visibility': 'hidden',});
        
        cy.elements("edge[class_type = 'REGULATOR'][evidence >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("edge[evidence < " + cutoff + "]").css({'visibility': 'hidden',});
        cy.elements("edge[class_type ='TARGET']").css({'visibility': 'hidden',});
    }

}