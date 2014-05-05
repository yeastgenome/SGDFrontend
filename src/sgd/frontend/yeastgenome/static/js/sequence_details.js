
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
                $("#reference_contig").html('<a href="' + dna_data[i]['contig']['link'] + '">' + dna_data[i]['contig']['display_name'] + '</a>: ' + dna_data[i]['start'] + ' - ' + dna_data[i]['end']);
                //draw_sublabel_chart('reference_sublabel_chart', dna_data[i]);
                //var subfeature_table = create_subfeature_table(dna_data[i]);
                //create_download_button("subfeature_table_download", subfeature_table, download_table_link, display_name + '_subfeatures');
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
            $("#reference_sequence").html(residues.chunk(10).join(' '));

            mode.children('option[value=genomic_dna]')
                .attr('disabled', !('S288C' in strain_to_genomic_data));
            mode.children('option[value=coding_dna]')
                .attr('disabled', !('S288C' in strain_to_coding_data));
            mode.children('option[value=protein]')
                .attr('disabled', !('S288C' in strain_to_protein_data));

            if(mode.val() == 'genomic_dna') {
                //color_sequence("reference_sequence", strain_to_genomic_data['S288C']);
            }
        }
        $("#reference_chooser").change(reference_on_change);
        reference_on_change();

        function alternative_on_change() {
            var strain_data = strain_to_genomic_data[alternative_selection.val()];
            $("#alternative_strain_description").html(strain_data['strain']['description']);
            $("#navbar_alternative").children()[0].innerHTML = 'Alternative Reference Strains <span>' + '- ' + strain_to_genomic_data[alternative_selection.val()]['strain']['display_name'] + '</span>';
            $("#alternative_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
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
            $("#alternative_sequence").html(residues.chunk(10).join(' '));

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
            $("#other_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
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
            $("#other_sequence").html(residues.chunk(10).join(' '));

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

var strain_to_neighbors = {};

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

        var colors = []

        for (i=0; i < data.length; i++) {
            var start = data[i]['start'];
            var end = data[i]['end'];
            var direction = strand_to_direction(data[i]['strand']);
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
            if(data[i]['locus']['display_name'] == display_name) {
                colors.push("#3366cc");
            }
            else {
                colors.push('#A4A4A4');
            }
        }

        if(!has_five_prime) {
            data_array.unshift(["5'", '', null, null]);
            colors.unshift('#A4A4A4');
        }
        if(!has_three_prime) {
            data_array.push(["3'", '', null, null]);
            colors.push('#A4A4A4');
        }

        dataTable.addRows(data_array);

        var options = {
            'height': 1,
            'timeline': {'hAxis': {'position': 'none'}},
            'tooltip': {'isHTML': true},
            'colors': colors
        };

        chart.draw(dataTable, options);

        options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;
        chart.draw(dataTable, options);

        var svg_gs = $("#" + chart_id + " > div > div > svg > g");
        var rectangle_holder = svg_gs[3];
        var rectangles = rectangle_holder.childNodes;

        function tooltipHandler(e) {
            var datarow = data_array[e.row];
            var spans = $(".google-visualization-tooltip-action > span");
            if(spans.length > 3) {
                spans[1].innerHTML = ' ' + datarow[2] + '-' + datarow[3];
                spans[2].innerHTML = 'Length:';
                spans[3].innerHTML = ' ' + datarow[3] - datarow[2] + 1;
            }
        }

        var divider_height = Math.round(svg_gs[0].childNodes[0].getAttribute('height'));
        var y_one = min_tick;
        var y_two = max_tick;

        var x_one = null;
        var x_two = null;

        for (i=0; i < rectangles.length; i++) {
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
            tickmarks[i].innerHTML = y_new;
        }

        // Listen for the 'select' event, and call my function selectHandler() when
        // the user selects something on the chart.
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
    }
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

    if(data['sequence_tags'].length > 0) {
        for (var i=0; i < data['sequence_tags'].length; i++) {
            var start = data['sequence_tags'][i]['relative_start'];
            var end = data['sequence_tags'][i]['relative_end'];
            var name = data['sequence_tags'][i]['display_name'];
            data_array.push([display_name, name, start, end]);
            labels[name] = true;

            if(min_tick == null || min_tick < start) {
                min_tick = start;
            }
        }
    }
    else {
        var start = data['start'];
        var end = data['end'];
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

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;

    chart.draw(dataTable, options);

    function tooltipHandler(e) {
        var datarow = data_array[e.row];
        var spans = $(".google-visualization-tooltip-action > span");
        if(spans.length > 2) {
            spans[1].innerHTML = ' ' + datarow[2] + '-' + datarow[3];
            spans[2].innerHTML = 'Length:';
            spans[3].innerHTML = ' ' + datarow[3] - datarow[2] + 1;
        }
    }
    var svg_gs = $("#" + chart_id + " > div > div > svg > g");
    var rectangle_holder = svg_gs[3];
    var rectangles = rectangle_holder.childNodes;
    var y_one = data['sequence_tags'][0]['relative_start'];
    var y_two = data['sequence_tags'][data['sequence_tags'].length-1]['relative_end'];

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
        tickmarks[i].innerHTML = y_new;
    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

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
    var labels = label_holder.childNodes;
    var color_index = 0;
    for (var i=0; i < data['sequence_tags'].length; i++) {
        if(!(data['sequence_tags'][i]['display_name'] in label_to_color)) {
            label_to_color[data['sequence_tags'][i]['display_name']] = ordered_colors[color_index];
            color_index = color_index + 1;
        }
    }
}

function color_sequence(seq_id, data) {
    if(data['sequence_tags'].length > 1) {
        var seq = $("#" + seq_id).html();
        var new_seq = '';
        var start = 0;
        for (var i=0; i < data['sequence_tags'].length; i++) {
            var color;
            if(data['sequence_tags'][i]['display_name'] in label_to_color) {
                color = label_to_color[data['sequence_tags'][i]['display_name']];
            }
            else {
                color = colors[color_index];
                label_to_color[data['sequence_tags'][i]['display_name']] = color;
                color_index = color_index + 1;
            }
            var start_index = data['sequence_tags'][i]['relative_start'] + Math.floor(1.0*(data['sequence_tags'][i]['relative_start']-1)/10) - 1;
            var end_index = data['sequence_tags'][i]['relative_end'] + Math.floor(1.0*(data['sequence_tags'][i]['relative_end'])/10);
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

    for (var i=0; i < data['sequence_tags'].length; i++) {
        datatable.push([null, null, display_name,
                        data['sequence_tags'][i]['display_name'],
                        data['sequence_tags'][i]['relative_start'] + '-' + data['sequence_tags'][i]['relative_end'],
                        data['sequence_tags'][i]['chromosomal_start'] + '-' + data['sequence_tags'][i]['chromosomal_end']
                        ]);
    }

    set_up_header('subfeature_table', datatable.length, 'entry', 'entries', null, null, null);

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, { "sType": "range" }, { "sType": "range" }]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No subfeatures for " + display_name + '.'};

    return create_table("subfeature_table", options);
}