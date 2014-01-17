
$(document).ready(function() {

	$.getJSON(phenotype_details_link, function(data) {
	  	var phenotype_table = create_phenotype_table(data);
	  	create_analyze_button("phenotype_table_analyze", phenotype_table, analyze_link, analyze_filename, true);
  	    create_download_button("phenotype_table_download", phenotype_table, download_table_link, download_filename);
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("phenotype");

});

function create_phenotype_table(data) {
	var datatable = [];
	var genes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
		genes[data[i]["bioentity"]["id"]] = true;
	}

  	$("#phenotype_header").html(data.length);
  	$("#phenotype_subheader").html(Object.keys(genes).length);
  	$("#phenotype_subheader_type").html("genes");

  	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {"sWidth": "250px"}, null];
	options["oLanguage"] = {"sEmptyTable": "No annotations for " + display_name};
	options["aaData"] = datatable;

    return create_table("phenotype_table", options);
}