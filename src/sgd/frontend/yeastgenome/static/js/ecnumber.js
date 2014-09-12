
$(document).ready(function() {

	$.getJSON('/backend/ecnumber/' + ecnumber['id'] + '/locus_details?callback=?', function(data) {
	  	var annotation_table = create_ecnumber_table(data);
	  	create_analyze_button("gene_list_table_analyze", annotation_table, "<a href='" + ecnumber['link'] + "' class='gene_name'>" + ecnumber['display_name'] + "</a> Genes", true);
  	    create_download_button("gene_list_table_download", annotation_table, ecnumber['format_name'].split('.').join('_') + "_annotations");
	});

});

function create_ecnumber_table(data) {
	var datatable = [];

    var bioents = {};
    for (var i=0; i < data.length; i++) {
        datatable.push([data[i]['id'], data[i]['locus']['id'], data[i]['locus']['format_name'], create_link(data[i]['locus']['display_name'], data[i]['locus']['link']), data[i]['locus']['description']]);
        bioents[data[i]['locus']['id']] = true;
    }

    set_up_header('gene_list_table', datatable.length, 'entry', 'entries', Object.keys(bioents).length, 'gene', 'genes');

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[3, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No genes associated with EC Number " + ecnumber['display_name'] + "."};

    return create_table("gene_list_table", options);
}