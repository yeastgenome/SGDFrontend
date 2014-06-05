
$(document).ready(function() {
    $("#subfeature_table_analyze").hide();
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
        $('#physical_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['physical'] = "node, edge";
            } else {
                graph.filters['physical'] = "node, edge[type != 'PHYSINTERACTION']";
            }
            graph.applyFilters();
        });
        $('#genetic_checkbox').click(function(){
            if($(this).is(':checked')){
                graph.filters['genetic'] = "node, edge";
            } else {
                graph.filters['genetic'] = "node, edge[type != 'GENINTERACTION']";
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

    $.getJSON(sequence_details_link, function(sequence_data) {
        var protein_data = sequence_data['protein'];

        var length = null;
        if(protein_data.length > 0) {
            for (var i=0; i < protein_data.length; i++) {
                if(protein_data[i]['strain']['format_name'] == 'S288C') {
                    length = protein_data[i]['residues'].length - 1;
                }
            }

            $.getJSON(protein_domains_link, function(protein_domain_data) {
                    draw_domain_chart("domain_chart", length, protein_domain_data);
            });
        }

        var dna_data = sequence_data['genomic_dna'];

        for (var i=0; i < dna_data.length; i++) {

            if(dna_data[i]['strain']['display_name'] == 'S288C') {
                if(dna_data[i]['strand'] == '-') {
                    $("#reference_contig").html('<a href="' + dna_data[i]['contig']['link'] + '">' + dna_data[i]['contig']['display_name'] + '</a>: ' + dna_data[i]['end'] + ' - ' + dna_data[i]['start']);
                }
                else {
                    $("#reference_contig").html('<a href="' + dna_data[i]['contig']['link'] + '">' + dna_data[i]['contig']['display_name'] + '</a>: ' + dna_data[i]['start'] + ' - ' + dna_data[i]['end']);
                }

                draw_sublabel_chart('reference_sublabel_chart', dna_data[i]);
                var subfeature_table = create_subfeature_table(dna_data[i]);
                create_download_button("subfeature_table_download", subfeature_table, download_table_link, display_name + '_subfeatures');
            }
        }
    });
});

function make_domain_ready_handler(chart_id, chart, min_start, max_end, descriptions, data_array) {
    function ready_handler() {
        //Fix tooltips.
        function tooltipHandler(e) {
            var datarow = data_array[e.row];
            var spans = $(".google-visualization-tooltip-action > span");
            if(spans.length > 3) {
                spans[0].innerHTML = 'Coords:';
                spans[1].innerHTML = ' ' + datarow[2] + '-' + datarow[3];
                spans[2].innerHTML = '';
                if(descriptions[e.row] != null && descriptions[e.row] != '') {
                    spans[3].innerHTML = '<span>' + descriptions[e.row] + '</span>';
                }
                else {
                    spans[2].innerHTML = '';
                    spans[3].innerHTML = '';
                }
            }
        }
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

        //Fix axis.
        var svg_gs = $("#" + chart_id + " > div > div > svg > g");

        var rectangle_holder = svg_gs[3];
        rectangles = rectangle_holder.childNodes;
        var y_one = min_start;
        var y_two = max_end;

        var x_one = null;
        var x_two = null;

        for (i=0; i < rectangles.length; i++) {
            if(rectangles[i].nodeName == 'rect') {
                var x = Math.round(rectangles[i].getAttribute('x'));
                var y = Math.round(rectangles[i].getAttribute('y'));
                if(x_one == null || x < x_one) {
                    x_one = x;
                }
                if(x_two == null || x > x_two) {
                    x_two = x + Math.round(rectangles[i].getAttribute('width'));
                }
            }
        }

        var m = (y_two - y_one)/(x_two - x_one);
        var b = y_two - m*x_two;

        var tickmark_holder = svg_gs[1];
        var tickmarks = tickmark_holder.childNodes;
        var tickmark_space;
        if(tickmarks.length > 1) {
            tickmark_space = Math.round(tickmarks[1].getAttribute('x')) - Math.round(tickmarks[0].getAttribute('x'));
        }
        else {
            tickmark_space = 100;
        }
        for (i=0; i < tickmarks.length; i++) {
            var x_new = Math.round(tickmarks[i].getAttribute('x'));
            var y_new = Math.round(m*x_new + b);
            if(m*tickmark_space > 10000) {
                y_new = 10000*Math.round(y_new/10000);
            }
            else if(m*tickmark_space > 1000) {
                y_new = 1000*Math.round(y_new/1000);
            }
            else if(m*tickmark_space > 100) {
                y_new = 100*Math.round(y_new/100);
            }
            else if(m*tickmark_space > 10) {
                y_new = 10*Math.round(y_new/10)
            }
            if(y_new <= 0) {
                y_new = 1;
            }
            $(tickmarks[i]).html(y_new);
        }
    }
    return ready_handler;
}

function draw_domain_chart(chart_id, length, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Source' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var descriptions = [];

    var min_start = null;
    var max_end = null;

    for (var i=0; i < data.length; i++) {
        var start = data[i]['start'];
        var end = data[i]['end'];
        var source = '';
        if(data[i]['domain']['source'] != null) {
            source = data[i]['domain']['source']['display_name'];
        }
        data_array.push([source, data[i]['domain']['display_name'], start, end]);
        descriptions.push(data[i]['domain']['description']);
        if(min_start == null || start < min_start) {
            min_start = start;
        }
        if(max_end == null || end > max_end) {
            max_end = end;
        }
    }
    data_array.unshift([' ', display_name, 1, length]);
    descriptions.unshift('');

    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'timeline': {'colorByRowLabel': true,
            'hAxis': {'position': 'none'}
        }
    };

    chart.draw(dataTable, options);
    google.visualization.events.addListener(chart, 'ready', make_domain_ready_handler(chart_id, chart, min_start, max_end, descriptions, data_array));

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;
    chart.draw(dataTable, options);
}

