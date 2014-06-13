var source_to_color = {};

google.load("visualization", "1", {packages:["corechart"]});

google.setOnLoadCallback(function(){
    if(protein_overview['domains'].length > 0) {
        draw_domain_chart("domain_chart", length, protein_overview['domains']);
    }
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

        //Grab colors for network.
        rectangle_holder = svg_gs[3];
        var rectangles = rectangle_holder.childNodes;
        var ordered_colors = [];
        for (var i=0; i < rectangles.length; i++) {
            if(rectangles[i].nodeName == 'rect') {
                var color = $(rectangles[i]).attr('fill');
                if(ordered_colors[ordered_colors.length - 1] != color) {
                    ordered_colors.push(color);
                }

            }
        }

        var label_holder = svg_gs[0];
        var labels = label_holder.childNodes;
        var color_index = 0;
        for (var i=0; i < labels.length; i++) {
            if(labels[i].nodeName == 'text') {
                source_to_color[$(labels[i]).text()] = ordered_colors[color_index];
                color_index = color_index + 1;
            }
        }

        try {
            draw_protein_domain_graph();
        }
        catch(err) {}
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
    data_array.unshift([' ', protein_display_name, 1, length]);
    descriptions.unshift('');

    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'title': 'Protein Domains',
        'timeline': {'colorByRowLabel': true,
            'hAxis': {'position': 'none'}
        },
        'colors': ['#377eb8']
    };

    chart.draw(dataTable, options);
    google.visualization.events.addListener(chart, 'ready', make_domain_ready_handler(chart_id, chart, min_start, max_end, descriptions, data_array));

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;
    chart.draw(dataTable, options);
}