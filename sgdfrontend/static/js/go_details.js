var ev_table;
var format_name_to_id = new Object();

function set_up_evidence_table(header_id, phenotype_header_id, table_id, download_button_id, download_link, download_table_filename, data) { 
	var datatable = [];
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
		
		format_name_to_id[evidence['bioconcept']['display_name']] = evidence['bioconcept']['id']

		var bioent = create_link(evidence['bioentity']['display_name'], evidence['bioentity']['link'])
		var biocon = create_link(evidence['bioconcept']['display_name'], evidence['bioconcept']['link']);
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
  		
  		var with_entry = null;
  		for(var j=0; j < evidence['with'].length; j++) {
  			var entry = evidence['with'][j];
  			if(with_entry == null) {
  				with_entry = create_link(entry['obj']['display_name'], entry['obj']['link']) 
  			}
  			else {
  				with_entry = with_entry + ', ' + create_link(entry['obj']['display_name'], entry['obj']['link']) 
  			}
  			
  		}
		var from_entry = null;
  		for(var j=0; j < evidence['from'].length; j++) {
  			var entry = evidence['with'][j];
  			if(from_entry == null) {
  				from_entry = create_link(entry['obj']['display_name'], entry['obj']['link']) 
  			}
  			else {
  				from_entry = from_entry + ', ' + create_link(entry['obj']['display_name'], entry['obj']['link']) 
  			}
  		}
  		var evidence_code = evidence['code'];
  		if(with_entry != null) {
  			evidence_code = evidence_code + ' with ' + with_entry;
  		}
  		if(from_entry != null) {
  			evidence_code = evidence_code + ' from ' + from_entry;
  		}
  		
  		datatable.push([bioent, evidence['bioentity']['format_name'], biocon, evidence['go_aspect'], evidence['method'], evidence_code, null, evidence['source'], reference]);
  	}
  	document.getElementById(header_id).innerHTML = data.length;
  	var total_interactors = Object.keys(format_name_to_id).length;
  	document.getElementById(phenotype_header_id).innerHTML = total_interactors;
  		         
    var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[2, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, reference];
	options["aaData"] = datatable;
  
   	setup_datatable_highlight();				
  	ev_table = $('#' + table_id).dataTable(options);
  	ev_table.fnSearchHighlighting();
  	  		
  	document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};

	$('#' + download_button_id).removeAttr('disabled'); 
}
  		
