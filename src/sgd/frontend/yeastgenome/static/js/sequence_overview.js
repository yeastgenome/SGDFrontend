var label_to_color = {};
var strain_to_neighbors = {};


var subfeature_table = create_subfeature_table(sequence_overview);
create_download_button("subfeature_table_download", subfeature_table, download_table_link, display_name + '_subfeatures');

if(sequence_overview['strand'] == '-') {
    $("#reference_contig").html('<a href="' + sequence_overview['contig']['link'] + '">' + sequence_overview['contig']['display_name'] + '</a>: ' + sequence_overview['end'] + ' - ' + sequence_overview['start']);
}
else {
    $("#reference_contig").html('<a href="' + sequence_overview['contig']['link'] + '">' + sequence_overview['contig']['display_name'] + '</a>: ' + sequence_overview['start'] + ' - ' + sequence_overview['end']);
}

google.load("visualization", "1", {packages:["corechart"]});

google.setOnLoadCallback(function(){draw_sublabel_chart('reference_sublabel_chart', sequence_overview);});

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

        //Get colors for sublables on sequence.
        var rectangle_holder = svg_gs[3];
        var rectangles = rectangle_holder.childNodes;
        var ordered_colors = [];
        for (var i=0; i < rectangles.length; i++) {
            if(rectangles[i].nodeName == 'rect') {
                var color = rectangles[i].getAttribute('fill');
                if(ordered_colors[ordered_colors.length - 1] != color) {
                    ordered_colors.push(color);
                }
            }
        }

        var label_holder = svg_gs[0];
        var color_index = 0;
        for (var i=0; i < data['tags'].length; i++) {
            if(!(data['tags'][i]['display_name'] in label_to_color)) {
                label_to_color[data['tags'][i]['display_name']] = ordered_colors[color_index];
                color_index = color_index + 1;
            }
        }
        try {
            color_sequence("reference_sequence", data);
        }
        catch(err) {}
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

function make_label_ready_handler(chart_id, chart, data, display_name_to_format_name, data_array) {
    function ready_handler() {
        //Fix tooltips.
        function tooltipHandler(e) {
            var datarow = data_array[e.row];
            var title_spans = $(".google-visualization-tooltip-item > span");
            $(title_spans[0]).html($(title_spans[0]).html()) + ' (' + display_name_to_format_name[$(title_spans[0]).html()] + ')';

            var spans = $(".google-visualization-tooltip-action > span");
            if(spans.length > 3) {
                $(spans[1]).html(' ' + datarow[2] + '-' + datarow[3]);
                $(spans[2]).html('Length:');
                $(spans[3]).html(' ' + datarow[3] - datarow[2] + 1);
            }
        }
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

        //Fix timeline axis.
        var svg_gs = $("#" + chart_id + " > div > div > svg > g");
        var rectangle_holder = svg_gs[3];
        var rectangles = rectangle_holder.childNodes;

        var y_one = data[0]['start'];
        var y_two = data[data.length-1]['end'];
        var x_one = null;
        var x_two = null;
        var x_two_start = null;

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
            else if(rectangles[i].nodeName == 'text' && $(rectangles[i]).text() == display_name) {
                $(rectangles[i-1]).css('fill', "#3366cc");
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

function draw_label_chart(chart_id, strain_name) {
    if(strain_name in strain_to_neighbors) {
        var data = strain_to_neighbors[strain_name];

        var container = document.getElementById(chart_id);

        var chart = new google.visualization.Timeline(container);

        var dataTable = new google.visualization.DataTable();

        dataTable.addColumn({ type: 'string', id: 'Strand' });
        dataTable.addColumn({ type: 'string', id: 'Feature' });
        dataTable.addColumn({ type: 'number', id: 'Start' });
        dataTable.addColumn({ type: 'number', id: 'End' });

        var data_array = [];

        var has_five_prime = false;
        var has_three_prime = false;
        var min_tick = null;
        var max_tick = null;

        var display_name_to_format_name = {};

        for (i=0; i < data.length; i++) {
            var start = data[i]['start'];
            var end = data[i]['end'];
            var direction = strand_to_direction(data[i]['strand']);
            display_name_to_format_name[data[i]['locus']['display_name']] = data[i]['locus']['format_name'];
            if(direction == "5'") {
                data_array.unshift([direction, data[i]['locus']['display_name'], start, end]);
                has_five_prime = true;
            }
            else {
                data_array.push([direction, data[i]['locus']['display_name'], start, end]);
                has_three_prime = true;
            }

            if(min_tick == null || start < min_tick) {
                min_tick = start;
            }
            if(max_tick == null || end > max_tick) {
                max_tick = end;
            }
        }

        if(!has_five_prime) {
            data_array.unshift(["5'", '', null, null]);
        }
        if(!has_three_prime) {
            data_array.push(["3'", '', null, null]);
        }

        dataTable.addRows(data_array);

        var options = {
            'height': 1,
            'timeline': {'hAxis': {'position': 'none'}, 'singleColor': '#A4A4A4'},
            'tooltip': {'isHTML': true}
        };

        chart.draw(dataTable, options);
        google.visualization.events.addListener(chart, 'ready', make_label_ready_handler(chart_id, chart, data, display_name_to_format_name, data_array));

        options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;
        chart.draw(dataTable, options);
    }
}

function strand_to_direction(strand) {
    if(strand == '+') {
        return "5'";
    }
    else {
        return "3'";
    }
}