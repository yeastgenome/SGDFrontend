
$(document).ready(function() {

	$.getJSON('/backend/allele/' + allele['sgdid']  + '/phenotype_details', function(data) {
	    var phenotype_table = create_phenotype_table(data);
  	    create_download_button("phenotype_table_download", phenotype_table, allele['display_name'] + "_phenotype_annotations");
	});


        
});

function create_phenotype_table(data) {
  	var datatable = [];
	var phenotypes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
		phenotypes[data[i]["phenotype"]["id"]] = true;
	}

    set_up_header('allele_phenotype_table', datatable.length, 'entry', 'entries', Object.keys(phenotypes).length, 'phenotype', 'phenotypes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bSearchable":false, "bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
    options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + allele['display_name']};
	options["aaData"] = datatable;

    return create_table("allele_phenotype_table", options);
}


