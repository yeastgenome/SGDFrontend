
$(document).ready(function() {

	$.getJSON(chemical_details_link, function(data) {
	  	var phenotype_table = create_phenotype_table(data);
	  	create_analyze_button("phenotype_table_analyze", phenotype_table, analyze_link, analyze_filename, true);
  	    create_download_button("phenotype_table_download", phenotype_table, download_table_link, download_filename);
	});

    //Hack because footer overlaps - need to fix this.
	add_footer_space("phenotype");

});

function create_phenotype_table(data) {
  	var datatable = [];
	var phenotypes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
		phenotypes[data[i]["bioconcept"]["id"]] = true;
	}

  	$("#phenotype_header").html(data.length);
  	$("#phenotype_subheader").html(Object.keys(phenotypes).length);
    if(Object.keys(phenotypes).length == 1) {
        $("#phenotype_subheader_type").html("phenotype");
    }
    else {
        $("#phenotype_subheader_type").html("phenotypes");
    }
    if(datatable.length == 1) {
        $("#phenotype_header_type").html("entry for ");
    }
    else {
        $("#phenotype_header_type").html("entries for ");
    }


	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {"sWidth": "250px"}, null];
    options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + display_name};
	options["aaData"] = datatable;

    return create_table("phenotype_table", options);
}
