
$(document).ready(function() {

  	$.getJSON(references_this_week_link, function(data) {
        set_up_reference_list("references_header", "references_list", "references_message", "references_wrapper", "export_references", download_link, "citations_for_week_of_" + a_week_ago, data);
    });

	//Hack because footer overlaps - need to fix this.
	add_footer_space("references");

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

    for (var i=0; i < data.length; i++) {
        var ref_entry = $("#" + data[i]['id']);
        if(data[i]['literature_details']['primary'].length + data[i]['literature_details']['additional'].length + data[i]['literature_details']['reviews'].length > 0) {
            var lit_list = document.createElement("blockquote");
            lit_list.appendChild(create_gene_list(data[i]['literature_details']['primary'], "Primary Literature For: "));
            lit_list.appendChild(create_gene_list(data[i]['literature_details']['additional'], "Additional Literature For: "));
            lit_list.appendChild(create_gene_list(data[i]['literature_details']['reviews'], "Review Literature For: "));
            ref_entry.append(lit_list);
        }
    }
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