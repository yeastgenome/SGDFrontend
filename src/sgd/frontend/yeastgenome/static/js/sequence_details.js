
var label_to_color = {};

$(document).ready(function() {

    $("#subfeature_table_analyze").hide();
  	$.getJSON(sequence_details_link, function(data) {
        var dna_data = data['genomic_dna'];
        var alternative_selection = $("#alternative_strain_selection");
        var other_selection = $("#other_strain_selection");
        var strain_to_genomic_data = {};
        var strain_to_protein_data = {};
        var strain_to_coding_data = {};

        for (var i=0; i < dna_data.length; i++) {
            strain_to_genomic_data[dna_data[i]['strain']['format_name']] = dna_data[i];

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
            else {
                var option = document.createElement("option");
                option.value = dna_data[i]['strain']['format_name'];
                option.innerHTML = dna_data[i]['strain']['display_name'];

                if(dna_data[i]['strain']['status'] == 'Alternative Reference') {
                    alternative_selection.append(option);
                }
                else {
                    other_selection.append(option);
                }
            }
        }

        var protein_data = data['protein'];
        for (i=0; i < protein_data.length; i++) {
            strain_to_protein_data[protein_data[i]['strain']['format_name']] = protein_data[i];
        }

        var coding_data = data['coding_dna'];
        for (i=0; i < coding_data.length; i++) {
            strain_to_coding_data[coding_data[i]['strain']['format_name']] = coding_data[i];
        }

        function reference_on_change() {
            var mode = $("#reference_chooser");
            var reference_download = $("#reference_download");
            var residues;
            if(mode.val() == 'genomic_dna') {
                residues = strain_to_genomic_data['S288C']['residues'];
                reference_download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, strain_to_genomic_data['S288C']['contig']['format_name']);
                });
            }
            else if(mode.val() == 'coding_dna') {
                residues = strain_to_coding_data['S288C']['residues'];
                reference_download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, 'coding_dna');
                });
            }
            else if(mode.val() == 'protein') {
                residues = strain_to_protein_data['S288C']['residues'];
                reference_download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, 'protein');
                });
            }
            else {
                residues = '';
            }
            $("#reference_sequence").html(prep_sequence(residues));

            mode.children('option[value=genomic_dna]')
                .attr('disabled', !('S288C' in strain_to_genomic_data));
            mode.children('option[value=coding_dna]')
                .attr('disabled', !('S288C' in strain_to_coding_data));
            mode.children('option[value=protein]')
                .attr('disabled', !('S288C' in strain_to_protein_data));

            if(mode.val() == 'genomic_dna') {
                color_sequence("reference_sequence", strain_to_genomic_data['S288C']);
            }
        }
        $("#reference_chooser").change(reference_on_change);
        reference_on_change();

        function alternative_on_change() {
            var strain_data = strain_to_genomic_data[alternative_selection.val()];
            $("#alternative_strain_description").html(strain_data['strain']['description']);
            $("#navbar_alternative").children()[0].innerHTML = 'Alternative Reference Strains <span>' + '- ' + strain_to_genomic_data[alternative_selection.val()]['strain']['display_name'] + '</span>';
            $("#current_alternative_strain_sequence").html(strain_to_genomic_data[alternative_selection.val()]['strain']['display_name']);
            $("#current_alternative_strain_location").html(strain_to_genomic_data[alternative_selection.val()]['strain']['display_name']);
            if(strain_data['strand'] == '-') {
                $("#alternative_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['end'] + ' - ' + strain_data['start']);
            }
            else {
                $("#alternative_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
            }
            draw_label_chart('alternative_label_chart', strain_data['strain']['format_name']);

            var mode = $("#alternative_chooser");
            var download = $("#alternative_download");
            var residues;
            if(mode.val() == 'genomic_dna') {
                residues = strain_to_genomic_data[alternative_selection.val()]['residues'];
                download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, strain_to_genomic_data[alternative_selection.val()]['contig']['format_name']);
                });
            }
            else if(mode.val() == 'coding_dna') {
                residues = strain_to_coding_data[alternative_selection.val()]['residues'];
                download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, 'coding_dna');
                });
            }
            else if(mode.val() == 'protein') {
                residues = strain_to_protein_data[alternative_selection.val()]['residues'];
                download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, 'protein');
                });
            }
            else {
                residues = '';
            }
            $("#alternative_sequence").html(prep_sequence(residues));

            mode.children('option[value=genomic_dna]')
                .attr('disabled', !(alternative_selection.val() in strain_to_genomic_data));
            mode.children('option[value=coding_dna]')
                .attr('disabled', !(alternative_selection.val() in strain_to_coding_data));
            mode.children('option[value=protein]')
                .attr('disabled', !(alternative_selection.val() in strain_to_protein_data));

            if(mode.val() == 'protein' && !(alternative_selection.val() in strain_to_protein_data)) {
                mode.children('option[value=genomic_dna]').attr('selected', true);
                other_on_change();
            }
            if(mode.val() == 'coding_dna' && !(alternative_selection.val() in strain_to_coding_data)) {
                mode.children('option[value=genomic_dna]').attr('selected', true);
                other_on_change();
            }
        }
        alternative_selection.change(alternative_on_change);
        $("#alternative_chooser").change(alternative_on_change);
        alternative_on_change();

        function other_on_change() {
            var strain_data = strain_to_genomic_data[other_selection.val()];
            $("#other_strain_description").html(strain_data['strain']['description']);
            $("#navbar_other").children()[0].innerHTML = 'Other Strains <span>' + '- ' + other_selection.val() + '</span>';
            $("#current_other_strain_sequence").html(strain_to_genomic_data[other_selection.val()]['strain']['display_name']);
            $("#current_other_strain_location").html(strain_to_genomic_data[other_selection.val()]['strain']['display_name']);
            if(strain_data['strand'] == '-') {
                $("#other_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['end'] + ' - ' + strain_data['start']);
            }
            else {
                $("#other_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
            }

            draw_label_chart('other_label_chart', strain_data['strain']['display_name']);

            var mode = $("#other_chooser");
            var download = $("#other_download");
            var residues;
            if(mode.val() == 'genomic_dna' && other_selection.val() in strain_to_genomic_data) {
                residues = strain_to_genomic_data[other_selection.val()]['residues'];
                download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, strain_to_genomic_data[other_selection.val()]['contig']['format_name']);
                });
            }
            else if(mode.val() == 'coding_dna' && other_selection.val() in strain_to_coding_data) {
                residues = strain_to_coding_data[other_selection.val()]['residues'];
                download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, 'coding_dna');
                });
            }
            else if(mode.val() == 'protein' && other_selection.val() in strain_to_protein_data) {
                residues = strain_to_protein_data[other_selection.val()]['residues'];
                download.click(function f() {
                    download_sequence(residues, download_sequence_link, display_name, 'protein');
                });
            }
            else {
                residues = '';
            }
            $("#other_sequence").html(prep_sequence(residues));

            mode.children('option[value=genomic_dna]')
                .attr('disabled', !(other_selection.val() in strain_to_genomic_data));
            mode.children('option[value=coding_dna]')
                .attr('disabled', !(other_selection.val() in strain_to_coding_data));
            mode.children('option[value=protein]')
                .attr('disabled', !(other_selection.val() in strain_to_protein_data));

            if(mode.val() == 'protein' && !(other_selection.val() in strain_to_protein_data)) {
                mode.children('option[value=genomic_dna]').attr('selected', true);
                other_on_change();
            }
            if(mode.val() == 'coding_dna' && !(other_selection.val() in strain_to_coding_data)) {
                mode.children('option[value=genomic_dna]').attr('selected', true);
                other_on_change();
            }
        }
        other_selection.change(other_on_change);
        $("#other_chooser").change(other_on_change);
        other_on_change();
  	});

    $.getJSON(neighbor_sequence_details_link, function(data) {
        strain_to_neighbors = data;
        draw_label_chart('reference_label_chart', 'S288C');
        draw_label_chart('alternative_label_chart', $("#alternative_strain_selection").val());
        draw_label_chart('other_label_chart', $("#other_strain_selection").val());
    });
});

