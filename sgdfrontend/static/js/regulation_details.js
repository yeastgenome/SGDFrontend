
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

  	        $.getJSON(regulation_target_enrichment_link, function(enrichment_data) {
                var enrichment_table = create_enrichment_table("enrichment_table", target_table, enrichment_data);
                create_download_button("enrichment_table_download", enrichment_table, download_table_link, enrichment_table_filename);
  	        });
  		}

  		if(regulator_count > 0) {
  		    var regulator_table = create_regulator_table(data["regulators"]);
  		    create_analyze_button("regulator_table_analyze", regulator_table, analyze_link, analyze_filename + ' targets', true);
  	        create_analyze_button("analyze_regulators", regulator_table, analyze_link, analyze_filename + ' targets', false);
  	        create_download_button("regulators_table_download", regulator_table, download_table_link, regulators_table_filename);
  		}
  	});

    $.getJSON(regulation_graph_link, function(data) {
        var graph = create_cytoscape_vis("cy", layout, graph_style, data);
        var set_max = create_slider('slider', graph);
    });

});

function create_domain_table(data) {
    var domain_table = null;
    if(data != null && data.length > 0) {
	    document.getElementById("domains").style.display = "block";

	    var datatable = [];

        for (var i=0; i < data.length; i++) {
            var evidence = data[i];

            var bioent = create_link(evidence['protein']['display_name'], evidence['protein']['link'], false);
            var domain;
            if(evidence['domain']['link'] != null) {
                domain = create_link(evidence['domain']['display_name'], evidence['domain']['link'], true);
            }
            else {
                domain = evidence['domain']['display_name']
            }

            var coord_range = evidence['start'] + '-' + evidence['end'];

            var description = evidence['domain_description'];
            datatable.push([evidence['id'], bioent, coord_range, domain, description, evidence['source']]);
        }

        document.getElementById("domains_header").innerHTML = data.length;

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
        document.getElementById("binding").style.display = "block";
	  	var list = document.getElementById("binding_motifs");
	    for (var i=0; i < data.length; i++) {
		    var evidence = data[i];

		    var a = document.createElement('a');
		    a.href = "http://yetfasco.ccbr.utoronto.ca/MotViewLong.php?PME_sys_qf2=" + evidence['motif_id']
		    a.target = "_blank";
		    var img = document.createElement('img');
		    img.src = evidence['img_url'];
		    img.className = "yetfasco";
		    a.appendChild(img);
		    list.appendChild(a);
	    }
	}
	else {
	  	document.getElementById("navbar_binding").style.display = "none";
		document.getElementById("navbar_binding").removeAttribute('data-magellan-arrival')
	}
}

function create_target_table(data) {
    var target_table = null;

	if(data.length > 0) {
	    document.getElementById("targets").style.display = "block";
	  	var datatable = [];
	  	var targets = {};
	    for (var i=0; i < data.length; i++) {
		    var evidence = data[i];
		    var bioent1 = create_link(evidence['bioentity1']['display_name'], evidence['bioentity1']['link'])
		    var bioent2 = create_link(evidence['bioentity2']['display_name'], evidence['bioentity2']['link'])

		    targets[evidence['bioentity2']['id']] = true;

		    var experiment = '';
		    if(evidence['experiment'] != null) {
			    experiment = evidence['experiment']['display_name'];
		    }
		    var strain = '';
		    if(evidence['strain'] != null) {
			    strain = evidence['strain']['display_name'];
		    }
		    var conditions = '';
		    if(evidence['conditions'].length> 0) {
			    conditions = evidence['conditions'][0];
		    }
		    var reference = '';
		    if(evidence['reference'] != null) {
			    reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
		    }
  		    datatable.push([evidence['id'], evidence['bioentity2']['id'], bioent1, evidence['bioentity1']['format_name'], bioent2, evidence['bioentity2']['format_name'], experiment, conditions, strain, evidence['source'], reference])
  	    }

  	    document.getElementById("targets_header").innerHTML = data.length;
  	    document.getElementById("targets_gene_header").innerHTML = Object.keys(targets).length;

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
	    document.getElementById("regulators").style.display = "block";
	  	var datatable = [];
	  	var regulators = {};
	    for (var i=0; i < data.length; i++) {
		    var evidence = data[i];
		    var bioent1 = create_link(evidence['bioentity1']['display_name'], evidence['bioentity1']['link'])
		    var bioent2 = create_link(evidence['bioentity2']['display_name'], evidence['bioentity2']['link'])

		    regulators[evidence['bioentity1']['id']] = true;

		    var experiment = '';
		    if(evidence['experiment'] != null) {
			    experiment = evidence['experiment']['display_name'];
		    }
		    var strain = '';
		    if(evidence['strain'] != null) {
			    strain = evidence['strain']['display_name'];
		    }
		    var conditions = '';
		    if(evidence['conditions'].length> 0) {
			    conditions = evidence['conditions'][0];
		    }
		    var reference = '';
		    if(evidence['reference'] != null) {
			    reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
		    }
  		    datatable.push([evidence['id'], evidence['bioentity1']['id'], bioent1, evidence['bioentity1']['format_name'], bioent2, evidence['bioentity2']['format_name'], experiment, conditions, strain, evidence['source'], reference])
  	    }

  	    document.getElementById("regulators_header").innerHTML = data.length;
  	    document.getElementById("regulators_gene_header").innerHTML = Object.keys(regulators).length;

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
  				document.getElementById(section_id).style.display = "none";
				document.getElementById(section_navbar_id).style.display = "none";
				document.getElementById(section_navbar_id).removeAttribute('data-magellan-arrival')

				//Hack because footer overlaps - need to fix this.
				next_section = document.getElementById("regulators");
				next_section.appendChild(document.createElement("br"))
				next_section.appendChild(document.createElement("br"))
				next_section.appendChild(document.createElement("br"))
				next_section.appendChild(document.createElement("br"))
				next_section.appendChild(document.createElement("br"))
				next_section.appendChild(document.createElement("br"))
  			}
}



function setup_slider(div_id, min, max, current, slide_f) {
	if(max==min) {
		var slider = $("#" + div_id).noUiSlider({
			range: [min, min+1]
			,start: current
			,step: 1
			,handles: 1
			,connect: "lower"
			,slide: slide_f
		});
		slider.noUiSlider('disabled', true);
		var spacing =  100;
	    i = min-1
	    var value = i+1;
	    if(value >= 10) {
	    	var left = ((spacing * (i-min+1))-1)
	       	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
	    }
	    else {
	    	var left = ((spacing * (i-min+1))-.5)
			$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
		}
	}
	else {
		var slider = $("#" + div_id).noUiSlider({
			range: [min, max]
			,start: current
			,step: 1
			,handles: 1
			,connect: "lower"
			,slide: slide_f
		});
		
		var spacing =  100 / (max - min);
	    for (var i = min-1; i < max ; i=i+1) {
	    	var value = i+1;
	    	if(value >= 10) {
	    		var left = ((spacing * (i-min+1))-1)
	        	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
	    	}
	    	else {
	    		var left = ((spacing * (i-min+1))-.5)
				$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
	    	}
		}
	}
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
	
	document.getElementById(target_slider_id).style.display = 'none';
	document.getElementById(regulator_slider_id).style.display = 'none';
	
	if(data['max_target_cutoff'] < evidence_min) {
		document.getElementById(target_radio_id).disabled = true;
	}
	if(data['max_regulator_cutoff'] < evidence_min) {
		document.getElementById(regulator_radio_id).disabled = true;
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