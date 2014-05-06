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

	//Hack because footer overlaps - need to fix this.
	add_footer_space("feature");
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
function set_up_sequence(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Domain' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var labels = {};

    var start = new Date()
    var end = new Date()

    var has_five_prime = false;
    var has_three_prime = false;
    var min_tick = null;
    var max_tick = null;

    var display_name_to_format_name = {};

    for (var i=0; i < data.length; i++) {
        var start = data[i]['start'];
        var end = data[i]['end'];
        var direction = strand_to_direction(data[i]['strand']);
        display_name_to_format_name[data[i]['locus']['display_name']] = data[i]['locus']['format_name'];
        if(direction == "5'") {
            data_array.unshift([direction, data[i]['locus']['display_name'], start, end]);
            has_five_prime = true;
        }
        else {
            data_array.push([direction, data[i]['locus']['display_name'], end, start]);
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
    var myColors = ['#A4A4A4'];

    var options = {
        'height': 1,
        'timeline': {'hAxis': {'position': 'none'}},
        'colors': myColors,
        //'enableInteractivity': false,
        'tooltip': {'isHTML': true}
    }

    chart.draw(dataTable, options);

    var height = $("#" + chart_id + " > div > div > div > svg").height() + 60;
    options['height'] = height;
    chart.draw(dataTable, options);

    function tooltipHandler(e) {
        var datarow = data_array[e.row];
        var title_spans = $(".google-visualization-tooltip-item > span");
        title_spans[0].innerHTML = title_spans[0].innerHTML + ' (' + display_name_to_format_name[title_spans[0].innerHTML] + ')';
        var spans = $(".google-visualization-tooltip-action > span");
        if(spans.length > 3) {
            spans[1].innerHTML = ' ' + datarow[2] + '-' + datarow[3];
            spans[2].innerHTML = 'Length:';
            spans[3].innerHTML = ' ' + datarow[3] - datarow[2] + 1;
        }
    }

    var divider_height = Math.round($("#" + chart_id + " > div > div > svg > g")[0].childNodes[0].getAttribute('height'));

    var rectangle_holder = $("#" + chart_id + " > div > div > svg > g")[3];
    var rectangles = rectangle_holder.childNodes;
    var y_one = min_tick;
    var y_two = max_tick;

    var x_one = null;
    var x_two = null;

    for (var i=0; i < rectangles.length; i++) {
        if(rectangles[i].nodeName == 'rect') {
            var x = Math.round(rectangles[i].getAttribute('x'));
            var y = Math.round(rectangles[i].getAttribute('y'));
            if(x > 0 && (y > divider_height && has_three_prime) || (y < divider_height && has_five_prime)) {
                if(x_one == null || x < x_one) {
                    x_one = x;
                }
                if(x_two == null || x > x_two) {
                    x_two = x + Math.round(rectangles[i].getAttribute('width'));
                }
            }
        }
    }

    var m = (y_two - y_one)/(x_two - x_one);
    var b = y_two - m*x_two;

    function tickmarkHandler(e) {
        window.setTimeout(function() {
            var tickmark_holder = $("#" + chart_id + " > div > div > svg > g")[1];
            var tickmarks = tickmark_holder.children();
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
                tickmarks[i].html(y_new);
            }
        }, 1000);
    }
    google.visualization.events.addListener(chart, 'ready', tickmarkHandler);

    chart.draw(dataTable, options);

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
}

function create_feature_table(data) {
	var datatable = [];

    for (var i=0; i < data.length; i++) {
        datatable.push([null, data[i]['locus']['id'],
                        create_link(data[i]['locus']['display_name'], data[i]['locus']['link']),
                        data[i]['locus']['format_name'],
                        data[i]['locus']['locus_type'], '',
                        data[i]['start'] + '-' + data[i]['end'],
                        data[i]['strand']
                        ]);
    }

    $("#chromosomal_coord_table_header").html(datatable.length);

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[2, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No features for " + display_name + '.'};

    return create_table("chromosomal_coord_table", options);
}

function draw_overview(data) {
    google.load("visualization", "1", {packages:["corechart"]});
    google.setOnLoadCallback(drawChart);
    function drawChart() {
        var dataTable = google.visualization.arrayToDataTable(data);

        var options = {
          title: 'Feature Types',
          pieSliceText: 'none'
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart'));
        chart.draw(dataTable, options);
    }
}