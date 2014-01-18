
$(document).ready(function() {
  	$.getJSON(phenotype_details_link, function(data) {
  	    var phenotype_table = create_phenotype_table(data);
        create_download_button("phenotype_table_download", phenotype_table, download_table_link, download_table_filename);
        $("#phenotype_table_analyze").hide();
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
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {'sWidth': '250px'}, null];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var phenotypes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            phenotypes[data[i]['bioconcept']['id']] = true;
        }

        $("#phenotype_header").html(data.length);
        $("#phenotype_subheader").html(Object.keys(phenotypes).length);
        $("#phenotype_subheader_type").html('phenotypes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {'sWidth': '250px'}, null];
        options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("phenotype_table", options);
}