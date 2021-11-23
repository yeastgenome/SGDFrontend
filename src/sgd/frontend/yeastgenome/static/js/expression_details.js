function filter_table(minValue, maxValue) {
    var dataset_table = $($.fn.dataTable.fnTables(true)).dataTable();
    dataset_table.fnFilter( 'log2ratio=' + minValue + ':' + maxValue );
}

$(document).ready(function() {
    $("#expression_table_analyze").hide();
    var sgdid = locus.sgdid;
    var expUrl = 'https://s3-us-west-2.amazonaws.com/sgd-prod-expression-details/' + sgdid + '.json';
    $.getJSON(expUrl, function(data) {
        var expression_table = create_expression_table(data['datasets']);
        create_download_button("expression_table_download", expression_table, locus['display_name'] + "_expression");
        $("#expression_table_analyze").hide();
        // defer some logic to React
        views.expression.render(data);
    });

    $.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/expression_graph', function(data) {
        if(data != null && data['nodes'].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, true, "expression");
            var max_value = data["min_coeff"] + Math.min(data["max_coeff"] - data["min_coeff"], 10);
            // remove slider because of data["min_coeff"] issues
            // var slider = create_slider("slider", graph, data["min_coeff"], max_value, function slider_filter(new_cutoff) {return "node, edge[score >= " + (new_cutoff/10) + "]";}, max_value+1);
            create_cy_download_button(graph, "cy_download", locus['display_name'] + '_expression_graph')
        }
        else {
            hide_section("network");
        }
    });
});

function create_expression_table(data) {
    var options = {
        'bPaginate': true,
        'aaSorting': [[3, "asc"]],
        'aoColumns': [
            {"bSearchable":false, "bVisible":false}, //Evidence ID
            {"bSearchable":false, "bVisible":false}, //Analyze ID
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

        options["oLanguage"] = {"sEmptyTable": "No expression data for " + locus['display_name'],
                                'sSearch': 'Type a keyword (examples: “histone”, “stress”) into this box to filter for those rows within the table that contain the keyword. Type in more than one keyword to find rows containing all keywords: for instance, “transcription factor” returns rows that contain both “transcription and “factor”. To remove the filter, simply delete the text from the box.'};
        options["aaData"] = datatable;
    }

    return create_table("expression_table", options);
}

var graph_style = cytoscape.stylesheet()
    .selector('node')
    .css({
        'content': 'data(name)',
        'font-family': 'helvetica',
        'font-size': 14,
        'text-outline-width': 3,
        'text-outline-color': '#888',
        'text-valign': 'center',
        'color': '#fff',
        'width': 30,
        'height': 30,
        'border-color': '#fff'
    })
    .selector('edge')
    .css({
        'width': 'data(score)'
    })
    .selector("node[sub_type='FOCUS']")
    .css({
        'background-color': "#fade71",
        'text-outline-color': '#fff',
        'color': '#888'
    })
    .selector("edge[direction = 'positive']")
    .css({
        'line-color': "#AF8DC3"
    })
    .selector("edge[direction = 'negative']")
    .css({
        'line-color': "#7FBF7B"
    })
    ;

var layout = {
    "name": "arbor",
    "liveUpdate": true,
    "ungrabifyWhileSimulating": true,
    "nodeMass":function(data) {
        if(data.sub_type == 'FOCUS') {
            return 10;
        }
        else {
            return 1;
        }
    }
};
