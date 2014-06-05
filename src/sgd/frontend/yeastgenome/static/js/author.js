
$(document).ready(function() {

  	set_up_reference_list("references_header", "references_list", "references_message", "references_wrapper", "export_references", download_link, display_name + "_citations", reference_data);

});

function set_up_reference_list(header_id, list_id, message_id, wrapper_id, download_button_id, download_link, download_filename, data) {
	$("#" + header_id).html(data.length);
	set_up_references(data, list_id);
	if (data.length == 0) {
		$("#" + message_id).show();
		$("#" + wrapper_id).hide();
	}
	$("#" + download_button_id).click(function f() {
		download_citations(list_id, download_link, download_filename);
	});
}