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

    // Co-expressed genes, precomputed from the expression datasets by
    // SGDBackend scripts/loading/dataset/compute_coexpression.py
    var coexpUrl = 'https://s3-us-west-2.amazonaws.com/sgd-prod-expression-details/coexpression/' + sgdid + '.json';
    $.getJSON(coexpUrl, function(data) {
        if(data == null || data['partners'].length == 0) {
            hide_section("network");
            return;
        }
        $("#coexpression_summary").html(coexpression_summary(data));
        var graph_data = coexpression_graph(data['network']);
        if(graph_data['nodes'].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, graph_data, null, true, "expression");
            create_cy_download_button(graph, "cy_download", locus['display_name'] + '_coexpression_graph');
        }
        var coexpression_table = create_coexpression_table(data['partners']);
        create_download_button("coexpression_table_download", coexpression_table, locus['display_name'] + "_coexpressed_genes");
        var names = $.map(data['partners'], function(p) { return p['systematic_name']; });
        create_analyze_button_with_list("coexpression_table_analyze", names, 'Genes co-expressed with ' + locus['display_name']);
        $("#coexpression_table_gene_list_analysis").click(function() {
            // hand the list to the Gene List Analysis tool (read once from localStorage)
            window.localStorage.setItem("geneListAnalysis", [locus['format_name']].concat(names).join(" "));
            location.assign('/gene-list-analysis');
        });
    }).fail(function() {
        hide_section("network");
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

function coexpression_summary(data) {
    var method = data['method'];
    return 'Top ' + data['partners'].length + ' genes co-expressed with ' + locus['display_name'] +
        ' across ' + data['locus']['dataset_count'] + ' expression datasets (of ' + method['datasets'] +
        ' analyzed; computed ' + method['computed'] + ').';
}

function coexpression_graph(network) {
    // nodes/edges in the format create_cytoscape_vis expects; edge width scales with the score
    var scores = $.map(network['edges'], function(e) { return e['score']; });
    var min_score = Math.min.apply(null, scores);
    var max_score = Math.max.apply(null, scores);
    var nodes = $.map(network['nodes'], function(n) {
        return {'data': {'id': n['sgdid'], 'name': n['display_name'], 'link': n['link'], 'type': 'BIOENTITY',
                         'sub_type': n['focus'] ? 'FOCUS' : null}};
    });
    var edges = $.map(network['edges'], function(e) {
        var width = max_score > min_score ? 1 + 5 * (e['score'] - min_score) / (max_score - min_score) : 3;
        return {'data': {'source': e['source'], 'target': e['target'], 'score': width,
                         'class_type': 'EXPRESSION', 'direction': 'positive'}};
    });
    return {'nodes': nodes, 'edges': edges};
}

function create_coexpression_table(partners) {
    var datatable = $.map(partners, function(p) {
        return [[p['rank'], create_link(p['display_name'], p['link']), p['systematic_name'], p['score'].toFixed(2),
                 p['dataset_count'], p['description'] || '']];
    });
    set_up_header('coexpression_table', datatable.length, 'gene', 'genes');
    var options = {
        'bPaginate': true,
        'aaSorting': [[0, "asc"]],
        'aoColumns': [null, null, null, null, null, null],
        'oLanguage': {'sEmptyTable': 'No co-expressed genes for ' + locus['display_name']},
        'aaData': datatable
    };
    return create_table("coexpression_table", options);
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
