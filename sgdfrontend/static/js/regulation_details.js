var cy;

function set_up_details_table(header_id, table_id, wrapper_id, message_id, download_button_id, analyze_button_id, download_link, download_table_filename, 
	analyze_link, bioent_display_name, bioent_format_name, bioent_link, data, analyze_name) { 
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
  				
  		var ev_table = $('#' + table_id).dataTable(options);
  		
  		document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};
  		document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, analyze_name, ev_table, 3)};
    }
}

function setup_regulation_cytoscape_vis(graph_id, style, data) {			
	cy = setup_cytoscape_vis(graph_id, style, data);
}