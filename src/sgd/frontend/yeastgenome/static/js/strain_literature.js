
$(document).ready(function() {

  	$.getJSON('/redirect_backend?param=strain/' + strain['display_name'] + '/literature_details', function(data) {
  	    set_up_reference_list("strain_phenotype", "strain_phenotype_list", "strain_phenotype_list_empty_message", "strain_phenotype_list_wrapper", "strain_phenotype_list_download", strain['display_name'] + "_phenotype_citations", data['phenotype']);
	    set_up_reference_list("strain_disease", "strain_disease_list", "strain_disease_list_empty_message", "strain_disease_list_wrapper", "strain_disease_list_download", strain['display_name'] + "_disease_citations", data['disease']);

	    set_up_reference_list("strain_regulation", "strain_regulation_list", "strain_regulation_list_empty_message", "strain_regulation_list_wrapper", "strain_regulation_list_download", strain['display_name'] + "_regulation_citations", data['regulation']);
	    set_up_reference_list("strain_ptm", "strain_ptm_list", "strain_ptm_list_empty_message", "strain_ptm_list_wrapper", "strain_ptm_list_download", strain['display_name'] + "_ptm_citations", data['ptm']);

	    set_up_reference_list("strain_funComplement", "strain_funComplement_list", "strain_funComplement_list_empty_message", "strain_funComplement_list_wrapper", "strain_funComplement_list_download", strain['display_name'] + "_funComplement_citations", data['funComplement']);

	    set_up_reference_list("strain_htp", "strain_htp_list", "strain_htp_list_empty_message", "strain_htp_list_wrapper", "strain_htp_list_download", strain['display_name'] + "_htp_citations", data['htp']);
	    
    });

});

function set_up_reference_list(header_id, list_id, message_id, wrapper_id, download_button_id, download_filename, data) {
    set_up_header(header_id, data.length, 'reference', 'references');
	set_up_references(data, list_id);

	if (data.length == 0) {
		$("#" + message_id).show();
		$("#" + wrapper_id).hide();
	}
	$("#" + download_button_id).click(function f() {
		download_citations(list_id, download_filename);
	});
}


