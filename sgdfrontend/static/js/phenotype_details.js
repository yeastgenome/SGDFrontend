
$(document).ready(function() {
  	$.getJSON(phenotype_details_link, function(data) {
  	    var phenotype_table = create_phenotype_table(data);
        create_download_button("evidence_table_download", phenotype_table, download_table_link, download_table_filename);
  	});

    //Get resources
	$.getJSON(phenotype_resources_link, function(data) {
	  	set_up_resources("mutant_resource_list", data['Mutant Resources']);
	  	set_up_resources("phenotype_resource_list", data['Phenotype Resources']);
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function create_phenotype_table(data) {
    var phenotype_table = null;

	var datatable = [];
	var phenotypes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
		phenotypes[data[i]['bioconcept']['id']] = true;
	}

  	$("#evidence_header").html(data.length);
  	$("#phenotype_header").html(Object.keys(phenotypes).length);

  	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {'sWidth': '250px'}, null];
	options["aaData"] = datatable;

    return create_table("evidence_table", options);
}