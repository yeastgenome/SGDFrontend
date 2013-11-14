var ev_table;
var format_name_to_id = new Object();

function set_up_evidence_table(header_id, phenotype_header_id, table_id, download_button_id, download_link, download_table_filename, 
	analyze_button_id, analyze_link, bioent_display_name, bioent_format_name, bioent_link, data) { 
	var datatable = [];
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];
		
		format_name_to_id[evidence['bioentity']['format_name']] = evidence['bioentity']['id']
		
		var icon;
		if(evidence['note'] != null) {
			icon = "<a href='#' data-dropdown='drop" + i + "'><i class='icon-info-sign'></i></a><div id='drop" + i + "' class='f-dropdown content medium' data-dropdown-content><p>" + evidence['note'] + "</p></div>"
		}
		else {
			icon = null;
		}
		
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
			if(evidence['chemical']['amount'] != null) {
				chemical = evidence['chemical']['amount'] + ' ' + evidence['chemical']['display_name'];
			}
			else {
				chemical = evidence['chemical']['display_name'];
			}
		}
		
		var allele = '';
		if(evidence['allele'] != null) {
			allele = evidence['allele']['display_name'];
		}
		
		var reporter = '';
		if(evidence['reporter'] != null) {
			reporter = evidence['reporter']['display_name'];
		}
		
		var biocon = create_link(evidence['bioconcept']['observable'], evidence['bioconcept']['link']);
		
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
  		
  		datatable.push([icon, bioent, evidence['bioentity']['format_name'], biocon, evidence['bioconcept']['qualifier'], experiment, evidence['bioconcept']['mutant_type'], strain, chemical, allele, reporter, reference, evidence['note']]);
  	}
  	document.getElementById(header_id).innerHTML = data.length;
  	var total_interactors = Object.keys(format_name_to_id).length;
  	document.getElementById(phenotype_header_id).innerHTML = total_interactors;
  		         
    var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, 'bSortable': false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
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
