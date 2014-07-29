
$(document).ready(function() {
    $("#expression_table_analyze").hide();
    var expression_table = create_expression_table(bioitems);
    create_download_button("expression_table_download", expression_table, download_table_link, display_name + '_datasets');
});

function create_expression_table(data) {
    var options = {
        'bPaginate': true,
        'aaSorting': [[1, "asc"]],
        'aoColumns': [
            {"bSearchable":false, "bVisible":false}, //Evidence ID
            null, //Dataset
            null, //Description
            null, //Tags
            null, //Number of Conditions
            null //Reference
            ]
    }
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var geo_ids = {};
        var evidence_ids = {};
        for (var i=0; i < data.length; i++) {
            if(!(data[i]['pcl_filename'] in evidence_ids)) {
                datatable.push(dataset_datat_to_table(data[i], i));
                evidence_ids[data[i]['pcl_filename']] = true;
                geo_ids[data[i]['geo_id']] = true;
            }
        }

        set_up_header('expression_table', datatable.length, 'dataset', 'datasets');

        options["oLanguage"] = {"sEmptyTable": "No expression data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("expression_table", options);
}