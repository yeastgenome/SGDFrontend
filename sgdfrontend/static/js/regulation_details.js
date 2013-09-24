var cy;
var target_table;
var regulator_table;

function set_up_overview(summary_paragraph_id, reference_list_id, diagram_id, save_button_id, 
	analyze_target_id, analyze_regulator_id, analyze_link, bioent_display_name, bioent_format_name, bioent_link, style, data) {
	if('paragraph' in data) {
		document.getElementById(summary_paragraph_id).innerHTML = data['paragraph']['text'];
		references = data['paragraph']['references'];
		set_up_references(references, reference_list_id);
	}
	
	var stage = draw_side_bar_diagram(diagram_id, data['target_count'], data['regulator_count'], style['left_color'], style['right_color']);
	stage.toDataURL({
       	width: 500,
       	height: 120,
       	callback: function(dataUrl) {
       		document.getElementById(save_button_id).href = dataUrl.replace("image/png", "image/octet-stream");
        }
     });
     
     
    if(data['target_count'] == 0) {
    	document.getElementById(analyze_target_id).setAttribute('disabled', 'disabled'); 
    }
    if(data['regulator_count'] == 0) {
    	document.getElementById(analyze_regulator_id).setAttribute('disabled', 'disabled');  
    }

    //set up Analyze buttons
	document.getElementById(analyze_target_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Targets', target_table, 3)};
	document.getElementById(analyze_regulator_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Regulators', regulator_table, 3)};
}

function set_up_binding_site(wrapper_id, message_id, list_id, data) {
	var list = document.getElementById(list_id);
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
		
		var a = document.createElement('a');
		a.href = "http://yetfasco.ccbr.utoronto.ca/MotViewLong.php?PME_sys_qf2=" + evidence['motif_id']
		a.target = "_blank";
		var img = document.createElement('img');
		img.src = evidence['img_url'];
		a.appendChild(img);
		list.appendChild(a);
	}
	
	if(data.length == 0) {
		document.getElementById(wrapper_id).style.display = "none";
		document.getElementById(message_id).style.display = "block";
	}
}

function set_up_target_table(header_id, table_id, wrapper_id, message_id, download_button_id, analyze_button_id, download_link, download_table_filename, 
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
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
  		datatable.push([bioent1, evidence['bioent1']['format_name'], bioent2, evidence['bioent2']['format_name'], experiment, evidence['conditions'], evidence['source'], reference])
  	}
  	
  	document.getElementById(header_id).innerHTML = data.length;
  	
  	if (data.length == 0) {
  		document.getElementById(wrapper_id).style.display = "none";
  		document.getElementById(message_id).style.display = "block";
  	}
  	else {
    	var options = {};
		options["bPaginate"] = true;
		options["aaSorting"] = [[2, "asc"]];
		options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null]		
		options["aaData"] = datatable;
  				
  		target_table = $('#' + table_id).dataTable(options);
  		
  		document.getElementById(download_button_id).onclick = function() {download_table(target_table, download_link, download_table_filename)};
  		document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Targets', target_table, 3)};
    }
}

function set_up_regulator_table(header_id, table_id, wrapper_id, message_id, download_button_id, analyze_button_id, download_link, download_table_filename, 
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
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
  		datatable.push([bioent1, evidence['bioent1']['format_name'], bioent2, evidence['bioent2']['format_name'], experiment, evidence['conditions'], evidence['source'], reference])
  	}
  	
  	document.getElementById(header_id).innerHTML = data.length;
  	
  	if (data.length == 0) {
  		document.getElementById(wrapper_id).style.display = "none";
  		document.getElementById(message_id).style.display = "block";
  	}
  	else {
    	var options = {};
		options["bPaginate"] = true;
		options["aaSorting"] = [[2, "asc"]];
		options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null]		
		options["aaData"] = datatable;
  				
  		regulator_table = $('#' + table_id).dataTable(options);
  		
  		document.getElementById(download_button_id).onclick = function() {download_table(regulator_table, download_link, download_table_filename)};
  		document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Regulators', regulator_table, 3)};
    }
}

function set_up_domains_table(header_id, table_id, wrapper_id, message_id, download_button_id, download_link, download_table_filename, data) { 
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
			
		var description = null;
		if(evidence['domain']['interpro_description'] != null) {
			description = evidence['domain']['interpro_description'];
		}
		else if(evidence['domain']['description'] != null) {
			description = evidence['domain']['description'];
		}
  		datatable.push([bioent, coord_range, domain, description, evidence['source']]);
  	}
  	
  	document.getElementById(header_id).innerHTML = data.length;
  	
  	if (data.length == 0) {
  		document.getElementById(wrapper_id).style.display = "none";
  		document.getElementById(message_id).style.display = "block";
  	}
  	else {
    	var options = {};
		options["bPaginate"] = false;
		options["aaSorting"] = [[1, "asc"]];
		options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, null, null, null, null]		
		options["aaData"] = datatable;
  				
  		var domain_table = $('#' + table_id).dataTable(options);
  		
  		document.getElementById(download_button_id).onclick = function() {download_table(domain_table, download_link, download_table_filename)};
    }
}