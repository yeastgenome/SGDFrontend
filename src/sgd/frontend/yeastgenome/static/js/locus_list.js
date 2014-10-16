
$(document).ready(function() {

    var gene_table = create_gene_table(locus_list['locii']);
    create_download_button("gene_list_table_download", gene_table, locus_list['list_name'] + '_locii');
    $("#gene_list_table_analyze").hide()

});

function create_gene_table(data) {
    var gene_table = null;
    if(data != null && data.length > 0) {
	    var datatable = [];

        for (var i=0; i < data.length; i++) {
            datatable.push(gene_data_to_table(data[i]));
        }

        $("#gene_list_table_header").html(data.length);

        var options = {};
	    options["bPaginate"] = true;
	    options["aaSorting"] = [[3, "asc"]];
	    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null];
	    options["aaData"] = datatable;

        gene_table = create_table("gene_list_table", options);
	}
	return gene_table;
}
