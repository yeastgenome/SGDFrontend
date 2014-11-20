/**
 * Created by kpaskov on 5/30/14.
 */

$(document).ready(function() {
    if(strain['paragraph'] != null) {
        document.getElementById("summary_paragraph").innerHTML = strain['paragraph']['text'];
        set_up_references(strain['paragraph']['references'], "summary_paragraph_reference_list");
    }
    var contig_table = create_contig_table(strain['contigs']);
    create_download_button("contig_table_download", contig_table, strain['display_name'] + "_contigs");
    $("#contig_table_analyze").hide();
});

function create_contig_table(data) {
  	var datatable = [];
    var options = {};

	for (var i=0; i < data.length; i++) {
        var contig = data[i];

        if(strain['display_name'] == 'S288C') {
            var genbank_link = '<a href="http://www.ncbi.nlm.nih.gov/nuccore/' + contig['genbank_accession'] + '">' + contig['genbank_accession'] + '</a>';
            var refseq_link = '<a href="http://www.ncbi.nlm.nih.gov/nuccore/' + contig['refseq_id'] + '">' + contig['refseq_id'] + '</a>'
            if(contig['genbank_accession'] == null) {
                genbank_link = '-';
                refseq_link = '-';
            }

            if(contig['display_name'] != 'Chromosome 2-micron') {
                datatable.push([contig['id'],
                    contig['id'],
                    '<a href="' + contig['link'] + '">' + contig['display_name'] + '</a>',
                    genbank_link,
                    refseq_link,
                    contig['length']
                ]);
            }
        }
        else {
            if(contig['reference_alignment'] != null) {
                datatable.push([contig['id'],
                    contig['id'],
                    '<a href="' + contig['link'] + '">' + contig['display_name'] + '</a>',
                    '<a href="' + contig['reference_alignment']['chromosome']['link'] + '">' + contig['reference_alignment']['chromosome']['display_name'] + '</a>: ' + contig['reference_alignment']['start'] + '...' + contig['reference_alignment']['end'],
                    contig['reference_alignment']['percent_identity'],
                    contig['reference_alignment']['alignment_length']
                ]);
            }
        }
	}

    set_up_header('contig_table', datatable.length, 'entry', 'entries');

	if (strain['display_name'] == 'S288C') {
        options["bPaginate"] = false;
	    options["aaSorting"] = [[0, "asc"]];
    }
    else {
        options["bPaginate"] = true;
	    options["aaSorting"] = [[2, "asc"]];
    }

    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null];
    options["oLanguage"] = {"sEmptyTable": "No contig data for " + strain['display_name']};
	options["aaData"] = datatable;

    return create_table("contig_table", options);
}
