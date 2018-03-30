$(document).ready(function() {
    $.getJSON('/backend/dataset/' + dataset['geo_id'], function(data) {
        var dataset_table = create_dataset_conditions_table(data);
        $("#dataset_conditions_table_analyze").hide();
        $("#dataset_conditions_table_download").hide();
    });
});

function create_dataset_conditions_table(data) {
    console.log(data);
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {'sWidth': '250px'}, null];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var data_sets = {}
        for (var i=0; i < data.datasetcolumns.length; i++) {
            datatable.push(dataset_data_to_table(data.datasetcolumns[i]));
            data_sets[data.datasetcolumns[i]['geo_id']] = true;
        }

        set_up_header('dataset_conditions_table', datatable.length, 'entry', 'entries', Object.keys(data_sets).length, 'dataset', 'datasets');
        console.log(datatable);

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {'sWidth': '250px'}, null];
        options["oLanguage"] = {"sEmptyTable": "No data for " + data['geo_id']};
        options["aaData"] = datatable;
        options["scrollX"] = true;
    }

    return create_table("dataset_conditions_table", options);
}