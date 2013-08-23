

function set_up_reference_list(header_id, list_id, message_id, wrapper_id, download_button_id, download_link, download_filename, data) {
	document.getElementById(header_id).innerHTML = data.length;
	set_up_references(data, list_id);
	if (data.length == 0) {
		$("#" + message_id).removeClass("hide");
		$("#" + wrapper_id).addClass("hide");
	}
	document.getElementById(download_button_id).onclick = function f() {
		download_citations(list_id, download_link, download_filename)
	};
}
