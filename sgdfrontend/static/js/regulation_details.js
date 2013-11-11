var cy;
var target_table;
var regulator_table;
var format_name_to_id = new Object();
var filter_used_for_go = '';
var filter_message;
function update_filter_used() {
	filter_used_for_go = target_table.fnSettings().oPreviousSearch.sSearch;
	filter_message.style.display = "none";
}

function set_up_binding_site(list_id, data) {
	var list = document.getElementById(list_id);
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

function set_up_target_table(header_id, regulators_gene_header, table_id, filter_message_id, download_button_id, analyze_button_id, download_link, download_table_filename, 
	analyze_link, bioent_display_name, bioent_format_name, bioent_link, target_button_id, data) { 

	var datatable = [];
	var self_interacts = false;
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
  			
		var bioent1 = create_link(evidence['bioentity1']['display_name'], evidence['bioentity1']['link'])
		var bioent2 = create_link(evidence['bioentity2']['display_name'], evidence['bioentity2']['link'])
		
		format_name_to_id[evidence['bioentity1']['format_name']] = evidence['bioentity1']['id']
		format_name_to_id[evidence['bioentity2']['format_name']] = evidence['bioentity2']['id']
			
		var experiment = '';
		if(evidence['experiment'] != null) {
			//experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);
			experiment = evidence['experiment']['display_name'];
		}
		var strain = '';
		if(evidence['strain'] != null) {
			//strain = create_link(evidence['strain']['display_name'], evidence['strain']['link']);
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
  		datatable.push([bioent1, evidence['bioentity1']['format_name'], bioent2, evidence['bioentity2']['format_name'], experiment, conditions, strain, evidence['source'], reference])
  	}
  	  	
  	document.getElementById(header_id).innerHTML = data.length;
  	document.getElementById(header_id).innerHTML = data.length;
  	var total_interactors = Object.keys(format_name_to_id).length;
  	if(!self_interacts){
  		total_interactors = total_interactors - 1;
  	}
  	document.getElementById(regulators_gene_header).innerHTML = total_interactors;
  	
  	if (data.length == 0) {
  		document.getElementById(wrapper_id).style.display = "none";
  		document.getElementById(message_id).style.display = "block";
  	}
  	else {
    	var options = {};
		options["bPaginate"] = true;
		options["aaSorting"] = [[2, "asc"]];
		options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null]		
		options["aaData"] = datatable;
  				
  		setup_datatable_highlight();
  		target_table = $('#' + table_id).dataTable(options);
  		target_table.fnSearchHighlighting();
  		
  		filter_message = document.getElementById(filter_message_id);
		target_table.bind("filter", function() {
			var search = target_table.fnSettings().oPreviousSearch.sSearch;
			if(search != filter_used_for_go) {
				filter_message.style.display = "block";
			}
			else {
				filter_message.style.display = "none";
			}
		});
  		
  		document.getElementById(download_button_id).onclick = function() {download_table(target_table, download_link, download_table_filename)};
  		document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Targets', target_table, 3, format_name_to_id)};
		document.getElementById(target_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Targets', target_table, 3, format_name_to_id)};
    	document.getElementById(target_button_id).removeAttribute('disabled');
    }
}

function set_up_regulator_table(header_id, targets_gene_header, table_id, download_button_id, analyze_button_id, download_link, download_table_filename, 
	analyze_link, bioent_display_name, bioent_format_name, bioent_link, regulator_button_id, data) { 
	var datatable = [];
	var self_interacts = false;
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
  			
		var bioent1 = create_link(evidence['bioentity1']['display_name'], evidence['bioentity1']['link'])
		var bioent2 = create_link(evidence['bioentity2']['display_name'], evidence['bioentity2']['link'])
		
		format_name_to_id[evidence['bioentity1']['format_name']] = evidence['bioentity1']['id']
		format_name_to_id[evidence['bioentity2']['format_name']] = evidence['bioentity2']['id']
		
		if(evidence['bioentity1']['id'] == evidence['bioentity2']['id']) {
			self_interacts = true;
		}
			
		var experiment = '';
		if(evidence['experiment'] != null) {
			//experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);
			experiment = evidence['experiment']['display_name'];
		}
		var strain = '';
		if(evidence['strain'] != null) {
			//strain = create_link(evidence['strain']['display_name'], evidence['strain']['link']);
			strain = evidence['strain']['display_name'];
		}
  		var reference = '';
		if(evidence['reference'] != null) {
			reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
		}
  		var conditions = '';
		if(evidence['conditions'].length> 0) {
			conditions = evidence['conditions'][0];
		}
  		datatable.push([bioent2, evidence['bioentity2']['format_name'], bioent1, evidence['bioentity1']['format_name'], experiment, conditions, strain, evidence['source'], reference])
  	}
  	
  	document.getElementById(header_id).innerHTML = data.length;
  	var total_interactors = Object.keys(format_name_to_id).length;
  	if(!self_interacts){
  		total_interactors = total_interactors - 1;
  	}
  	document.getElementById(targets_gene_header).innerHTML = total_interactors;
  	
  	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[2, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null]		
	options["aaData"] = datatable;
  				
  	setup_datatable_highlight();
  	regulator_table = $('#' + table_id).dataTable(options);
  	regulator_table.fnSearchHighlighting();
  		
  	document.getElementById(download_button_id).onclick = function() {download_table(regulator_table, download_link, download_table_filename)};
  	document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Regulators', regulator_table, 3, format_name_to_id)};
	document.getElementById(regulator_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Regulators', regulator_table, 3, format_name_to_id)};
	document.getElementById(regulator_button_id).removeAttribute('disabled');
}

function set_up_range_sort() {
	jQuery.fn.dataTableExt.oSort['range-desc'] = function(x,y) {
		x = x.split("-");
		y = y.split("-");
		
		x0 = parseInt(x[0]);
		y0 = parseInt(y[0]);
		
		return (x0 > y0) ? -1 : ((x0 < y0) ? 1 : 0);
		
	};
		
	jQuery.fn.dataTableExt.oSort['range-asc'] = function(x,y) {
		
		x = x.split("-");
		y = y.split("-");
		
		x0 = parseInt(x[0]);
		y0 = parseInt(y[0]);
		
		return (x0 < y0) ? -1 : ((x0 > y0) ? 1 : 0);
		
	};
}

function set_up_domains_table(header_id, table_id, download_button_id, download_link, download_table_filename, data) { 
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
  		datatable.push([bioent, coord_range, domain, description, evidence['source']]);
  	}
  	
  	document.getElementById(header_id).innerHTML = data.length;
  	
  	set_up_range_sort();
  	
  	var options = {};
	options["bPaginate"] = false;
	options["aaSorting"] = [[1, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null]		
	options["aaData"] = datatable;
  				
  	setup_datatable_highlight();
  	var domain_table = $('#' + table_id).dataTable(options);
  	domain_table.fnSearchHighlighting();
  		
  	document.getElementById(download_button_id).onclick = function() {download_table(domain_table, download_link, download_table_filename)};
  
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

var evidence_max;
var evidence_min;
var target_max;
var regulator_max;

function setup_regulation_cytoscape_vis(graph_id, 
				all_slider_id, target_slider_id, regulator_slider_id,  
				all_radio_id, target_radio_id, regulator_radio_id,
				style, data) {
	function f() {
		filter_cy(all_slider_id, target_slider_id, regulator_slider_id,
			all_radio_id, target_radio_id, regulator_radio_id);
	}
	
	cy = setup_cytoscape_vis(graph_id, style, data, f);
			
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