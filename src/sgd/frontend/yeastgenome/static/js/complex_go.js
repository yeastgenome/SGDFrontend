
$(document).ready(function() {

    $.getJSON('/backend/complex/' + complex['complex_accession'], function(data) {

	console.log("Populating go tables..")
	
	if (data["process"].length > 1) {
	    var complex_bp_go_table = create_go_table("complex_bp", data["process"]);
            create_download_button("complex_bp_go_table_download", complex_bp_go_table, complex['complex_accession'] + "_complex_bp_go");
	}
	if (data["function"].length > 1) {
	    var complex_mf_go_table = create_go_table("complex_mf", data["function"]);
            create_download_button("complex_mf_go_table_download", complex_mf_go_table, complex['complex_accession'] +"_complex_mf_go");
	}
	if (data["component"].length > 1) {
	    var complex_cc_go_table = create_go_table("complex_cc", data["component"]);
            create_download_button("complex_cc_go_table_download", complex_cc_go_table, complex['complex_accession'] +"_complex_cc_go");
	}

    });

});

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
        {"aTargets":[8],"mData":12},                                      // annotation_extension
        {"aTargets":[9],"mData":8},                                       // evidence
	{"bSearchable":false, "bVisible":false, "aTargets":[10],"mData":9}, // method
        {"aTargets":[11],"mData":10},                                     // source
        {"aTargets":[12],"mData":11},                                     // assigned on
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
	    console.log(data[i]["locus"]["display_name"])
	    console.log(data[i]["locus"]["format_name"])
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

