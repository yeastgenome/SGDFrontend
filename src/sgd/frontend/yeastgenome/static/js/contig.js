draw_overview(overview);

$(document).ready(function() {

    $("#sequence_download").click(function f() {
		download_sequence(residues, download_sequence_link, format_name, format_name);
	});

  	$.getJSON(sequence_details_link, function(data) {
        var feature_table = create_feature_table(data['genomic_dna']);
        create_download_button("chromosomal_coord_table_download", feature_table, download_table_link, display_name + '_features');
        create_analyze_button("chromosomal_coord_table_analyze", feature_table, analyze_link, "<a href='" + link + "' class='gene_name'>" + display_name + "</a> genes", true);

        set_up_sequence("feature_div", data['genomic_dna']);
  	});

});

var colors = ["#2E2EFE", "#FA5858", "#088A08", "#F3F781", "#9F81F7"];
var color_index = 0;

function strand_to_direction(strand) {
    if(strand == '+') {
        return "5'";
    }
    else {
        return "3'";
    }
}

function make_ready_handler(chart_id, chart, min_tick, max_tick, display_name_to_format_name, data_array) {
    function ready_handler() {
        function tooltipHandler(e) {
                var datarow = data_array[e.row];
                var title_spans = $(".google-visualization-tooltip-item > span");
                if(title_spans[0].innerHTML in display_name_to_format_name) {
                    title_spans[0].innerHTML = title_spans[0].innerHTML + ' (' + display_name_to_format_name[title_spans[0].innerHTML] + ')';
                    var spans = $(".google-visualization-tooltip-action > span");
                    if(spans.length > 3) {
                        spans[1].innerHTML = ' ' + datarow[2] + '-' + datarow[3];
                        spans[2].innerHTML = 'Length:';
                        spans[3].innerHTML = ' ' + datarow[3] - datarow[2] + 1;
                    }
                }
                else {
                    $(".google-visualization-tooltip-item").parent().parent().hide();
                }
        }
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

        //Fix timeline axis.
        var svg_gs = $("#" + chart_id + " > div > div > svg > g");

        var y_one = min_tick;
        if(y_one == 1) {
            y_one = 0;
        }
        var y_two = max_tick;

        var tickmark_holder = svg_gs[1];
        var tickmarks = tickmark_holder.childNodes;

        var m = Math.round((y_two - y_one)/tickmarks.length/10000)*10000;

        for (var i=0; i < tickmarks.length; i++) {
            var tick = y_one + i*m;
            if(tick == 0) {
                tick = 1;
            }
            $(tickmarks[i]).html(tick);
        }
    }
    return ready_handler;
}

function set_up_sequence(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Domain' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];

    var start = new Date()
    var end = new Date()

    var display_name_to_format_name = {};

    data_array.push(["5'", '', 1, 1]);
    data_array.push(["3'", '', 1, 1]);

    for (var i=0; i < data.length; i++) {
        var start = data[i]['start'];
        var end = data[i]['end'];
        var direction = strand_to_direction(data[i]['strand']);
        display_name_to_format_name[data[i]['locus']['display_name']] = data[i]['locus']['format_name'];
        if(direction == "5'") {
            data_array.push([direction, data[i]['locus']['display_name'], start, end]);
        }
        else {
            data_array.push([direction, data[i]['locus']['display_name'], start, end]);
        }
    }
    data_array.push(["5'", '', length, length]);
    data_array.push(["3'", '', length, length]);

    dataTable.addRows(data_array);
    var myColors = ['#A4A4A4'];

    var options = {
        'height': 1,
        'timeline': {'hAxis': {'position': 'none'}},
        'colors': myColors,
        'tooltip': {'isHTML': true}
    }

    chart.draw(dataTable, options);
    google.visualization.events.addListener(chart, 'ready', make_ready_handler(chart_id, chart, 1, length,
        display_name_to_format_name, data_array));
    var height = $("#" + chart_id + " > div > div > div > svg").height() + 60;
    options['height'] = height;
    chart.draw(dataTable, options);
}

function create_feature_table(data) {
	var datatable = [];

    for (var i=0; i < data.length; i++) {
        datatable.push([null, data[i]['locus']['id'],
                        create_link(data[i]['locus']['display_name'], data[i]['locus']['link']),
                        data[i]['locus']['format_name'],
                        data[i]['locus']['locus_type'],
                        data[i]['start'] + '-' + data[i]['end'],
                        data[i]['strand']
                        ]);
    }

    $("#chromosomal_coord_table_header").html(datatable.length);

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[5, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, { "sType": "range" }, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No features for " + display_name + '.'};

    return create_table("chromosomal_coord_table", options);
}

function draw_overview(data) {
    google.load("visualization", "1", {packages:["corechart"]});
    google.setOnLoadCallback(drawChart);
    function drawChart() {
        var dataTable = google.visualization.arrayToDataTable(data);

        var count = 0;
        for (var i=0; i < data.length; i++) {
            if(data[i][1] > 0 ) {
                count = count + 1;
            }
        }

        var size = 14;
        if(count >= 10) {
            size = 10;
        }

        var options = {
          title: 'Feature Types',
          pieSliceText: 'none',
          legend: {textStyle: {fontSize: size}}
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));
        chart.draw(dataTable, options);
    }
}