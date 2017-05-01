
$(document).ready(function() {
    $("#expression_table_analyze").hide();
    var tag = keyword;
    var expression_table = create_expression_table(tag['bioitems']);
    create_download_button("expression_table_download", expression_table, tag['display_name'] + '_datasets');

    $.getJSON('/backend/keywords', function(data) {
        var tag_links = [];
        for (var i=0; i < data.length; i++) {
            if(data[i]['display_name'] != tag['display_name']) {
                tag_links.push('<a href="' + data[i]['link'] + '">' + data[i]['display_name'] + '</a>');
            }
        }
        $('#other_tags_list').html(tag_links.sort(function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;}).join(' | '));
        });
});

function create_expression_table(data) {
    var tag = keyword;
    var options = {
        'bPaginate': true,
        'aaSorting': [[3, "asc"]],
        'aoColumns': [
            {"bSearchable":false, "bVisible":false}, //Evidence ID
            {"bSearchable":false, "bVisible":false}, //Analyze ID,
            {"bVisible":false}, //Histogram
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
        var reference_ids = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(dataset_datat_to_table(data[i], i));
            if(data[i]['reference'] != null) {
                reference_ids[data[i]['reference']['id']] = true;
            }
        }

        set_up_header('expression_table', datatable.length, 'dataset', 'datasets', Object.keys(reference_ids).length, 'reference', 'references');

        options["oLanguage"] = {"sEmptyTable": "No expression data for " + tag['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("expression_table", options);
}