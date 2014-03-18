
$(document).ready(function() {

	$.getJSON(ec_number_details_link, function(data) {
	  	var annotation_table = create_ec_number_table(data);
	  	create_analyze_button("gene_list_table_analyze", annotation_table, analyze_link, analyze_filename, true);
  	    create_download_button("gene_list_table_download", annotation_table, download_table_link, download_filename);
	});

    //Hack because footer overlaps - need to fix this.
	add_footer_space("annotations");

});

function create_ec_number_table(data) {
	var datatable = [];

    for (var i=0; i < data.length; i++) {
        datatable.push(gene_data_to_table(data[i]['bioentity']['locus']));
    }

    $("#gene_list_table_header").html(data.length);

    var options = {};
	options["bPaginate"] = false;
	options["aaSorting"] = [[3, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null];
	options["aaData"] = datatable;

    return create_table("gene_list_table", options);
}