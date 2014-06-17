
$(document).ready(function() {
    $("#subfeature_table_download").hide();
    $("#subfeature_table_analyze").hide();
    $("#subfeature_table_filter").hide();

    $.getJSON(neighbor_sequence_details_link, function(data) {
        strain_to_neighbors = data;
        draw_label_chart('reference_label_chart', 'S288C');
    });

    $("#reference_download").click(function f() {download_sequence(sequence_overview['residues'], download_sequence_link, display_name, sequence_overview['contig']['display_name']);});

  	$.getJSON(locus_graph_link, function(data) {
  		var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, true);
        $('#go_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['go'] = "node, edge";
            } else {
                graph.filters['go'] = "node, edge[type != 'GO']";
            }
            graph.applyFilters();
        });
        $('#phenotype_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['phenotype'] = "node, edge";
            } else {
                graph.filters['phenotype'] = "node, edge[type != 'PHENOTYPE']";
            }
            graph.applyFilters();
        });
        $('#domain_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['domain'] = "node, edge";
            } else {
                graph.filters['domain'] = "node, edge[type != 'DOMAIN']";
            }
            graph.applyFilters();
        });
        $('#interaction_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['interaction'] = "node, edge";
            } else {
                graph.filters['interaction'] = "node, edge[type != 'PHYSINTERACTION'][type != 'GENINTERACTION']";
            }
            graph.applyFilters();
        });
        $('#expression_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['expression'] = "node, edge";
            } else {
                graph.filters['expression'] = "node, edge[type != 'EXPRESSION']";
            }
            graph.applyFilters();
        });
        var top_go = $("#top_go");
        var top_phenotype = $("#top_phenotype");
        var top_domain = $("#top_domain");
        for(var i=0; i < data['top_bioconcepts'].length; i++) {
            var bioconcept = data['top_bioconcepts'][i];
            var child = document.createElement('li');
            var link = document.createElement('a');
            link.innerHTML = bioconcept['display_name'];
            link.href = bioconcept['link'];
            link.id = bioconcept['id'];
            child.appendChild(link);
            $(link).hover(function() {graph.elements('node[BIOCONCEPT' + this.id + ']').css('background-color', '#fade71')}, function(){graph.elements('node[BIOCONCEPT' + this.id + '][sub_type != "FOCUS"]').css('background-color', '#848484')});
            if(bioconcept['class_type'] == 'GO') {
                top_go.append(child);
            }
            else if(bioconcept['class_type'] == 'OBSERVABLE') {
                top_phenotype.append(child);
            }

        }
        for(var i=0; i < data['top_bioitems'].length; i++) {
            var bioconcept = data['top_bioitems'][i];
            var child = document.createElement('li');
            var link = document.createElement('a');
            link.innerHTML = bioconcept['display_name'];
            link.href = bioconcept['link'];
            link.id = bioconcept['id'];
            $(link).hover(function() {graph.elements('node[BIOITEM' + this.id + ']').css('background-color', '#fade71')}, function(){graph.elements('node[BIOITEM' + this.id + '][sub_type != "FOCUS"]').css('background-color', '#848484')});
            child.appendChild(link);
            top_domain.append(child);
        }
	});

    $.getJSON(history_details_link, function(data) {
        var lsp_data = [];
        for(var i=1; i < data.length; i++) {
            if(data[i]['history_type'] == 'LSP') {
                lsp_data.push(data[i]);
            }
        }
        if(lsp_data.length > 0) {
            draw_history_chart('history_chart', lsp_data);
            var history_table = create_history_table(lsp_data);
            create_download_button("history_table_download", history_table, download_table_link, history_table_filename);
        }
        else {
            hide_section("history");
        }
    });
});

function draw_history_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Position' });
    dataTable.addColumn({ type: 'string', id: 'Category' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });

    var data_array = [['History', "SGD Goes Live", new Date(1990, 8, 8), new Date(1990, 8, 8)]];

    for (var i=0; i < data.length; i++) {
        var date_values = data[i]['date_created'].split('-');
        var start = new Date(parseInt(date_values[0]), parseInt(date_values[1])-1, parseInt(date_values[2]));
        data_array.push(['History', data[i]['category'], start, start]);
    }
    data_array.push(['History', 'Today', new Date(), new Date()])

    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'timeline': {'hAxis': {'position': 'none'},
                    'showRowLabels': false,
                    'groupByRowLabel': true,
                    'colorByRowLabel': true},

        'tooltip': {'isHTML': true}
    }

    chart.draw(dataTable, options);

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;

    chart.draw(dataTable, options);
}

function create_history_table(data) {
    var options = {"bPaginate":  true,
                    "aaSorting": [[4, "asc"]],
                    "aoColumns":  [
                        {"bSearchable":false, "bVisible":false}, //Evidence ID
                        {"bSearchable":false, "bVisible":false}, //Analyze ID
                        {"bSearchable":false, "bVisible":false}, //Gene
                        {"bSearchable":false, "bVisible":false}, //Gene Systematic Name
                        null, //Date
                        null, //Note
                        null //Reference
                    ]
    };


    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        for (var i=0; i < data.length; i++) {
            datatable.push(history_data_to_table(data[i], i));
        }

        set_up_header('history_table', datatable.length, 'entry', 'entries');

        options["oLanguage"] = {"sEmptyTable": "No history data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("history_table", options);
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
		'border-color': '#fff',
        'background-color': '#848484'
	})
	.selector('edge')
	.css({
		'width': 'data(count)',
        'opacity':.6
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
    .selector("edge[type='GO']")
	.css({
		'line-color': "#4daf4a"
	})
    .selector("edge[type='PHENOTYPE']")
	.css({
		'line-color': "#984ea3"
    })
    .selector("edge[type='DOMAIN']")
	.css({
        'line-color': "#377eb8"
    })
    .selector("edge[type='PHYSINTERACTION']")
	.css({
        'line-color': "#a65628"
    })
    .selector("edge[type='GENINTERACTION']")
	.css({
        'line-color': "#a65628"
    })
    .selector("edge[type='EXPRESSION']")
	.css({
        'line-color': "#ff7f00"
    });

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
