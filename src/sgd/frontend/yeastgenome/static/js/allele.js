$(document).ready(function() {

	$.getJSON('/backend/allele/' + allele['sgdid']  + '/phenotype_details', function(data) {
	    var phenotype_table = create_phenotype_table(data);
  	    create_download_button("phenotype_table_download", phenotype_table, allele['display_name'] + "_phenotype_annotations");
	});

        $.getJSON('/backend/allele/' + allele['sgdid']  + '/interaction_details', function(data) {
            var interaction_table = create_interaction_table(data);
            create_download_button("interaction_table_download", interaction_table, allele['display_name'] + "_interaction_annotations");
	    create_analyze_button("interaction_table_analyze", interaction_table, "<a href='' class='gene_name'>" + allele['display_name'] + "</a> interactors", true);
        });
        
});


function create_interaction_table(data) {
    var options = {};
    if("Error" in data) {
        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];

        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}];

        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(interaction_data_to_table(data[i], i, 1));
            genes[data[i]["locus2"]["id"]] = true;
            genes[data[i]["locus1"]["id"]] = true;
        }

	set_up_header('interaction_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": "No interaction data for " + allele['display_name']};
        options["aaData"] = datatable;
    }
	    
    return create_table("interaction_table", options);

}


function create_phenotype_table(data) {
  	var datatable = [];
	var phenotypes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
		phenotypes[data[i]["phenotype"]["id"]] = true;
	}

    set_up_header('phenotype_table', datatable.length, 'entry', 'entries', Object.keys(phenotypes).length, 'phenotype', 'phenotypes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bSearchable":false, "bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
    options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + allele['display_name']};
	options["aaData"] = datatable;

    return create_table("phenotype_table", options);
}


