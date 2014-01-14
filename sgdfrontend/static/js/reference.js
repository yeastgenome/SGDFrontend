$(document).ready(function() {
	//Get evidence data
  	$.getJSON(interaction_details_link, function(data) {
  		var header_id = "interaction_header";
  		var evidence_gene_header_id = "interaction_gene_header";
  		var table_id = "interaction_table";
  		var download_button_id = "interaction_table_download";
  		var analyze_button_id = "interaction_table_analyze";

  		var message_id = "interaction_message";
  		var wrapper_id = "interaction_wrapper";

  		if(data.length > 0) {
  			set_up_interaction_table(header_id, evidence_gene_header_id, table_id, download_button_id, analyze_button_id,
  			download_table_link, annotation_download_filename,
  			analyze_table_link,  annotation_analyze_filename, data);
  		}
  		else {
  			document.getElementById(message_id).style.display = "block";
  			document.getElementById(wrapper_id).style.display = "none";
  			document.getElementById(header_id).innerHTML = 0;
  			document.getElementById(evidence_gene_header_id).innerHTML = 0;
  		}

  	});
});

function set_up_interaction_table(header_id, interactors_gene_header_id, table_id, download_button_id, analyze_button_id, download_link, download_table_filename,
	analyze_link, analyze_filename, data) {
	var format_name_to_id = new Object();
	var datatable = [];
	var self_interacts = false;
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];

		format_name_to_id[evidence['bioentity1']['format_name']] = evidence['bioentity1']['id']
		format_name_to_id[evidence['bioentity2']['format_name']] = evidence['bioentity2']['id']

		if(evidence['bioentity1']['id'] == evidence['bioentity2']['id']) {
			self_interacts = true;
		}

		var icon;
		if(evidence['note'] != null) {
			icon = "<a href='#' data-dropdown='drop" + i + "'><i class='icon-info-sign'></i></a><div id='drop" + i + "' class='f-dropdown content medium' data-dropdown-content><p>" + evidence['note'] + "</p></div>"
		}
		else {
			icon = null;
		}

		var bioent1 = create_link(evidence['bioentity1']['display_name'], evidence['bioentity1']['link'])
		var bioent2 = create_link(evidence['bioentity2']['display_name'], evidence['bioentity2']['link'])

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
  		var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
  		datatable.push([icon, bioent1, evidence['bioentity1']['format_name'], bioent2, evidence['bioentity2']['format_name'], evidence['interaction_type'], experiment, evidence['annotation_type'], evidence['direction'], modification, phenotype, evidence['source'], reference, evidence['note']])
  	}
  	document.getElementById(header_id).innerHTML = data.length;
  	var total_interactors = Object.keys(format_name_to_id).length;
  	if(!self_interacts){
  		total_interactors = total_interactors - 1;
  	}
  	document.getElementById(interactors_gene_header_id).innerHTML = total_interactors;

    var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[1, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}]
	options["aaData"] = datatable;

   	setup_datatable_highlight();
  	ev_table = $('#' + table_id).dataTable(options);
  	ev_table.fnSearchHighlighting();

  	document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};
  	document.getElementById(analyze_button_id).onclick = function() {analyze_table(analyze_link, analyze_filename + ' interactors', ev_table, 4, format_name_to_id)};

	document.getElementById(download_button_id).removeAttribute('disabled');
	document.getElementById(analyze_button_id).removeAttribute('disabled');
}