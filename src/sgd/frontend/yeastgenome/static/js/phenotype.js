
$(document).ready(function() {

	$.getJSON('/backend/phenotype/' + phenotype['id'] + '/locus_details', function(data) {
	  	var phenotype_table = create_phenotype_table(data);
	  	create_analyze_button("phenotype_table_analyze", phenotype_table, "<a href='" + phenotype['link'] + "' class='gene_name'>" + phenotype['display_name'] + "</a> genes", true);
  	    create_download_button("phenotype_table_download", phenotype_table, phenotype['display_name'] + "_annotations");
	});

});

function create_phenotype_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[2, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            genes[data[i]["locus"]["id"]] = true;
        }

        set_up_header('phenotype_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[2, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
        options["oLanguage"] = {"sEmptyTable": "No annotations for " + phenotype['display_name']};
        options["aaData"] = datatable;
    }
    return create_table("phenotype_table", options);
}