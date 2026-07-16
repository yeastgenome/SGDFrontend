
$(document).ready(function() {

    var data = (typeof recent_phenotype_data !== 'undefined' && recent_phenotype_data) ? recent_phenotype_data : [];

    if (typeof recent_phenotype_dates !== 'undefined' && recent_phenotype_dates) {
        $("#recent_phenotype_dates").html(recent_phenotype_dates.start + ' to ' + recent_phenotype_dates.end);
    }

    var datatable = [];
    var phenotypes = {};
    for (var i = 0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
        if (data[i]['phenotype']) {
            phenotypes[data[i]['phenotype']['id']] = true;
        }
    }

    set_up_header('recent_phenotype_table', datatable.length, 'entry', 'entries',
                  Object.keys(phenotypes).length, 'phenotype', 'phenotypes');

    // Same column layout as the locus phenotype table, but the Gene column
    // (index 2) is made visible since this page spans all genes.
    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[2, "asc"]];
    options["aoColumns"] = [
        {"bSearchable": false, "bVisible": false},  // 0 Evidence ID
        {"bSearchable": false, "bVisible": false},  // 1 Analyze ID
        null,                                        // 2 Gene (visible)
        {"bSearchable": false, "bVisible": false},  // 3 Gene Systematic Name
        null,                                        // 4 Phenotype
        null,                                        // 5 Experiment Type
        {"bVisible": false},                         // 6 Experiment Type Category
        null,                                        // 7 Mutant Information
        null,                                        // 8 Strain Background
        null,                                        // 9 Chemical
        {"sWidth": "250px"},                         // 10 Details
        null                                         // 11 Reference
    ];
    options["oLanguage"] = {"sEmptyTable": "No phenotype annotations added recently."};
    options["aaData"] = datatable;
    options["scrollX"] = true;

    create_table("recent_phenotype_table", options);
    $("#recent_phenotype_table_buttons").hide();
});
