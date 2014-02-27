
var label_to_color = {};

$(document).ready(function() {


  	$.getJSON(sequence_details_link, function(data) {
        var alternative_selection = $("#alternative_strain_selection");
        var other_selection = $("#other_strain_selection");
        var strain_to_data = {};
        for (var i=0; i < data.length; i++) {
            if(data[i]['strain']['display_name'] == 'S288C') {
                var residues = data[i]['sequence']['residues'];
                $("#reference_sequence").html(residues.chunk(10).join(' '));
                $("#reference_contig").html('<a href="' + data[i]['contig']['link'] + '">' + data[i]['contig']['display_name'] + '</a>: ' + data[i]['start'] + ' - ' + data[i]['end']);
                draw_label_chart('reference_label_chart', data[i]);
                draw_sublabel_chart('reference_sublabel_chart', data[i]);
                color_sequence("reference_sequence", data[i]);
                var subfeature_table = create_subfeature_table(data[i]);
                create_download_button("subfeature_table_download", subfeature_table, download_table_link, display_name + '_subfeatures');
                var contig = data[i]['contig']['format_name'];
                $("#reference_download").click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, contig);
                });
            }
            else {
                var option = document.createElement("option");
                option.value = data[i]['strain']['display_name'];
                option.innerHTML = data[i]['strain']['display_name'];
                strain_to_data[data[i]['strain']['display_name']] = data[i];

                if(data[i]['strain']['is_alternative_reference'] == 1) {
                    alternative_selection.append(option);
                }
                else {
                    other_selection.append(option);
                }
            }
        }

        function alternative_on_change() {
            var strain_data = strain_to_data[alternative_selection.val()];
            $("#alternative_sequence").html(strain_data['sequence']['residues'].chunk(10).join(' '));
            $("#alternative_strain_description").html(strain_data['strain']['description']);
            $("#navbar_alternative").children()[0].innerHTML = 'Alternative Reference Strains <span class="subheader">' + '- ' + alternative_selection.val() + '</span>';
            $("#alternative_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
            draw_label_chart('alternative_label_chart', strain_data);
            $("#alternative_download").click(function f() {
                download_sequence(strain_data['sequence']['residues'], download_sequence_link, display_name, strain_data['contig']['format_name']);
            });
        }
        alternative_selection.change(function() {alternative_on_change()});
        alternative_on_change();

        function other_on_change() {
            var strain_data = strain_to_data[other_selection.val()];
            $("#other_sequence").html(strain_data['sequence']['residues'].chunk(10).join(' '));
            $("#other_strain_description").html(strain_data['strain']['description']);
            $("#navbar_other").children()[0].innerHTML = 'Other Strains <span class="subheader">' + '- ' + other_selection.val() + '</span>';
            $("#other_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
            draw_label_chart('other_label_chart', strain_data);
            $("#other_download").click(function f() {
                download_sequence(strain_data['sequence']['residues'], download_sequence_link, display_name, strain_data['contig']['format_name']);
            });
        }
        other_selection.change(function() {other_on_change()});
        other_on_change();
  	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function strand_to_direction(strand) {
    if(strand == '+') {
        return "5'";
    }
    else {
        return "3'";
    }
}
function draw_label_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Strand' });
    dataTable.addColumn({ type: 'string', id: 'Feature' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var labels = {};

    var has_five_prime = false;
    var has_three_prime = false;
    var min_tick = data['start'];
    var max_tick = data['end'];

    if(data['strand'] == "+") {
        has_five_prime = true;
    }
    else {
        has_three_prime = true;
    }

    var start = data['start'];
    var end = data['end'];
    data_array.push([strand_to_direction(data['strand']), display_name, start, end]);
    labels[display_name] = true;

    for (var i=0; i < data['neighbors'].length; i++) {
        var start = data['neighbors'][i]['start'];
        var end = data['neighbors'][i]['end'];
        var direction = strand_to_direction(data['neighbors'][i]['strand']);
        if(direction == "5'") {
            data_array.unshift([direction, data['neighbors'][i]['display_name'], start, end]);
            has_five_prime = true;
        }
        else {
            data_array.push([direction, data['neighbors'][i]['display_name'], start, end]);
            has_three_prime = true;
        }

        if(start < min_tick) {
            min_tick = start;
        }
        if(end > max_tick) {
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
        'timeline': {'hAxis': {'position': 'none'},
                    'singleColor': '#A4A4A4'},
        'tooltip': {'isHTML': true},

    }

    chart.draw(dataTable, options);

    var height = $("#" + chart_id + " > div > div > div > svg").height() + 50;
    options['height'] = height;
    chart.draw(dataTable, options);

    var rectangle_holder = $("#" + chart_id + " > div > div > svg > g")[3];
    var rectangles = rectangle_holder.childNodes;
    for (var i=0; i < rectangles.length; i++) {
        if(rectangles[i].nodeName == 'text' && rectangles[i].innerHTML == display_name) {
            rectangles[i].setAttribute('fill', 'white');
            rectangles[i-1].setAttribute('fill', "#3366cc");
        }
    }

    function tooltipHandler(e) {
        var datarow = data_array[e.row];
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

    var tickmark_holder = $("#" + chart_id + " > div > div > svg > g")[1];
    var tickmarks = tickmark_holder.childNodes;
    var tickmark_space;
    if(tickmarks.length > 1) {
        tickmark_space = Math.round(tickmarks[1].getAttribute('x')) - Math.round(tickmarks[0].getAttribute('x'));
    }
    else {
        tickmark_space = Math.round($("#" + chart_id).getAttribute('width'));
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
        tickmarks[i].innerHTML = y_new;
    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
}

function draw_sublabel_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Subfeature' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var labels = {};

    var min_tick = null;

    if(data['sequence_labels'].length > 0) {
        for (var i=0; i < data['sequence_labels'].length; i++) {
            var start = data['sequence_labels'][i]['relative_start'];
            var end = data['sequence_labels'][i]['relative_end'];
            var name = data['sequence_labels'][i]['display_name'];
            data_array.push([name, start, end]);
            labels[name] = true;

            if(min_tick == null || min_tick < start) {
                min_tick = start;
            }
        }
    }
    else {
        var start = data['start'];
        var end = data['end'];
        data_array.push([display_name, start, end]);
        labels[display_name] = true;
    }

    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'timeline': {'hAxis': {'position': 'none'}},
        'tooltip': {'isHTML': true}
    }

    chart.draw(dataTable, options);

    var height = $("#" + chart_id + " > div > div > div > svg").height() + 50;
    options['height'] = height;


    chart.draw(dataTable, options);

    function tooltipHandler(e) {
        var datarow = data_array[e.row];
        var spans = $(".google-visualization-tooltip-action > span");
        if(spans.length > 2) {
            spans[0].innerHTML = ' ' + datarow[1] + '-' + datarow[2];
            spans[1].innerHTML = 'Length:';
            spans[2].innerHTML = ' ' + datarow[2] - datarow[1] + 1;
        }
    }

    var rectangle_holder = $("#" + chart_id + " > div > div > svg > g")[3];
    var rectangles = rectangle_holder.childNodes;
    var y_one = data['sequence_labels'][0]['relative_start'];
    var y_two = data['sequence_labels'][data['sequence_labels'].length-1]['relative_end'];

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
    }

    var m = (y_two - y_one)/(x_two - x_one);
    var b = y_two - m*x_two;

    var tickmark_holder = $("#" + chart_id + " > div > div > svg > g")[1];
    var tickmarks = tickmark_holder.childNodes;
    var tickmark_space;
    if(tickmarks.length > 1) {
        tickmark_space = Math.round(tickmarks[1].getAttribute('x')) - Math.round(tickmarks[0].getAttribute('x'));
    }
    else {
        tickmark_space = Math.round($("#" + chart_id).getAttribute('width'));
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
        tickmarks[i].innerHTML = y_new;
    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

    var rectangle_holder = $("#" + chart_id + " > div > div > svg > g")[3];
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

    var label_holder = $("#" + chart_id + " > div > div > svg > g")[0];
    var labels = label_holder.childNodes;
    var color_index = 0;
    for (var i=0; i < labels.length; i++) {
        if(labels[i].nodeName == 'text') {
            label_to_color[labels[i].innerHTML] = ordered_colors[color_index];
            color_index = color_index + 1;
        }
    }
}

function color_sequence(seq_id, data) {
    if(data['sequence_labels'].length > 1) {
        var seq = $("#" + seq_id).html();
        var new_seq = '';
        var start = 0;
        for (var i=0; i < data['sequence_labels'].length; i++) {
            var color;
            if(data['sequence_labels'][i]['display_name'] in label_to_color) {
                color = label_to_color[data['sequence_labels'][i]['display_name']];
            }
            else {
                color = colors[color_index];
                label_to_color[data['sequence_labels'][i]['display_name']] = color;
                color_index = color_index + 1;
            }
            var start_index = data['sequence_labels'][i]['relative_start'] + Math.floor(1.0*(data['sequence_labels'][i]['relative_start']-1)/10) - 1;
            var end_index = data['sequence_labels'][i]['relative_end'] + Math.floor(1.0*(data['sequence_labels'][i]['relative_end'])/10);
            new_seq = new_seq +
                    seq.substring(start, start_index) +
                    "<span style='color:" + color + "'>" +
                    seq.substring(start_index, end_index) +
                    "</span>";
            start = end_index;
        }
        new_seq = new_seq + seq.substr(start, seq.length)
        $("#" + seq_id).html(new_seq);
    }
}

function create_subfeature_table(data) {
	var datatable = [];

    for (var i=0; i < data['sequence_labels'].length; i++) {
        datatable.push([null,
                        data['sequence_labels'][i]['display_name'],
                        data['sequence_labels'][i]['relative_start'] + '-' + data['sequence_labels'][i]['relative_end'],
                        data['sequence_labels'][i]['chromosomal_start'] + '-' + data['sequence_labels'][i]['chromosomal_end'],
                        ]);
    }

    $("#subfeature_header").html(data['sequence_labels'].length);

    if(datatable.length == 1) {
        $("#subfeature_header_type").html("entry");
    }
    else {
        $("#subfeature_header_type").html("entries");
    }

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[2, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, null, { "sType": "range" }, { "sType": "range" }]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No subfeatures for " + display_name + '.'};

    return create_table("subfeature_table", options);
}