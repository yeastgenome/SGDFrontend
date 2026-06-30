
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

    // GO-CAMs subsection in the Gene Ontology section. Reveal it only for the
    // complexes that actually have GO-CAM models annotating them (the endpoint
    // returns the models that annotate the complex; mirrors the Complex GO tab
    // and the Locus Summary Page, redmine 6631).
    $.getJSON('/redirect_backend?param=complex/' + complex['complex_accession'] + '/go_cams', function(models) {
        if (models && models.length > 0) {
            $("#gocams_subsection").show();
            render_gocams(models);
        }
    });

});

// Render the GO-CAM viewer. Mirrors render_gocams() in complex_go.js: a pull-down
// appears only when there is more than one model, and the <go-gocam-viewer> is
// replaced (not mutated) on each switch so every model gets a clean first-render fit.
function render_gocams(models) {
    var $viewer = $("#gocam_viewer");
    var $link = $("#gocam_link");
    var $select = $("#gocam_select");
    var $title = $("#gocam_title");

    var show_model = function(model) {
        var $fresh = $("<go-gocam-viewer>")
            .attr({
                "id": "gocam_viewer",
                "show-legend": "true",
                "gocam-id": model.model_id
            })
            .css({ "display": "block", "width": "100%" });
        $viewer.replaceWith($fresh);
        $viewer = $fresh;
        // Always label the displayed model by title, so single-model complexes
        // (no dropdown) still show which GO-CAM this is.
        $title.text(model.title);
        $link.attr("href", model.gocam_url);
    };

    if (models.length > 1) {
        $select.empty();
        for (var i = 0; i < models.length; i++) {
            $select.append($("<option>").val(i).text(models[i].title));
        }
        $select.off("change").on("change", function() {
            show_model(models[parseInt($(this).val(), 10)]);
        });
        $("#gocam_select_wrap").show();
    }
    else {
        $("#gocam_select_wrap").hide();
    }

    show_model(models[0]);
}

function create_complex_table(data, analyze_genes) {
    var evidence = data['subunit'];
    var datatable = [];
    var subunits = {};
    for (var i = 0; i < evidence.length; i++) {
        datatable.push(complex_subunit_data_to_table(evidence[i]));
        subunits[evidence[i]["display_name"]] = true;
	if (evidence[i]["link"].includes("/locus/") && evidence[i]["dbentity_id"] != null) {
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
