var ev_table;
var cy;
  	
function set_up_overview_table(venn_id, save_button_id, phys_button_id, gen_button_id, intersect_button_id, union_button_id, 
	analyze_link, bioent_display_name, bioent_format_name, bioent_link, style, data) {
	var r = data['gen_circle_size'];
  	var s = data['phys_circle_size'];
  	var x = data['circle_distance'];
  	var A = data['num_gen_interactors'];
  	var B = data['num_phys_interactors'];
  	var C = data['num_both_interactors'];
  			
  	//Colors chosen as colorblind safe from http://colorbrewer2.org/.
	var stage = draw_venn_diagram(venn_id, r, s, x, A, B, C, style['left_color'], style['right_color']);
	stage.toDataURL({
       	width: 350,
       	height: 350,
       	callback: function(dataUrl) {
       		document.getElementById(save_button_id).href = dataUrl.replace("image/png", "image/octet-stream");
        }
     });
			
    if(r == 0) {
    	document.getElementById(intersect_button_id).disabled = true; 
    	document.getElementById(phys_button_id).disabled = true; 
    }
    if(s == 0) {
    	document.getElementById(intersect_button_id).disabled = true; 
    	document.getElementById(gen_button_id).disabled = true; 
    }
    if(x == r+s+1) {
    	document.getElementById(intersect_button_id).disabled = true; 
    }
    	
    //set up Analyze buttons
    document.getElementById(phys_button_id).onclick = function() {analyze_phys(analyze_link, bioent_display_name, bioent_format_name, bioent_link)};
    document.getElementById(gen_button_id).onclick = function() {analyze_gen(analyze_link, bioent_display_name, bioent_format_name, bioent_link)};
    document.getElementById(intersect_button_id).onclick = function() {analyze_phys_gen_intersect(analyze_link, bioent_display_name, bioent_format_name, bioent_link)};
    document.getElementById(union_button_id).onclick = function() {analyze_phys_gen_union(analyze_link, bioent_display_name, bioent_format_name, bioent_link)};
}

function set_up_evidence_table(header_id, table_id, download_button_id, analyze_button_id, download_link, download_table_filename, 
	analyze_link, bioent_display_name, bioent_format_name, bioent_link, data) { 
	var datatable = [];
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
  			
		var bioent1 = create_link(evidence['bioent1']['display_name'], evidence['bioent1']['link'])
		var bioent2 = create_link(evidence['bioent2']['display_name'], evidence['bioent2']['link'])
			
		var experiment = '';
		if(evidence['experiment'] != null) {
			//experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);
			experiment = evidence['experiment']['display_name'];
		}
		var phenotype = '';
		if(evidence['phenotype'] != null) {
			//phenotype = create_link(evidence['phenotype']['display_name'], evidence['phenotype']['link']);
			phenotype = evidence['phenotype']['display_name'];
		}
		var modification = '';
		if(evidence['modification'] != null) {
			modification = evidence['modification'];
  		}
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
  		datatable.push([bioent1, evidence['bioent1']['format_name'], bioent2, evidence['bioent2']['format_name'], evidence['interaction_type'], experiment, evidence['annotation_type'], evidence['direction'], modification, phenotype, evidence['source'], reference, evidence['note']])
  	}
  	document.getElementById(header_id).innerHTML = '(' + data.length + ')';
  		         
    var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[2, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}]		
	options["aaData"] = datatable;
  				
  	ev_table = $('#' + table_id).dataTable(options);
  		
  	document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};
  	document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link)};
}
  		
function analyze_phys_gen_intersect(analyze_link, bioent_display_name, bioent_format_name, bioent_link) {
	var bioent_sys_names = [];

	var gen_bioent_sys_names = {};
	var data = ev_table.fnGetData();
	for (var i=0,len=data.length; i<len; i++) { 
		var ev_type = data[i][4];
		if(ev_type == 'Genetic') {
			var sys_name = data[i][3];
			gen_bioent_sys_names[sys_name] = true;
		}
	}	

	for (var i=0,len=data.length; i<len; i++) { 
		var ev_type = data[i][4];
		if(ev_type == 'Physical') {
			var sys_name = data[i][3];
			if(sys_name in gen_bioent_sys_names) {
				bioent_sys_names.push(sys_name);
			}
		}
	}	
	post_to_url(analyze_link, {'bioent_display_name': bioent_display_name, 'bioent_format_name': bioent_format_name, 'bioent_link': bioent_link, 
										'bioent_ids': bioent_sys_names, 'list_type': 'Intersection Interactors'});
}
	
