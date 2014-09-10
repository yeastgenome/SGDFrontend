
$(document).ready(function() {

  	get_json(references_this_week_link, function(data) {
        $("#dates").html(data['start'] + ' to ' + data['end']);
        set_up_reference_list("references", "references_list", "references_list_empty_message", "references_list_wrapper", "references_list_download", download_link, "citations_for_week_of_" + data['start'].replace('-', '_'), data['references']);
    });

});

function set_up_reference_list(header_id, list_id, message_id, wrapper_id, download_button_id, download_link, download_filename, data) {
	set_up_header(header_id, data.length, 'reference', 'references');
	set_up_references(data, list_id);
	if (data.length == 0) {
		$("#" + message_id).show();
		$("#" + wrapper_id).hide();
	}
	$("#" + download_button_id).click(function f() {
		download_citations(list_id, download_link, download_filename);
	});
}

function create_gene_list(data, header_text) {
    var primary = document.createElement("div");

    if(data.length > 0) {
        primary.style.marginTop = '-12px';
        primary.style.marginBottom = '10px';
        primary.style.color = 'gray';

        var header = document.createElement("span");
        header.innerHTML = header_text;
        primary.appendChild(header);
        for (var j=0; j < data.length; j++) {
            var a = document.createElement('a');
            a.innerHTML = data[j]['bioentity']['display_name'];
            a.href = data[j]['bioentity']['link'];
            primary.appendChild(a);

            if(j != data.length-1) {
                var comma = document.createElement('span');
                comma.innerHTML = ', ';
                primary.appendChild(comma);
            }

        }
    }
    return primary;
}