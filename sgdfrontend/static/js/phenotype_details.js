var ev_table;

function set_up_evidence_table(header_id, phenotype_header_id, table_id, download_button_id, download_link, download_table_filename, data) { 
	var datatable = [];
	var format_name_to_id = new Object();
	
	var has_chemical = false;
	var has_allele = false;
	var has_reporter = false;

	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
		
		format_name_to_id[evidence['bioconcept']['format_name']] = evidence['bioconcept']['id']
		
		var icon = create_note_icon('note' + i, evidence['note'])
		
		var bioent = create_link(evidence['bioentity']['display_name'], evidence['bioentity']['link'])
			
		var experiment = '';
		if(evidence['experiment'] != null) {
			//experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);
			experiment = evidence['experiment']['display_name'];
		}
		
		var strain = '';
		if(evidence['strain'] != null) {
			strain = evidence['strain']['display_name'];
		}
		
		var chemical = '';
		if(evidence['chemical'] != null) {
			has_chemical = true;
			if(evidence['chemical']['amount'] != null) {
				chemical = evidence['chemical']['amount'] + ' ' + evidence['chemical']['display_name'];
			}
			else {
				chemical = evidence['chemical']['display_name'];
			}
			var chemical_icon = create_note_icon('chemical_icon' + i, evidence['chemical']['note']);
			if(chemical_icon != '') {
				chemical = chemical + ' ' + chemical_icon;
			}
		}
		
		var allele = '';
		if(evidence['allele'] != null) {
			has_allele = true;
			allele = evidence['allele']['display_name'];
			var allele_icon = create_note_icon('allele_icon' + i, evidence['allele']['note']);
			if(allele_icon != '') {
				allele = allele + ' ' + allele_icon;
			}
		}
		
		var reporter = '';
		if(evidence['reporter'] != null) {
			has_reporter = true;
			reporter = evidence['reporter']['display_name'];
			var reporter_icon = create_note_icon('reporter_icon' + i, evidence['reporter']['note']);
			if(reporter_icon != '') {
				reporter = reporter + ' ' + reporter_icon;
			}
		}
		
		var biocon = create_link(evidence['bioconcept']['display_name'], evidence['bioconcept']['link']);
		
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
  		
  		datatable.push([icon, bioent, evidence['bioentity']['format_name'], biocon, experiment, evidence['mutant_type'], strain, chemical, allele, reporter, reference, evidence['note']]);
  	}
  	document.getElementById(header_id).innerHTML = data.length;
  	var total_interactors = Object.keys(format_name_to_id).length;
  	document.getElementById(phenotype_header_id).innerHTML = total_interactors;
  		         
    var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, 'bSortable': false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, {"bSearchable":has_chemical, "bVisible":has_chemical}, {"bSearchable":has_allele, "bVisible":has_allele}, {"bSearchable":has_reporter, "bVisible":has_reporter}, null, {"bSearchable":false, "bVisible":false}];
	options["aaData"] = datatable;
  
   	setup_datatable_highlight();				
  	ev_table = $('#' + table_id).dataTable(options);
  	ev_table.fnSearchHighlighting();
  	  		
  	document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};

	$('#' + download_button_id).removeAttr('disabled'); 
}
  		
