
$(document).ready(function() {

    $.getJSON('/redirect_backend?param=complex/' + complex['complex_accession'], function(data) {
	
	if (data["process"].length > 0) {
	    var complex_bp_go_table = create_go_table("complex_bp", data["process"]);
            create_download_button("complex_bp_go_table_download", complex_bp_go_table, complex['complex_accession'] + "_complex_bp_go");
	}
	if (data["function"].length > 0) {
	    var complex_mf_go_table = create_go_table("complex_mf", data["function"]);
            create_download_button("complex_mf_go_table_download", complex_mf_go_table, complex['complex_accession'] +"_complex_mf_go");
	}
	if (data["component"].length > 0) {
	    var complex_cc_go_table = create_go_table("complex_cc", data["component"]);
            create_download_button("complex_cc_go_table_download", complex_cc_go_table, complex['complex_accession'] +"_complex_cc_go");
	}

	all_data = [];
	var p = data["process"];
	for (var i=0; i < p.length; i++) {
	    all_data.push(go_data_to_table(p[i], i));
	}
	var f = data["function"];
        for (var i=0; i < f.length; i++) {
            all_data.push(go_data_to_table(f[i], i));
	}
	var c = data["component"];
        for (var i=0; i < c.length; i++) {
            all_data.push(go_data_to_table(c[i], i));
	}

	var headers = ["Evidence ID", "Analyze ID", "Complex Name",  "Complex Accession", "Qualifier", "Gene Ontology Term ID", "Gene Ontology Term ", "Aspect", "Annotation Extension", "Evidence", "Method", "Source", "Assigned On", "Reference"]
	create_download_button_no_table("complex_go_download_all", headers, all_data, complex['complex_accession'] + "_go_annotations")

	//if (data != null && data["go_network_graph"]["nodes"].length > 1) {
	if (data["go_network_graph"]["nodes"].length > 1) {  
	    var _categoryColors = {
                'FOCUS': 'black',
                'GO': '#2ca02c',
                'complex': '#E6AB03'
            };
	    views.network.render(data["go_network_graph"], _categoryColors, "j-complex-network");
        } else {
            hide_section("network");
        }


    });

    // GO-CAMs -- embed the GO Consortium <go-gocam-viewer>, driven by the GO-CAM
    // model(s) of this complex's protein subunits. Mirrors the Locus Summary Page
    // GO-CAM display (see functional_networks.js / go_details.js, redmine 6631).
    // Hide the section if the complex has none.
    $.getJSON('/redirect_backend?param=complex/' + complex['complex_accession'] + '/go_cams', function(models) {
        if (models && models.length > 0) {
            render_gocams(models);
        }
        else {
            hide_section("gocams");
        }
    }).fail(function() {
        hide_section("gocams");
    });

});

// Render the GO-CAM viewer for this complex. Mirrors render_gocams() in
// go_details.js: a pull-down appears only when there is more than one model, and
// the <go-gocam-viewer> is replaced (not mutated) on each switch so every model
// gets a clean first-render fit.
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

function create_go_table(prefix, data) {
    var options = {};
    options["aoColumns"] = [
        {"bSearchable":false, "bVisible":false,"aTargets":[0],"mData":0}, // evidence_id
        {"bSearchable":false, "bVisible":false,"aTargets":[1],"mData":1}, // analyze_id
        {"bSearchable":false, "bVisible":false,"aTargets":[2],"mData":2}, // complex name
        {"bSearchable":false, "bVisible":false,"aTargets":[3],"mData":3}, // complex accession
        {"aTargets":[4],"mData":4},                                       // qualifier       
	{"bSearchable":false, "bVisible":false,"aTargets":[5],"mData":5}, // gene ontology term id
        {"aTargets":[6],"mData":6},                                       // gene ontology term
        {"bSearchable":false, "bVisible":false,"aTargets":[7],"mData":7}, // aspect
        {"aTargets":[8],"mData":8},                                      // annotation_extension
        {"aTargets":[9],"mData":9},                                       // evidence
	{"bSearchable":false, "bVisible":false, "aTargets":[10],"mData":9}, // annotation type
        {"aTargets":[11],"mData":11},                                     // source
        {"aTargets":[12],"mData":12},                                     // assigned on
        {"aTargets":[13],"mData":13}                                      // reference
    ];
    options["bPaginate"] = true;
    options["aaSorting"] = [[5, "asc"]];
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var gos = {};
        for (var i=0; i < data.length; i++) {    
            datatable.push(go_data_to_table(data[i], i));
	    gos[data[i]['go']['id']] = true;
	    //console.log(prefix + ": " + data[i]["go"]["display_name"])
        }
	set_up_header(prefix + '_go_table', datatable.length, 'entry', 'entries', Object.keys(gos).length, 'Gene Ontology term', 'Gene Ontology terms');
	
	options["oLanguage"] = {"sEmptyTable": ''};
        options["aaData"] = datatable;

        if(Object.keys(gos).length == 0) {
            $("#" + prefix + "_go").hide();
            $("#" + prefix + "_subsection").hide();
        }
    }
    $("#" + prefix + "_go_table_analyze").hide();
    return create_table(prefix + "_go_table", options);

}

