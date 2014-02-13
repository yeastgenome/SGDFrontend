
$(document).ready(function() {

	$.getJSON(domain_details_link, function(data) {
	  	var annotation_table = create_domain_table("domains_table", "No known domains for " + display_name + ".", data);
	  	create_analyze_button("domains_table_analyze", annotation_table, analyze_link, analyze_filename, true);
  	    create_download_button("domains_table_download", annotation_table, download_table_link, download_filename);
	});

    //Hack because footer overlaps - need to fix this.
	add_footer_space("domains");

});

function create_domain_table(div_id, message, data) {
	var datatable = [];

    var bioents = {};
    for (var i=0; i < data.length; i++) {
        datatable.push(domain_data_to_table(data[i]));
        bioents[data[i]['protein']['id']] = true;
    }

    $("#domains_header").html(datatable.length);
    $("#domains_subheader").html(Object.keys(bioents).length);

    if(datatable.length == 1) {
        $("#domains_header_type").html('entry for');
    }
    else {
        $("#domains_header_type").html('entries for');
    }
    if(Object.keys(bioents).length == 1) {
        $("#domains_subheader_type").html('gene');
    }
    else {
        $("#domains_subheader_type").html('genes');
    }

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[2, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": message};

    return create_table(div_id, options);
}