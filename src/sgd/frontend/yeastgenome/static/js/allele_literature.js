
$(document).ready(function() {

  	$.getJSON('/redirect_backend?param=allele/' + allele['sgdid'], function(data) {
  	    set_up_reference_list("allele_primary", "allele_primary_list", "allele_primary_list_empty_message", "allele_primary_list_wrapper", "allele_primary_list_download", allele['sgdid'] + "_primary_citations", data['primary_references']);
            set_up_reference_list("allele_additional", "allele_additional_list", "allele_additional_list_empty_message", "allele_additional_list_wrapper", "allele_additional_list_download", allele['sgdid'] + "_additional_citations", data['additional_references']);
  	    set_up_reference_list("allele_review", "allele_review_list", "allele_review_list_empty_message", "review_list_wrapper", "allele_review_list_download", allele['sgdid'] + "_review_citations", data['review_references']);
  	    set_up_reference_list("allele_phenotype", "allele_phenotype_list", "allele_phenotype_list_empty_message", "allele_phenotype_list_wrapper", "allele_phenotype_list_download", allele['sgdid'] + "_phenotype_citations", data['phenotype_references']);
	    set_up_reference_list("allele_interaction", "allele_interaction_list", "allele_interaction_list_empty_message", "allele_interaction_list_wrapper", "allele_interaction_list_download", allele['sgdid'] + "_interaction_citations", data['interaction_references']);
	    
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


