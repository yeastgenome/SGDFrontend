$(document).ready(function() {

	$.getJSON('/backend/allele/' + allele['sgdid']  + '/phenotype_details', function(data) {
	    var phenotype_table = create_phenotype_table(data);
  	    create_download_button("phenotype_table_download", phenotype_table, allele['display_name'] + "_phenotype_annotations");
	});

        $.getJSON('/backend/allele/' + allele['sgdid']  + '/interaction_details', function(data) {
            var interaction_table = create_interaction_table(data, allele['name']['display_name']);
            create_download_button("interaction_table_download", interaction_table, allele['name']['display_name'] + "_interaction_annotations");
	    create_analyze_button("interaction_table_analyze", interaction_table, "<a href='' class='gene_name'>" + allele['name']['display_name'] + "</a> interactors", true);
        });
    
        $.getJSON('/backend/allele/' + allele['sgdid']  + '/network_graph', function(data) {

                if (data != null && data["nodes"].length > 1) {

                    has_interaction = 0
                    has_pheno = 0
                    for (var i = 0; i < data["nodes"].length; i++) {
                        var row = data["nodes"][i]
                        if (row["category"] == 'INTERACTION') {
                            has_interaction++;
                        }
                        if (row["category"] == 'PHENOTYPE') {
                            has_pheno++;
                        }
                    }

                    var _categoryColors = {
                        'FOCUS': 'black',
                        'ALLELE': '#7d0df3'
                    };

                    var filters = {
                        ' All': function(d) { return true; }
                    };

                    var categoryCount = 0;
                    if (has_interaction > 0) {
                        _categoryColors['INTERACTION'] = '#2ca02c';
                        filters[' Interactions'] = function(d) {
                            var acceptedCats = ['FOCUS', 'INTERACTION', 'ALLELE'];
                            return acceptedCats.includes(d.category);
                        }
                        categoryCount++;
                    }
                    if (has_pheno > 0) {
                        _categoryColors['PHENOTYPE'] = '#1f77b4';
                        filters[' Phenotypes'] = function(d) {
                            var acceptedCats = ['FOCUS', 'PHENOTYPE', 'ALLELE'];
                            return acceptedCats.includes(d.category);
                        }
                        categoryCount++;
                    }
		    if (categoryCount < 2) {
                        filters = {}
                    }
                    views.network.render(data, _categoryColors, "j-allele-network", filters, true);
                } else {
                    hide_section("network");
                }

        });
    
});


function create_interaction_table(data, this_allele) {
    var options = {};
    if("Error" in data) {
        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];

        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}];

        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
	var k = 0;
        for (var i=0; i < data.length; i++) {
	    var alleles = data[i]["alleles"];
            if (alleles.length > 0) {
                 for (var j = 0; j < alleles.length; j++) {
                     var allele = alleles[j];
                     var allele1_name = allele["allele1_name"];
                     var allele2_name = allele["allele2_name"];
		     if (allele1_name != this_allele && allele2_name != this_allele) {
			 continue
		     }
                     var allele_pair = "<a href='/allele/" + allele1_name + "' target='_new'>" + allele1_name + "</a>";
                     if (allele2_name != '') {
                         allele_pair = allele_pair + ", " + "<a href='/allele/" + allele2_name + "' target='_new'>" + allele2_name + "</a>";
                     }
                     datatable.push(genetic_interaction_data_to_table(data[i], k++, allele_pair, allele["sga_score"], allele["pvalue"]));
                 }
            }
            else {
                datatable.push(genetic_interaction_data_to_table(data[i], k++, '', '', ''));
            }
            genes[data[i]["locus2"]["id"]] = true;
            genes[data[i]["locus1"]["id"]] = true;
        }

	set_up_header('interaction_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}];
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


