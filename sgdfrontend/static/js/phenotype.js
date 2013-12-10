var ev_table;

function set_up_evidence_table(header_id, phenotype_header_id, table_id, download_button_id, download_link, download_table_filename, 
	analyze_button_id, analyze_link, bioent_display_name, bioent_format_name, bioent_link, data) {
	var format_name_to_id = {};
	var datatable = [];
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
		
		format_name_to_id[evidence['bioentity']['format_name']] = evidence['bioentity']['id'];

		var bioent = create_link(evidence['bioentity']['display_name'], evidence['bioentity']['link']);
			
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
			allele = '<br>Allele: ' + evidence['allele']['display_name'];
			var allele_icon = create_note_icon('allele_icon' + i, evidence['allele']['note']);
			if(allele_icon != '') {
				allele = allele + ' ' + allele_icon;
			}
		}

		var reporter = '';
		if(evidence['reporter'] != null) {
			reporter = 'Reporter: ' + evidence['reporter']['display_name'];
			var reporter_icon = create_note_icon('reporter_icon' + i, evidence['reporter']['note']);
			if(reporter_icon != '') {
				reporter = reporter + ' ' + reporter_icon;
			}
		}

        var note = '';
        for (var j=0; j < evidence['condition'].length; j++) {
            note = note + 'Condition: ' + evidence['condition'][j] + '<br>';
        }
        if(evidence['note'] != null) {
            note = note + 'Details: ' + evidence['note'] + '<br>';
        }
        note = note + reporter;

		var biocon = create_link(evidence['bioconcept']['display_name'], evidence['bioconcept']['link']);

  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);

  		datatable.push([bioent, evidence['bioentity']['format_name'], biocon, experiment, 'Description: ' + evidence['mutant_type'] + allele, strain, chemical, note, reference]);
  	}
  	document.getElementById(header_id).innerHTML = data.length;
  	document.getElementById(phenotype_header_id).innerHTML = Object.keys(format_name_to_id).length;
  		         
    var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[0, "asc"]];
    options["aoColumns"] = [null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null];
	options["aaData"] = datatable;
  
   	setup_datatable_highlight();				
  	ev_table = $('#' + table_id).dataTable(options);
  	ev_table.fnSearchHighlighting();
  	
  	//set up Analyze buttons
  	document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};
  	document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, bioent_display_name, bioent_format_name, bioent_link, 'Genes', ev_table, 2, format_name_to_id)};

	$('#' + download_button_id).removeAttr('disabled'); 
	$('#' + analyze_button_id).removeAttr('disabled'); 
}
