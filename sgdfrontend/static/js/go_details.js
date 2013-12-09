function set_up_evidence_table(header_id, phenotype_header_id, table_id, download_button_id, download_link, download_table_filename, data) { 
	var datatable = [];
	var format_name_to_id = new Object();

	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
				
		format_name_to_id[evidence['bioconcept']['display_name']] = evidence['bioconcept']['id']

		var bioent = create_link(evidence['bioentity']['display_name'], evidence['bioentity']['link'])
		var biocon = create_link(evidence['bioconcept']['display_name'], evidence['bioconcept']['link']);
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
  		
  		var with_entry = null;
		var relationship_entry = null;

  		for(var j=0; j < evidence['conditions'].length; j++) {
  			var condition = evidence['conditions'][j];
  			if(condition['role'] == 'With' || condition['role'] == 'From') {
  				var new_with_entry = create_link(condition['obj']['display_name'], condition['obj']['link']);
	  			if(with_entry == null) {
	  				with_entry = new_with_entry
	  			}
	  			else {
	  				with_entry = with_entry + ', ' + new_with_entry
	  			}
	  		}
	  		else if(condition['obj'] != null) {
	  			var new_rel_entry = condition['role'] + ' ' + create_link(condition['obj']['display_name'], condition['obj']['link']);
	  			if(relationship_entry == null) {
  					relationship_entry = new_rel_entry
  				}
  				else {
  					relationship_entry = relationship_entry + ', ' + new_rel_entry
  				}
	  		}
  			
  		}
		var icon = create_note_icon(i, relationship_entry);

  		var evidence_code = evidence['code'];
  		if(with_entry != null) {
  			evidence_code = evidence_code + ' with ' + with_entry;
  		}
  		
  		datatable.push([icon, bioent, evidence['bioentity']['format_name'], biocon, evidence['qualifier'], evidence['method'], evidence_code, evidence['source'], evidence['date_created'], reference, relationship_entry]);
  	}
  	document.getElementById(header_id).innerHTML = data.length;
  	var total_interactors = Object.keys(format_name_to_id).length;
  	document.getElementById(phenotype_header_id).innerHTML = total_interactors;
  		         
    var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bSortable":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
	options["aaData"] = datatable;
  
   	setup_datatable_highlight();				
  	ev_table = $('#' + table_id).dataTable(options);
  	ev_table.fnSearchHighlighting();
  	  		
  	document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};

	$('#' + download_button_id).removeAttr('disabled'); 
}
  		