function analyze_phys(analyze_link, bioent_display_name, bioent_format_name, bioent_link) {
	var bioent_sys_names = [];

	var data = ev_table.fnGetData();
	for (var i=0,len=data.length; i<len; i++) { 
		var ev_type = data[i][4];
		if(ev_type == 'Physical') {
			var sys_name = data[i][3];
			bioent_sys_names.push(sys_name);
		}
	}	
	post_to_url(analyze_link, {'bioent_display_name': bioent_display_name, 'bioent_format_name': bioent_format_name, 'bioent_link': bioent_link, 
										'bioent_ids': bioent_sys_names, 'list_type': 'Physical Interactors'});
}
	
function analyze_gen(analyze_link, bioent_display_name, bioent_format_name, bioent_link) {
	var bioent_sys_names = [];

	var data = ev_table.fnGetData();
	for (var i=0,len=data.length; i<len; i++) { 
		var ev_type = data[i][4];
		if(ev_type == 'Genetic') {
			var sys_name = data[i][3];
			bioent_sys_names.push(sys_name);
		}
	}	
	post_to_url(analyze_link, {'bioent_display_name': bioent_display_name, 'bioent_format_name': bioent_format_name, 'bioent_link': bioent_link,
										 'bioent_ids': bioent_sys_names, 'list_type': 'Genetic Interactors'});
}
	
function analyze_phys_gen_union(analyze_link, bioent_display_name, bioent_format_name, bioent_link) {
	var bioent_sys_names = [];

	var data = ev_table.fnGetData();
	for (var i=0,len=data.length; i<len; i++) { 
		var sys_name = data[i][3];
		bioent_sys_names.push(sys_name);
	}	
	post_to_url(analyze_link, {'bioent_display_name': bioent_display_name, 'bioent_format_name': bioent_format_name, 'bioent_link': bioent_link,
										 'bioent_ids': bioent_sys_names, 'list_type': 'Interactors'});
}
	
function analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link) {
	var bioent_sys_names = [];

	var data = ev_table._('tr', {"filter": "applied"});
	for (var i=0,len=data.length; i<len; i++) { 
		var sys_name = data[i][3];
		bioent_sys_names.push(sys_name);
	}	
		
	var list_type = 'Interactors'
	var search_term = ev_table.fnSettings().oPreviousSearch.sSearch
	if(search_term != '') {
		list_type = list_type + ' filtered by "' + search_term + '"'
	}
			
	post_to_url(analyze_link, {'bioent_display_name': bioent_display_name, 'bioent_format_name': bioent_format_name, 'bioent_link': bioent_link,
										 'bioent_ids': bioent_sys_names, 'list_type': list_type});
}

function setup_slider(div_id, min, max, current, slide_f) {
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
	return slider;
}

function setup_interaction_cytoscape_vis(graph_id, 
				phys_slider_id, gen_slider_id, intersect_slider_id, union_slider_id,  
				phys_radio_id, gen_radio_id, intersect_radio_id, union_radio_id,
				style, data) {
					
	cy = setup_cytoscape_vis(graph_id, style, data);
	
	function f() {
		filter_cy(phys_slider_id, gen_slider_id, intersect_slider_id, union_slider_id,  
				phys_radio_id, gen_radio_id, intersect_radio_id, union_radio_id);
	}
			
	setup_slider(union_slider_id, data['min_evidence_cutoff'], Math.min(data['max_evidence_cutoff'], 10), Math.min(data['max_evidence_cutoff'], 3), f);
	setup_slider(phys_slider_id, data['min_evidence_cutoff'], Math.min(data['max_phys_cutoff'], 10), Math.min(data['max_phys_cutoff'], 3), f);
	setup_slider(gen_slider_id, data['min_evidence_cutoff'], Math.min(data['max_gen_cutoff'], 10), Math.min(data['max_gen_cutoff'], 3), f);
	setup_slider(intersect_slider_id, data['min_evidence_cutoff'], Math.min(data['max_both_cutoff'], 10), Math.min(data['max_both_cutoff'], 3), f);
	
	document.getElementById(phys_slider_id).style.display = 'none';
	document.getElementById(gen_slider_id).style.display = 'none';
	document.getElementById(intersect_slider_id).style.display = 'none';
	
	if(data['max_phys_cutoff'] == 0) {
		document.getElementById(phys_radio_id).disabled = true;
	}
	if(data['max_gen_cutoff'] == 0) {
		document.getElementById(gen_radio_id).disabled = true;
	}
	if(data['max_both_cutoff'] == 0) {
		document.getElementById(intersect_radio_id).disabled = true;
	}
	
	function g() {
		change_scale(phys_slider_id, gen_slider_id, intersect_slider_id, union_slider_id,  
				phys_radio_id, gen_radio_id, intersect_radio_id, union_radio_id);
		filter_cy(phys_slider_id, gen_slider_id, intersect_slider_id, union_slider_id,  
				phys_radio_id, gen_radio_id, intersect_radio_id, union_radio_id);
	}
	
	document.getElementById(phys_radio_id).onclick = g;
	document.getElementById(gen_radio_id).onclick = g;
	document.getElementById(intersect_radio_id).onclick = g;
	document.getElementById(union_radio_id).onclick = g;
}

