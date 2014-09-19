
$(document).ready(function() {

	$.getJSON('/backend/domain/' + domain['id'] + '/locus_details?callback=?', function(data) {
	  	var annotation_table = create_domain_table(data);
	  	create_analyze_button("domain_table_analyze", annotation_table, "<a href='" + domain['link'] + "' class='gene_name'>" + domain['display_name'] + "</a> Genes", true);
  	    create_download_button("domain_table_download", annotation_table, domain['display_name'] + "_annotations");
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
    options["oLanguage"] = {"sEmptyTable": "No genes associated with domain " + domain['display_name'] + "."};

    return create_table("domain_table", options);
}