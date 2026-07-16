
$(document).ready(function() {

    var data = (typeof recent_go_data !== 'undefined' && recent_go_data) ? recent_go_data : [];

    if (typeof recent_go_dates !== 'undefined' && recent_go_dates) {
        $("#recent_go_dates").html(recent_go_dates.start + ' to ' + recent_go_dates.end);
    }

    var datatable = [];
    var genes = {};
    for (var i = 0; i < data.length; i++) {
        datatable.push(go_data_to_table(data[i], i));
        if (data[i]['locus']) {
            genes[data[i]['locus']['id']] = true;
        }
    }

    set_up_header('recent_go_table', datatable.length, 'annotation', 'annotations',
                  Object.keys(genes).length, 'gene', 'genes');

    // Same column layout as the locus GO table, but the Gene/Complex column
    // (index 2) is made visible since this page spans all genes.
    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[2, "asc"]];
    options["aoColumns"] = [
        {"bSearchable": false, "bVisible": false},  // 0 Evidence ID
        {"bSearchable": false, "bVisible": false},  // 1 Analyze ID
        null,                                        // 2 Gene/Complex (visible)
        {"bSearchable": false, "bVisible": false},  // 3 Systematic Name (hidden)
        null,                                        // 4 Qualifier
        {"bSearchable": false, "bVisible": false},  // 5 Gene Ontology Term ID (hidden)
        null,                                        // 6 Gene Ontology Term
        null,                                        // 7 Aspect
        null,                                        // 8 Annotation Extension
        null,                                        // 9 Evidence
        null,                                        // 10 Method
        null,                                        // 11 Source
        null,                                        // 12 Assigned On
        null                                         // 13 Reference
    ];
    options["oLanguage"] = {"sEmptyTable": "No GO annotations added recently."};
    options["aaData"] = datatable;

    create_table("recent_go_table", options);
    $("#recent_go_table_buttons").hide();
});
