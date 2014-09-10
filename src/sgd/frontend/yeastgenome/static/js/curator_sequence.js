
var label_to_color1 = {};
var label_to_color2 = {};
var chromosome1 = null;
var chromosome2 = null;

var residues1 = null;
var residues2 = null;

var can_color1 = false;
var can_color2 = false;

$(document).ready(function() {

    $("#subfeature_table_analyze").hide();
  	get_json(sequence_details_link, function(data) {
        var dna_data = data['genomic_dna'];
        var strain_selection1 = $("#strain_selection1");
        var strain_selection2 = $("#strain_selection2");
        var strain_to_genomic_data = {};
        var strain_to_protein_data = {};
        var strain_to_coding_data = {};

        for (var i=0; i < dna_data.length; i++) {
            var strain_format_name = dna_data[i]['strain']['format_name'];
            var strain_display_name = dna_data[i]['strain']['display_name'];

            if(strain_format_name in strain_to_genomic_data) {
                var count = 1;
                while(strain_format_name in strain_to_genomic_data) {
                    strain_format_name = dna_data[i]['strain']['format_name'] + '_' + count;
                    strain_display_name = dna_data[i]['strain']['display_name'] + '_' + count;
                    count = count + 1;
                }
            }
            strain_to_genomic_data[strain_format_name] = dna_data[i];

            var option1 = document.createElement("option");
            option1.value = strain_format_name;
            option1.innerHTML = strain_display_name;

            var option2 = document.createElement("option");
            option2.value = strain_format_name;
            option2.innerHTML = strain_display_name;

            strain_selection1.append(option1);
            strain_selection2.append(option2);
        }

        var protein_data = data['protein'];
        for (i=0; i < protein_data.length; i++) {
            strain_to_protein_data[protein_data[i]['strain']['format_name']] = protein_data[i];
        }

        var coding_data = data['coding_dna'];
        for (i=0; i < coding_data.length; i++) {
            strain_to_coding_data[coding_data[i]['strain']['format_name']] = coding_data[i];
        }

        function on_strain_change() {
            //Get strains
            var strain1_data = strain_to_genomic_data[strain_selection1.val()];
            var strain2_data = strain_to_genomic_data[strain_selection2.val()];

            //Update headers
            $("#location1_header").html(strain1_data['strain']['display_name'])
            $("#subfeature1_header").html(strain1_data['strain']['display_name'])
            $("#sequence1_header").html(strain1_data['strain']['display_name'])
            $("#location2_header").html(strain2_data['strain']['display_name'])
            $("#subfeature2_header").html(strain2_data['strain']['display_name'])
            $("#sequence2_header").html(strain2_data['strain']['display_name'])

            //Set up Location section
            $("#contig1").html('<a href="' + strain1_data['contig']['link'] + '">' + strain1_data['contig']['display_name'] + '</a>: ' + strain1_data['start'] + ' - ' + strain1_data['end']);
            $("#contig2").html('<a href="' + strain2_data['contig']['link'] + '">' + strain2_data['contig']['display_name'] + '</a>: ' + strain2_data['start'] + ' - ' + strain2_data['end']);

            draw_label_chart('label_chart1', strain1_data['strain']['format_name']);
            draw_label_chart('label_chart2', strain2_data['strain']['format_name']);

            //Set up sublocation section
            draw_sublabel_chart('sublabel_chart1', strain1_data);
            draw_sublabel_chart('sublabel_chart2', strain2_data);

            //Set up Sequence section
            var mode = $("#sequence_type_chooser");
            residues1 = '';
            residues2 = '';
            if(mode.val() == 'genomic_dna') {
                residues1 = strain1_data['residues'];
                residues2 = strain2_data['residues'];
                chromosome1 = strain1_data['contig']['format_name'];
                chromosome2 = strain2_data['contig']['format_name'];
            }
            else if(mode.val() == 'coding_dna') {
                residues1 = strain_to_coding_data[strain_selection1.val()]['residues'];
                residues2 = strain_to_coding_data[strain_selection2.val()]['residues'];
                chromosome1 = strain_selection1.val() + ' coding_dna';
                chromosome2 = strain_selection2.val() + ' coding_dna';
            }
            else if(mode.val() == 'protein') {
                residues1 = strain_to_protein_data[strain_selection1.val()]['residues'];
                residues2 = strain_to_protein_data[strain_selection2.val()]['residues'];
                chromosome1 = strain_selection1.val() + ' protein';
                chromosome2 = strain_selection2.val() + ' protein';
            }

            $("#sequence1").html(prep_sequence(residues1));
            $("#sequence2").html(prep_sequence(residues2));

            mode.children('option[value=genomic_dna]')
                    .attr('disabled', !(strain_selection1.val() in strain_to_genomic_data && strain_selection2.val() in strain_to_genomic_data));
            mode.children('option[value=coding_dna]')
                    .attr('disabled', !(strain_selection1.val() in strain_to_coding_data && strain_selection2.val() in strain_to_coding_data));
            mode.children('option[value=protein]')
                    .attr('disabled', !(strain_selection1.val() in strain_to_protein_data && strain_selection2.val() in strain_to_protein_data));

        }
        strain_selection1.change(on_strain_change);
        strain_selection2.change(on_strain_change);
        $("#sequence_type_chooser").change(on_strain_change);
        on_strain_change();

        $("#download1").click(function f() {
            download_sequence(residues1, download_sequence_link, display_name, chromosome1);
        });
        $("#download2").click(function f() {
            download_sequence(residues2, download_sequence_link, display_name, chromosome2);
        });
    });

    get_json(neighbor_sequence_details_link, function(data) {
        strain_to_neighbors = data;

        draw_label_chart('label_chart1', $("#strain_selection1").val());
        draw_label_chart('label_chart2', $("#strain_selection2").val());
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
                    var chromosome = '';
                    if(chart_id.indexOf('1', chart_id.length - 1) !== -1) {
                        chromosome = chromosome1;
                    }
                    else if(chart_id.indexOf('2', chart_id.length - 1) !== -1) {
                        chromosome = chromosome2;
                    }
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

        var label_to_color;
        if(chart_id.indexOf('1', chart_id.length - 1) !== -1) {
            label_to_color = label_to_color1;
        }
        else if(chart_id.indexOf('2', chart_id.length - 1) !== -1) {
            label_to_color = label_to_color2;
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
        if(chart_id.indexOf('1', chart_id.length - 1) !== -1) {
            can_color1 = true;
        }
        else if(chart_id.indexOf('2', chart_id.length - 1) !== -1) {
            can_color2 = true;
        }
    }

    chart.draw(dataTable, options);
}

function color_sequence(seq_id, data) {
    var label_to_color;
    if(chart_id.indexOf('1', chart_id.length - 1) !== -1) {
        label_to_color = label_to_color1;
    }
    else if(chart_id.indexOf('2', chart_id.length - 1) !== -1) {
        label_to_color = label_to_color2;
    }

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
