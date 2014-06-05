
$(document).ready(function() {

	$.getJSON(domain_details_link, function(data) {
	  	var annotation_table = create_domain_table(data);
	  	create_analyze_button("domain_table_analyze", annotation_table, analyze_link, analyze_filename, true);
  	    create_download_button("domain_table_download", annotation_table, download_table_link, download_filename);
	});

});

function create_domain_table(data) {
	var datatable = [];

    var bioents = {};
    for (var i=0; i < data.length; i++) {
        datatable.push(domain_data_to_table(data[i]));
        bioents[data[i]['locus']['id']] = true;
    }

    set_up_header('domain_table', datatable.length, 'entry', 'entries', Object.keys(bioents).length, 'gene', 'genes');

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[2, "asc"], [4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No genes associated with domain " + display_name + "."};

    return create_table("domain_table", options);
}