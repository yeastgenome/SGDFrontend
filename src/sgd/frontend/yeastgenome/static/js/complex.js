
$(document).ready(function() {

    $.getJSON('/redirect_backend?param=complex/' + complex['complex_accession'], function(data) {

//	document.getElementById("summary_paragraph").innerHTML = data['description'] + "<p></p>" + data['properties']

	var analyze_genes = []
        var complex_table = create_complex_table(data, analyze_genes);
	create_analyze_button_with_list(
            "complex_subunit_gene_analyze",
            analyze_genes,
	    "<a href='/complex/" + complex['complex_accession'] + "' class='gene_name'>" + complex['complex_accession'] + "</a> Complex Subunits",
            true
        );
	
        if(data != null && data["graph"]["nodes"].length > 1) {
            var _categoryColors = {
                'protein': '#1f77b4',
                'small molecule': '#1A9E77',
                'subcomplex': '#E6AB03',
                'small molecule': '#7d0df3',
                'other subunit': '#d62728'
            };
            views.network.render(data["graph"], _categoryColors, "j-complex");
        } else {                                                                                                   
            hide_section("diagram");                                                                              
        } 
        
        if (data != null && data["network_graph"]["nodes"].length > 1) {
            var _categoryColors = {
                'FOCUS': 'black',
                'GO': '#2ca02c',
                'subunit': '#1f77b4',
                'complex': '#E6AB03'
            };
            var filters = {
                ' All': function(d) { return true; },
                ' GO Terms': function(d) {
                    var acceptedCats = ['FOCUS', 'GO', 'complex'];
                    return acceptedCats.includes(d.category);
                },
                ' Subunits': function(d) {
                    var acceptedCats = ['FOCUS', 'subunit', 'complex'];
                    return acceptedCats.includes(d.category);
                },
            }
            views.network.render(data["network_graph"], _categoryColors, "j-complex-network", filters, true);            
        } else {
            hide_section("network");
        }
    });

});

function create_complex_table(data, analyze_genes) {
    var evidence = data['subunit'];
    var datatable = [];
    var subunits = {};
    for (var i = 0; i < evidence.length; i++) {
        datatable.push(complex_subunit_data_to_table(evidence[i]));
        subunits[evidence[i]["display_name"]] = true;
	if (evidence[i]["link"].includes("/locus/")) {
	    analyze_genes.push(evidence[i]["dbentity_id"].toString());
	}   
    }

    set_up_header(
        "complex_table",
        datatable.length,
        "entry",
        "entries",
        Object.keys(subunits).length,
        "subunit",
        "subunits"
    );

    var options = {};
    options["bPaginate"] = false;
    options["bDestroy"] = true;
    options["aoColumns"] = [
        null,
        null,
        null
    ];
    options["aaData"] = datatable;
    options["oLanguage"] = {
        sEmptyTable: "No subunits for this complex???."
    };

  return create_table("complex_table", options);
}
