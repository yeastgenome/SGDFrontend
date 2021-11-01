
$(document).ready(function() {

    $.getJSON('/backend/complex/' + complex['complex_accession'], function(data) {

        var complex_table = create_complex_table(data);

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

	if (data["process"].length > 1) {
	    var complex_bp_go_table = create_go_table("complex_bp", "No manually curated biological process terms for " + complex['format_name'], data["process"]);
            create_download_button("complex_bp_go_table_download", complex_bp_go_table, complex['display_name'] + "_complex_bp_go");
	}
	if (data["function"].length > 1) {
	    var complex_mf_go_table = create_go_table("complex_mf", "No manually curated molecular function termsfor " + complex['format_name'], data["function"]);
            create_download_button("complex_mf_go_table_download", complex_mf_go_table, complex['display_name'] +"_complex_mf_go");
	}
	if (data["component"].length > 1) {
	    var complex_cc_go_table = create_go_table("complex_cc", "No manually curated cellular component termsfor " + complex['format_name'], data["component"]);
            create_download_button("complex_cc_go_table_download", complex_cc_go_table, complex['display_name'] +"_complex_cc_go");
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

function create_go_table(prefix, message, data) {
    var options = {};
    options["aoColumns"] = [
        {"bSearchable":false, "bVisible":false,"aTargets":[0],"mData":0}, //evidence_id
        {"bSearchable":false, "bVisible":false,"aTargets":[1],"mData":1}, //analyze_id
        {"bSearchable":false, "bVisible":false,"aTargets":[2],"mData":2}, // complex name
        {"bSearchable":false, "bVisible":false,"aTargets":[3],"mData":3}, // complex accession
        {"aTargets":[4],"mData":6}, //gene ontology term  ----> qualifier       
	{"bSearchable":false, "bVisible":false,"aTargets":[5],"mData":5}, //gene ontology term id
        {"aTargets":[6],"mData":4}, //qualifier ----> gene ontology term
        {"bSearchable":false, "bVisible":false,"aTargets":[7],"mData":7}, //aspect
        {"aTargets":[8],"mData":12}, //evidence ----> annotation_extension
        {"aTargets":[9],"mData":8}, //method  ----> evidence
	{"bSearchable":false, "bVisible":false, "aTargets":[10],"mData":9}, //source  ----> method
        {"aTargets":[11],"mData":10}, //assigned on ----> source
        {"aTargets":[12],"mData":11}, //annotation_extension ----> assigned on
        {"aTargets":[13],"mData":13} // reference
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
	    console.log(data[i]["locus"]["display_name"])
	    console.log(data[i]["locus"]["format_name"])
        }
	set_up_header(prefix + '_go_table', datatable.length, 'entry', 'entries', Object.keys(gos).length, 'Gene Ontology term', 'Gene Ontology terms');
	
	options["oLanguage"] = {"sEmptyTable": message};
        options["aaData"] = datatable;

        if(Object.keys(gos).length == 0) {
            $("#" + prefix + "_go").hide();
            $("#" + prefix + "_subsection").hide();
        }
    }
    $("#" + prefix + "_go_table_analyze").hide();
    return create_table(prefix + "_go_table", options);

}
    
function create_complex_table(data) {
    var evidence = data['subunit'];
    var datatable = [];
    var subunits = {};
    for (var i = 0; i < evidence.length; i++) {
        datatable.push(complex_subunit_data_to_table(evidence[i]));
        subunits[evidence[i]["display_name"]] = true;
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
