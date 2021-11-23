$(document).ready(function() {
    if(dataset['format_name'] != null) {
        $.getJSON('/redirect_backend?param=dataset/' + dataset['format_name'], function(data) {
            var dataset_table = create_dataset_conditions_table(data);
            $("#dataset_conditions_table_analyze").hide();
            $("#dataset_conditions_table_download").hide();
        });
    }
    else {
        var dataset_table = create_dataset_conditions_table(dataset);
        $("#dataset_conditions_table_analyze").hide();
        $("#dataset_conditions_table_download").hide();
    }
});

function create_dataset_conditions_table(data) {
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

        var options = {};
        options["bPaginate"] = true;
        if(dataset['geo_id'] != null)
            options["oLanguage"] = {"sEmptyTable": "No data for " + data['geo_id']};
        else
            options["oLanguage"] = {"sEmptyTable": "No data for " + data['link'].split("/")[data['link'].split("/").length-1]};
        options["aaData"] = datatable;
        options["scrollX"] = true;
    }

    return create_table("dataset_conditions_table", options);
}
