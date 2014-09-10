
var label_to_color = {};
var chromosome = null;

var reference_download_residues = '';
var reference_contig = '';

var alternative_download_residues = '';
var alternative_contig = '';

var other_download_residues = '';
var other_contig = '';

$(document).ready(function() {

    $("#subfeature_table_analyze").hide();
  	get_json(sequence_details_link, function(data) {
        var dna_data = data['genomic_dna'];
        var alternative_selection = $("#alternative_strain_selection");
        var other_selection = $("#other_strain_selection");
        var strain_to_genomic_data = {};
        var strain_to_protein_data = {};
        var strain_to_coding_data = {};
        var has_alternative = false;
        var has_other = false;

        for (var i=0; i < dna_data.length; i++) {
            strain_to_genomic_data[dna_data[i]['strain']['format_name']] = dna_data[i];

            if(dna_data[i]['strain']['display_name'] == 'S288C') {
                chromosome = dna_data[i]['contig']['display_name'];
                $("#reference_contig").html('<a href="' + dna_data[i]['contig']['link'] + '">' + dna_data[i]['contig']['display_name'] + '</a>: ' + dna_data[i]['start'] + ' - ' + dna_data[i]['end']);

                if(dna_data[i]['tags'].length > 0) {
                    draw_sublabel_chart('reference_sublabel_chart', dna_data[i]);
                    var subfeature_table = create_subfeature_table(dna_data[i]);
                    create_download_button("subfeature_table_download", subfeature_table, download_table_link, display_name + '_subfeatures');
                }
                else {
                    $("#subfeature_wrapper").hide();
                }


            }
            else {
                var option = document.createElement("option");
                option.value = dna_data[i]['strain']['format_name'];
                option.innerHTML = dna_data[i]['strain']['display_name'];

                if(dna_data[i]['strain']['status'] == 'Alternative Reference') {
                    alternative_selection.append(option);
                    has_alternative = true;
                }
                else {
                    other_selection.append(option);
                    has_other = true;
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
            reference_download_residues = '';
            if(mode.val() == 'genomic_dna') {
                reference_download_residues = strain_to_genomic_data['S288C']['residues'];
                reference_contig = strain_to_genomic_data['S288C']['contig']['format_name'];
            }
            else if(mode.val() == 'coding_dna') {
                reference_download_residues = strain_to_coding_data['S288C']['residues'];
                reference_contig = 'S288C coding_dna';
            }
            else if(mode.val() == 'protein') {
                reference_download_residues = strain_to_protein_data['S288C']['residues'];
                reference_contig = 'S288C protein';
            }

            $("#reference_sequence").html(prep_sequence(reference_download_residues));

            mode.children('option[value=genomic_dna]')
                .attr('disabled', !('S288C' in strain_to_genomic_data));
            mode.children('option[value=coding_dna]')
                .attr('disabled', !('S288C' in strain_to_coding_data));
            mode.children('option[value=protein]')
                .attr('disabled', !('S288C' in strain_to_protein_data));

            if(mode.val() == 'genomic_dna' && can_color) {
                color_sequence("reference_sequence", strain_to_genomic_data['S288C']);
                $("#reference_legend").show();
            }
            else {
                $("#reference_legend").hide();
            }
        }
        $("#reference_chooser").change(reference_on_change);
        reference_on_change();

        $("#reference_download").click(function f() {
            download_sequence(reference_download_residues, download_sequence_link, display_name, reference_contig);
        });

        if(has_alternative) {
            function alternative_on_change() {
                var strain_data = strain_to_genomic_data[alternative_selection.val()];
                $("#alternative_strain_description").html(strain_data['strain']['description']);
                $("#current_alternative_strain_sequence").html(strain_data['strain']['display_name']);
                $("#current_alternative_strain_location").html(strain_data['strain']['display_name']);
                $("#alternative_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
                draw_label_chart('alternative_label_chart', strain_data['strain']['format_name']);

                var mode = $("#alternative_chooser");
                alternative_download_residues = '';
                if(mode.val() == 'genomic_dna') {
                    alternative_download_residues = strain_data['residues'];
                    alternative_contig = strain_data['contig']['format_name'];
                }
                else if(mode.val() == 'coding_dna') {
                    alternative_download_residues = strain_to_coding_data[alternative_selection.val()]['residues'];
                    alternative_contig = alternative_selection.val() + ' coding_dna';
                }
                else if(mode.val() == 'protein') {
                    alternative_download_residues = strain_to_protein_data[alternative_selection.val()]['residues'];
                    alternative_contig = alternative_selection.val() + ' protein';
                }

                $("#alternative_sequence").html(prep_sequence(alternative_download_residues));

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

            $("#alternative_download").click(function f() {
                download_sequence(alternative_download_residues, download_sequence_link, display_name, alternative_contig);
            });
        }
        else {
            hide_section('alternative');
        }

        if(has_other) {
            function other_on_change() {
                var strain_data = strain_to_genomic_data[other_selection.val()];
                $("#other_strain_description").html(strain_data['strain']['description']);

                other_download_residues = strain_data['residues'];
                other_contig = strain_data['contig']['format_name'];
            }
            other_selection.change(other_on_change);
            $("#other_chooser").change(other_on_change);
            other_on_change();

            $("#other_download").click(function f() {
                download_sequence(other_download_residues, download_sequence_link, display_name, other_contig);
            });
        }
        else {
            hide_section('other');
        }
    });

    get_json(neighbor_sequence_details_link, function(data) {
        strain_to_neighbors = data;
        draw_label_chart('reference_label_chart', 'S288C');
        draw_label_chart('alternative_label_chart', $("#alternative_strain_selection").val());
    });

    set_up_history_table();
});

function set_up_history_table() {
    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[0, "asc"]];
    options["aoColumns"] = [null, null, null]
    options["oLanguage"] = {"sEmptyTable": "No history for " + display_name + '.'};

    return create_table("history_table", options);
}

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
            var display_name = $(title_spans[0]).html();
            var spans = $(".google-visualization-tooltip-action > span");
            if(display_name in display_name_to_format_name) {
                var format_name = display_name_to_format_name[display_name]['locus']['format_name'];
                if(format_name != display_name) {
                    $(title_spans[0]).html(display_name + ' (' + format_name + ')');
                }

                if(spans.length > 3) {
                    var start = display_name_to_format_name[display_name]['start'];
                    var end = display_name_to_format_name[display_name]['end'];
                    $(spans[0]).html(chromosome + ':');
                    $(spans[1]).html(' ' + start + '-' + end + ' (Length: ' + (end - start + 1) + ')');
                    $(spans[2]).html(display_name_to_format_name[display_name]['locus']['locus_type'] + ': ');
                    $(spans[3]).html(display_name_to_format_name[display_name]['locus']['headline']);
                }
            }
            else {
                $(".google-visualization-tooltip-item").parent().parent().hide();
            }
            $(".google-visualization-tooltip-item").parent().parent().height('auto');
            $(".google-visualization-tooltip-item").parent().parent().width(300);

        }
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

        //Fix timeline axis.
        var svg_gs = $("#" + chart_id + " > div > div > svg > g");

        var y_one = data['start'];
        if(y_one == 1) {
            y_one = 0;
        }
        var y_two = data['end'];

        var tickmark_holder = svg_gs[1];
        var tickmarks = tickmark_holder.childNodes;

        var m = Math.round((y_two - y_one)/tickmarks.length/1000)*1000;

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

function draw_label_chart(chart_id, strain_name) {
    if(strain_name in strain_to_neighbors) {
        var neighbor_data = strain_to_neighbors[strain_name];
        var data = neighbor_data['neighbors'].sort(function(a, b){return a['start']-b['start']});

        var container = document.getElementById(chart_id);

        var chart = new google.visualization.Timeline(container);

        var dataTable = new google.visualization.DataTable();

        dataTable.addColumn({ type: 'string', id: 'Strand' });
        dataTable.addColumn({ type: 'string', id: 'Feature' });
        dataTable.addColumn({ type: 'number', id: 'Start' });
        dataTable.addColumn({ type: 'number', id: 'End' });

        var data_array = [];

        var min_tick = neighbor_data['start'];
        var max_tick = neighbor_data['end'];

        var display_name_to_format_name = {};

        var colors5 = ['#D8D8D8'];
        var colors3 = ['#D8D8D8'];

        var colors5_row2 = [];
        var colors3_row2 = [];

        data_array.push(["5'", '', min_tick, min_tick]);
        data_array.push(["3'", '', min_tick, min_tick]);
        var previous_end_5 = 0;
        var previous_end_3 = 0;
        for (var i=0; i < data.length; i++) {
            var start = Math.max(data[i]['start'], min_tick);
            var end = Math.min(data[i]['end'], max_tick);
            var direction = strand_to_direction(data[i]['strand']);
            display_name_to_format_name[data[i]['locus']['display_name']] = data[i];
            var color;
            if(data[i]['locus']['display_name'] == display_name) {
                color = "#3366cc";
            }
            else {
                color = "#A4A4A4";
            }
            if(direction == "5'") {
                if(previous_end_5 <= start) {
                    colors5.push(color);
                }
                else {
                    colors5_row2.push(color);
                }
                previous_end_5 = Math.max(previous_end_5, end);
            }
            else {
                if(previous_end_3 <= start) {
                    colors3.push(color);
                }
                else {
                    colors3_row2.push(color);
                }
                previous_end_3 = Math.max(previous_end_3, end);
            }

            data_array.push([direction, data[i]['locus']['display_name'], start, end]);
        }

        data_array.push(["5'", '', max_tick, max_tick]);
        data_array.push(["3'", '', max_tick, max_tick]);

        dataTable.addRows(data_array);

        var colors5 = colors5.concat(colors5_row2);
        var colors3 = colors3.concat(colors3_row2);
        var colors = colors5.concat(colors3);

        var options = {
            'height': 1,
            'timeline': {'hAxis': {'position': 'none'}},
            'tooltip': {'isHTML': true},
            'colors': colors
        };

        chart.draw(dataTable, options);

        options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;
        google.visualization.events.addListener(chart, 'ready', make_label_ready_handler(chart_id, chart, neighbor_data, display_name_to_format_name, data_array));
        chart.draw(dataTable, options);

    }
}

function make_sublabel_ready_handler(chart_id, chart, seq_start, seq_end, data, data_array) {
    function ready_handler() {

        //Fix tooltips
        function tooltipHandler(e) {
            var datarow = data_array[e.row];
            var spans = $(".google-visualization-tooltip-action > span");
            if(spans.length > 2) {
                var start = datarow[2]/100;
                if(start == 0) {
                    start = 1;
                }
                spans[1].innerHTML = ' ' + start + '-' + datarow[3]/100;
                spans[2].innerHTML = 'Length: ';
                spans[3].innerHTML = ' ' + datarow[3]/100 - start + 1;
            }
        }
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

        //Fix timeline axis.
        var svg_gs = $("#" + chart_id + " > div > div > svg > g");

        var y_one = 0;
        var y_two = seq_end - seq_start;

        var tickmark_holder = svg_gs[1];
        var tickmarks = tickmark_holder.childNodes;

        var m = Math.round((y_two - y_one)/tickmarks.length/100)*100;
        if (m == 0) {
            m = Math.round((y_two - y_one)/tickmarks.length/10)*10;
        }


        for (var i=0; i < tickmarks.length; i++) {
            var tick = y_one + i*m;
            if(tick == 0) {
                tick = 1;
            }
            $(tickmarks[i]).html(tick);
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

        var color_index = 0;
        for (var i=0; i < data.length; i++) {
            if(!(data[i]['display_name'] in label_to_color)) {
                label_to_color[data[i]['display_name']] = ordered_colors[color_index];
                color_index = color_index + 1;
            }
        }
    }
    return ready_handler;
}

function draw_sublabel_chart(chart_id, data) {
    var seq_start = data['start'];
    var seq_end = data['end'];
    var data = data['tags'].sort(function(a, b){return a['relative_start']-b['relative_start']});

    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Class' });
    dataTable.addColumn({ type: 'string', id: 'Subfeature' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var labels = {};

    var min_start = null;
    var max_end = null;
    for (var i=0; i < data.length; i++) {
        var start = data[i]['relative_start']*100;
        if(start == 100) {
            start = 0;
        }
        var end = data[i]['relative_end']*100;
        var name = data[i]['display_name'];
        data_array.push(['Subfeatures', name, start, end]);
        labels[name] = true;

        if(min_start == null || start < min_start) {
            min_start = start;
        }
        if(max_end == null || end > max_end) {
            max_end = end;
        }
    }
    var start = 0;
    var end = seq_end*100 - seq_start*100 + 100;
    var show_row_lables = false;
    if(min_start == null || max_end == null || min_start > 0 || max_end < end) {
        if(start == 100) {
            start = 0;
        }
        data_array.unshift(['Locus', display_name, start, end]);
        labels[display_name] = true;
        show_row_lables = true;
    }
    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'timeline': {'hAxis': {'position': 'none'},
                    'showRowLabels': show_row_lables},
        'tooltip': {'isHTML': true}
    }

    chart.draw(dataTable, options);
    google.visualization.events.addListener(chart, 'ready', make_sublabel_ready_handler(chart_id, chart, seq_start, seq_end, data, data_array));

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;
    if(options['height'] <= 105) {
        can_color = true;
    }

    chart.draw(dataTable, options);
}

var can_color = false;

function color_sequence(seq_id, data) {


    if(data['tags'].length > 1) {

        var reference_legend = $("#reference_legend");
        reference_legend.html('');
        for(var key in label_to_color) {
            var new_entry = document.createElement('li');
            new_entry.innerHTML = '<span style="color:' + label_to_color[key] + '">&#9608;</span> ' + key;
            reference_legend.append(new_entry);
        }

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
        var coord_version = data['tags'][i]['coord_version'];
        var seq_version = data['tags'][i]['seq_version'];
        if(coord_version == 'None') {
            coord_version = '';
        }
        if(seq_version == 'None') {
            seq_version = '';
        }
        var coords = '';
        if(data['tags'][i]['chromosomal_start'] < data['tags'][i]['chromosomal_end']) {
            coords = data['tags'][i]['chromosomal_start'] + '-' + data['tags'][i]['chromosomal_end'];
        }
        else {
            coords = data['tags'][i]['chromosomal_end'] + '-' + data['tags'][i]['chromosomal_start'];
        }
        datatable.push([data['id'], data['locus']['id'], data['locus']['display_name'], data['locus']['format_name'],
                        data['tags'][i]['display_name'],
                        data['tags'][i]['relative_start'] + '-' + data['tags'][i]['relative_end'],
                        coords, data['strand'],
                        coord_version, seq_version
                        ]);
    }

    set_up_header('subfeature_table', datatable.length, 'subfeature', 'subfeatures', null, null, null);

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[5, "asc"]];
    options["aoColumns"] = [
        {"bSearchable":false, "bVisible":false},
        {"bSearchable":false, "bVisible":false},
        {"bSearchable":false, "bVisible":false},
        {"bSearchable":false, "bVisible":false},
        null,
        { "sType": "range" },
        { "sType": "range" },
        {"bSearchable":false, "bVisible":false}, null, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No subfeatures for " + display_name + '.'};

    return create_table("subfeature_table", options);
}