function set_up_evidence_table(header_id, go_header_id, table_id, message_id, wrapper_id, download_button_id, download_table_filename, method,
                               download_link, data) {
	var datatable = [];
	var format_name_to_id = {};

	for (var i=0; i < data.length; i++) {
		var evidence = data[i];

        if(evidence['method'] == method) {
            format_name_to_id[evidence['bioconcept']['display_name']] = evidence['bioconcept']['id'];

            var bioent = create_link(evidence['bioentity']['display_name'], evidence['bioentity']['link']);
            var biocon = create_link(evidence['bioconcept']['display_name'], evidence['bioconcept']['link']);
            var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);

            var with_entry = null;
            var relationship_entry = null;

            for(var j=0; j < evidence['conditions'].length; j++) {
                var condition = evidence['conditions'][j];
                if(condition['role'] == 'With' || condition['role'] == 'From') {
                    var new_with_entry = create_link(condition['obj']['display_name'], condition['obj']['link']);
                    if(with_entry == null) {
                        with_entry = new_with_entry
                    }
                    else {
                        with_entry = with_entry + ', ' + new_with_entry
                    }
                }
                else if(condition['obj'] != null) {
                    var new_rel_entry = condition['role'] + ' ' + create_link(condition['obj']['display_name'], condition['obj']['link']);
                    if(relationship_entry == null) {
                        relationship_entry = new_rel_entry
                    }
                    else {
                        relationship_entry = relationship_entry + ', ' + new_rel_entry
                    }
                }

            }
            var icon = create_note_icon(i, relationship_entry);

            var evidence_code = evidence['code'];
            if(with_entry != null) {
                evidence_code = evidence_code + ' with ' + with_entry;
            }

            var qualifier = evidence['qualifier'];
            if(qualifier == 'involved in' || qualifier == 'enables' || qualifier == 'part of') {
                qualifier = '';
            }

            datatable.push([icon, bioent, evidence['bioentity']['format_name'], biocon, qualifier, evidence_code, evidence['source'], evidence['date_created'], reference, relationship_entry]);
        }
  	}

    if(datatable.length == 0) {
        document.getElementById(message_id).style.display = "block";
  		document.getElementById(wrapper_id).style.display = "none";
  		document.getElementById(header_id).innerHTML = 0;
  		document.getElementById(go_header_id).innerHTML = 0;
    }
    else {
        document.getElementById(header_id).innerHTML = datatable.length;
        document.getElementById(go_header_id).innerHTML = Object.keys(format_name_to_id).length;

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bSortable":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
        options["aaData"] = datatable;

        setup_datatable_highlight();
        ev_table = $('#' + table_id).dataTable(options);
        ev_table.fnSearchHighlighting();

        document.getElementById(download_button_id).onclick = function() {download_table(ev_table, download_link, download_table_filename)};

        $('#' + download_button_id).removeAttr('disabled');
    }
}
  		