function make_sublabel_ready_handler(chart_id, chart, data, data_array) {
    function ready_handler() {

        //Fix tooltips
        function tooltipHandler(e) {
            var datarow = data_array[e.row];
            var spans = $(".google-visualization-tooltip-action > span");
            if(spans.length > 2) {
                spans[1].innerHTML = ' ' + datarow[2] + '-' + datarow[3];
                spans[2].innerHTML = 'Length:';
                spans[3].innerHTML = ' ' + datarow[3] - datarow[2] + 1;
            }
        }
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

        //Fix timeline axis.
        var svg_gs = $("#" + chart_id + " > div > div > svg > g");
        var rectangle_holder = svg_gs[3];
        var rectangles = rectangle_holder.childNodes;

        var y_one;
        var y_two;
        var x_one = null;
        var x_two = null;
        var x_two_start = null;
        if(data['tags'].length > 0) {
            y_one = data['tags'][0]['relative_start'];
            y_two = data['tags'][data['tags'].length-1]['relative_end'];
        }
        else {
            y_one = 1;
            y_two = data['end'] - data['start'];
        }

        for (var i=0; i < rectangles.length; i++) {
            if(rectangles[i].nodeName == 'rect') {
                var x = Math.round(rectangles[i].getAttribute('x'));
                var y = Math.round(rectangles[i].getAttribute('y'));
                if(x_one == null || x < x_one) {
                    x_one = x;
                }
                if(x_two == null || x > x_two_start) {
                    x_two = x + Math.round(rectangles[i].getAttribute('width'));
                    x_two_start = x;
                }
            }
        }

        var m = (y_two - y_one)/(x_two - x_one);
        var b = y_two - m*x_two;

        var tickmark_holder = svg_gs[1];
        var tickmarks = tickmark_holder.childNodes;
        var tickmark_space;
        if(tickmarks.length > 1) {
            tickmark_space = Math.round(tickmarks[1].getAttribute('x')) - Math.round(tickmarks[0].getAttribute('x'));
        }
        else {
            tickmark_space = 100;
        }
        for (var i=0; i < tickmarks.length; i++) {
            var x_new = Math.round(tickmarks[i].getAttribute('x'));
            var y_new = Math.round(m*x_new + b);
            if(m*tickmark_space > 10000) {
                y_new = 10000*Math.round(y_new/10000);
            }
            else if(m*tickmark_space > 1000) {
                y_new = 1000*Math.round(y_new/1000);
            }
            else if(m*tickmark_space > 100) {
                y_new = 100*Math.round(y_new/100);
            }
            else if(m*tickmark_space > 10) {
                y_new = 10*Math.round(y_new/10)
            }
            if(y_new <= 0) {
                y_new = 1;
            }
            $(tickmarks[i]).html(y_new);
        }
    }
    return ready_handler;
}

function draw_sublabel_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Class' });
    dataTable.addColumn({ type: 'string', id: 'Subfeature' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var labels = {};

    var min_tick = null;

    if(data['tags'].length > 0) {
        for (var i=0; i < data['tags'].length; i++) {
            var start = data['tags'][i]['relative_start'];
            var end = data['tags'][i]['relative_end'];
            var name = data['tags'][i]['display_name'];
            data_array.push([display_name, name, start, end]);
            labels[name] = true;

            if(min_tick == null || min_tick < start) {
                min_tick = start;
            }
        }
    }
    else {
        var start = 1;
        var end = data['end'] - data['start'] + 1;
        data_array.push([display_name, display_name, start, end]);
        labels[display_name] = true;
    }

    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'timeline': {'hAxis': {'position': 'none'},
                    'showRowLabels': false},
        'tooltip': {'isHTML': true}
    }

    chart.draw(dataTable, options);
    google.visualization.events.addListener(chart, 'ready', make_sublabel_ready_handler(chart_id, chart, data, data_array));

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;

    chart.draw(dataTable, options);
}

function create_subfeature_table(data) {
	var datatable = [];

    for (var i=0; i < data['tags'].length; i++) {
        datatable.push([data['id'], data['locus']['id'], data['locus']['display_name'], data['locus']['format_name'],
                        data['tags'][i]['display_name'],
                        data['tags'][i]['relative_start'] + '-' + data['tags'][i]['relative_end'],
                        data['tags'][i]['chromosomal_start'] + '-' + data['tags'][i]['chromosomal_end'], data['strand']
                        ]);
    }

    set_up_header('subfeature_table', datatable.length, 'entry', 'entries', null, null, null);

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[5, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, { "sType": "range" }, { "sType": "range" }, {"bSearchable":false, "bVisible":false}]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No subfeatures for " + display_name + '.'};

    return create_table("subfeature_table", options);
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
        'line-color': "#ff7f00"
    })
    .selector("edge[type='GENINTERACTION']")
	.css({
        'line-color': "#fb9a99"
    })
    .selector("edge[type='EXPRESSION']")
	.css({
        'line-color': "#a65628"
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