function pad_number(number, num_digits) {
    number = '' + number;
    while(number.length < num_digits) {
        number = ' ' + number;
    }
    return number;
}

function prep_sequence(residues) {
    var chunks = residues.chunk(10).join(' ').chunk(66);
    var num_digits = ('' + residues.length).length;

    var new_sequence = pad_number(1, num_digits) + ' ' + chunks[0];
    for(var i=1; i < chunks.length; i++) {
        if(i == chunks.length-1) {
            new_sequence = new_sequence + '<br>' + pad_number(i*60+1, num_digits) + ' ' + chunks[i];
        }
        else {
            new_sequence = new_sequence + '<br>' + pad_number(i*60+1, num_digits) + ' ' + chunks[i];
        }
    }
    return new_sequence;
}

function strand_to_direction(strand) {
    if(strand == '+') {
        return "5'";
    }
    else {
        return "3'";
    }
}

var strain_to_neighbors = {};

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

function color_sequence(seq_id, data) {
    if(data['tags'].length > 1) {
        var num_digits = ('' + data['residues'].length).length;

        var seq = $("#" + seq_id).html();
        var new_seq = '';
        var start = 0;
        for (var i=0; i < data['tags'].length; i++) {
            var color;
            if(data['tags'][i]['display_name'] in label_to_color) {
                color = label_to_color[data['tags'][i]['display_name']];
            }
            else {
                color = colors[color_index];
                label_to_color[data['tags'][i]['display_name']] = color;
                color_index = color_index + 1;
            }
            var start_index = data['tags'][i]['relative_start']-1;
            var end_index = data['tags'][i]['relative_end'];

            var html_start_index = relative_to_html(start_index, num_digits);
            var html_end_index = relative_to_html(end_index, num_digits);

            var start_index_row = Math.floor(1.0*start_index/60);
            var end_index_row = Math.floor(1.0*end_index/60);

            if(start_index_row == end_index_row) {
                new_seq = new_seq +
                    seq.substring(start, html_start_index) +
                    "<span style='color:" + color + "'>" +
                    seq.substring(html_start_index, html_end_index) +
                    "</span>";
            }
            else {
                var start_index_row_end = (start_index_row+1)*(71+num_digits);
                var end_index_row_start = end_index_row*(71+num_digits) + 1 + num_digits;
                new_seq = new_seq +
                    seq.substring(start, html_start_index) +
                    "<span style='color:" + color + "'>" +
                    seq.substring(html_start_index, start_index_row_end) +
                    "</span>";
                start = start_index_row_end;

                for(var j=start_index_row+1; j < end_index_row; j++) {
                    var row_start = j*(71+num_digits) + 1 + num_digits;
                    var row_end = (j+1)*(71+num_digits);
                    new_seq = new_seq +
                        seq.substring(start, row_start) +
                        "<span style='color:" + color + "'>" +
                        seq.substring(row_start, row_end) +
                        "</span>";
                    start = row_end
                }
                new_seq = new_seq +
                    seq.substring(start, end_index_row_start) +
                    "<span style='color:" + color + "'>" +
                    seq.substring(end_index_row_start, html_end_index) +
                    "</span>";
            }
            start = html_end_index;
        }
        new_seq = new_seq + seq.substr(start, seq.length)
        $("#" + seq_id).html(new_seq);
    }
}

function relative_to_html(index, num_digits) {
    var row = Math.floor(1.0*index/60);
    var column = index - row*60;
    return row*(71+num_digits) + 1 + num_digits + column + Math.floor(1.0*column/10);
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