function change_scale(phys_slider_id, gen_slider_id, intersect_slider_id, union_slider_id,  
				phys_radio_id, gen_radio_id, intersect_radio_id, union_radio_id) {
					
	var all = document.getElementById(union_radio_id).checked;
	var phys = document.getElementById(phys_radio_id).checked;
	var gen = document.getElementById(gen_radio_id).checked;
	var both = document.getElementById(intersect_radio_id).checked;
	
	var prev_value;
	if(document.getElementById(union_slider_id).style.display == 'block') {
		prev_value = $("#" + union_slider_id).val();
	}
	else if(document.getElementById(phys_slider_id).style.display == 'block') {
		prev_value = $("#" + phys_slider_id).val();
	}
	else if(document.getElementById(gen_slider_id).style.display == 'block') {
		prev_value = $("#" + gen_slider_id).val();
	}
	else if(document.getElementById(intersect_radio_id).style.display == 'block') {
		prev_value = $("#" + intersect_radio_id).val();
	}
	
	if(all) {
		$("#" + union_slider_id).val(prev_value);
		document.getElementById(union_slider_id).style.display = 'block';
		document.getElementById(phys_slider_id).style.display = 'none';
		document.getElementById(gen_slider_id).style.display = 'none';
		document.getElementById(intersect_slider_id).style.display = 'none';
	}
	else if(phys) {
		$("#" + phys_slider_id).val(prev_value);
		document.getElementById(union_slider_id).style.display = 'none';
		document.getElementById(phys_slider_id).style.display = 'block';
		document.getElementById(gen_slider_id).style.display = 'none';
		document.getElementById(intersect_slider_id).style.display = 'none';
	}
	else if(gen) {
		$("#" + gen_slider_id).val(prev_value);
		document.getElementById(union_slider_id).style.display = 'none';
		document.getElementById(phys_slider_id).style.display = 'none';
		document.getElementById(gen_slider_id).style.display = 'block';
		document.getElementById(intersect_slider_id).style.display = 'none';
	}
	else if(both) {
		$("#" + intersect_slider_id).val(prev_value);
		document.getElementById(union_slider_id).style.display = 'none';
		document.getElementById(phys_slider_id).style.display = 'none';
		document.getElementById(gen_slider_id).style.display = 'none';
		document.getElementById(intersect_slider_id).style.display = 'block';
	}
}

function filter_cy(phys_slider_id, gen_slider_id, intersect_slider_id, union_slider_id,  
				phys_radio_id, gen_radio_id, intersect_radio_id, union_radio_id) {
	var all = document.getElementById(union_radio_id).checked;
	var phys = document.getElementById(phys_radio_id).checked;
	var gen = document.getElementById(gen_radio_id).checked;
	var both = document.getElementById(intersect_radio_id).checked;
	
    if(all) {
    	var cutoff = $("#" + union_slider_id).val();
        cy.elements("node[evidence >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("edge[evidence >= " + cutoff + "]").css({'visibility': 'visible',});
        
        cy.elements("node[evidence < " + cutoff + "]").css({'visibility': 'hidden',});
        cy.elements("edge[evidence < " + cutoff + "]").css({'visibility': 'hidden',});
    }
    else if(phys) {
        var cutoff = $("#" + phys_slider_id).val();
        cy.elements("node[physical >=  " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("edge[physical >=  " + cutoff + "]").css({'visibility': 'visible',});
        
        cy.elements("node[physical < " + cutoff + "]").css({'visibility': 'hidden',});
        cy.elements("edge[physical < " + cutoff + "]").css({'visibility': 'hidden',});
    }
    else if(gen) {
    	var cutoff = $("#" + gen_slider_id).val();
        cy.elements("node[genetic >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("edge[genetic >= " + cutoff + "]").css({'visibility': 'visible',});
        
        cy.elements("node[genetic < " + cutoff + "]").css({'visibility': 'hidden',});
        cy.elements("edge[genetic < " + cutoff + "]").css({'visibility': 'hidden',});
    }
    else if(both) {
    	var cutoff = $("#" + intersect_slider_id).val();
        cy.elements("node[physical >= " + cutoff + "][genetic >= " + cutoff + "]").css({'visibility': 'visible',});
        cy.elements("edge[physical >= " + cutoff + "][genetic >= " + cutoff + "]").css({'visibility': 'visible',});
        
        cy.elements("node[physical < " + cutoff + "]").css({'visibility': 'hidden',});
        cy.elements("edge[physical < " + cutoff + "]").css({'visibility': 'hidden',});
        
        cy.elements("node[genetic < " + cutoff + "]").css({'visibility': 'hidden',});
        cy.elements("edge[genetic < " + cutoff + "]").css({'visibility': 'hidden',});
    }
}
