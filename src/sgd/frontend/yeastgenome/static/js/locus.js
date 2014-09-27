
var chromosome = null;

$(document).ready(function() {

    $("#subfeature_table_analyze").hide();
    $("#subfeature_table_download").hide();

  	$.getJSON('/backend/locus/' + locus['id'] + '/sequence_details?callback=?', function(data) {
        var genomic_data = null;
        var protein_data = null;
        var coding_data = null;
        var kb_data = null;

        for (var i = 0; i < data['genomic_dna'].length; i++) {
            if (data['genomic_dna'][i]['strain']['display_name'] == 'S288C') {
                genomic_data = data['genomic_dna'][i];
            }
        }

        for (i = 0; i < data['protein'].length; i++) {
            if (data['protein'][i]['strain']['display_name'] == 'S288C') {
                protein_data = data['protein'][i];
            }
        }

        for (i = 0; i < data['coding_dna'].length; i++) {
            if (data['coding_dna'][i]['strain']['display_name'] == 'S288C') {
                coding_data = data['coding_dna'][i];
            }
        }

        for (i = 0; i < data['1kb'].length; i++) {
            if (data['1kb'][i]['strain']['display_name'] == 'S288C') {
                kb_data = data['1kb'][i];
            }
        }

        if (genomic_data != null) {
            chromosome = genomic_data['contig']['display_name'];
            $("#contig").html('<a href="' + genomic_data['contig']['link'] + '">' + genomic_data['contig']['display_name'] + '</a>: ' + genomic_data['start'] + ' - ' + genomic_data['end']);
            draw_label_chart('label_chart', genomic_data['strain']['format_name']);
            draw_sublabel_chart('sublabel_chart', genomic_data);
            create_subfeature_table(genomic_data);

            $("#genomic_download").click(function f() {
                download_sequence(genomic_data['residues'], locus['display_name'], genomic_data['contig']['display_name']);
            });
        }
        else {
            hide_section('sequence');
        }

        if(coding_data != null) {
            $("#coding_download").click(function f() {
                download_sequence(coding_data['residues'], locus['display_name'], strain_selection.val() + ' coding_dna');
            });
        }
        else {
            $("#coding_download").hide();
        }

        if(protein_data != null) {
            $("#protein_download").click(function f() {
                download_sequence(protein_data['residues'], locus['display_name'], strain_selection.val() + ' protein');
            });
        }
        else {
            $("#protein_download").hide();
        }

        if(kb_data != null) {
            $("#kb_download").click(function f() {
                download_sequence(kb_data['residues'], locus['display_name'], genomic_data['contig']['display_name'] + ' flanking');
            });
        }
        else {
            $("#kb_download").hide();
        }

    });

    $.getJSON('/backend/locus/' + locus['id'] + '/neighbor_sequence_details?callback=?', function(data) {
        strain_to_neighbors = data;
        draw_label_chart('label_chart', 'S288C');
    });

    $.getJSON('/backend/locus/' + locus['id'] + '/expression_details?callback=?', function(data) {
        create_expression_chart(data['overview'], data['min_value'], data['max_value']);
  	});

    if(locus['paragraph'] != null) {
        document.getElementById("summary_paragraph").innerHTML = locus['paragraph']['text'];
    }

    set_up_history_table();
    set_up_reference_list("reference_header", "reference_list", locus['references']);
});

function set_up_reference_list(header_id, list_id, data) {
    data.sort(function(a, b) {return b['year'] - a['year']});

    set_up_header(null, header_id, data.length, 'reference', 'references');
	set_up_references(data, list_id);
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

        var colors5 = [];
        var colors3 = [];

        var colors5_row2 = [];
        var colors3_row2 = [];

        var colors5_row3 = [];
        var colors3_row3 = [];

        data_array.push(["5'", '', min_tick, min_tick]);
        data_array.push(["3'", '', min_tick, min_tick]);
        var previous_end_5 = 0;
        var previous_end_3 = 0;
        var previous_end5_2 = 0;
        var previous_end3_2 = 0;

        for (var i=0; i < data.length; i++) {
            var start = Math.max(data[i]['start'], min_tick);
            var end = Math.min(data[i]['end'], max_tick);
            var direction = strand_to_direction(data[i]['strand']);
            display_name_to_format_name[data[i]['locus']['display_name']] = data[i];
            var color;
            if(data[i]['locus']['display_name'] == locus['display_name']) {
                color = "#3366cc";
            }
            else {
                color = "#A4A4A4";
            }
            if(direction == "5'") {
                if(previous_end_5 <= start) {
                    colors5.push(color);
                    previous_end_5 = Math.max(previous_end_5, end);
                }
                else if(previous_end5_2 <= start) {
                    if(i==1) {
                        previous_end5_2 = previous_end_5;
                        colors5_row2 = colors5;
                        previous_end_5 = end
                        colors5 = [color];
                    }
                    else {
                        colors5_row2.push(color);
                        previous_end5_2 = Math.max(previous_end5_2, end);
                    }
                }
                else {
                    colors5_row3.push(color);
                }
            }
            else {
                if(previous_end_3 <= start) {
                    colors3.push(color);
                    previous_end_3 = Math.max(previous_end_3, end);
                }
                else if(previous_end3_2 <= start) {
                    if(i==1) {
                        previous_end3_2 = previous_end_3;
                        colors3_row2 = colors3;
                        previous_end_3 = end
                        colors3 = [color];
                    }
                    else {
                        colors3_row2.push(color);
                        previous_end3_2 = Math.max(previous_end3_2, end);
                    }
                }
                else {
                    colors3_row3.push(color);
                }
            }

            data_array.push([direction, data[i]['locus']['display_name'], start, end]);
        }

        data_array.push(["5'", '', max_tick, max_tick]);
        data_array.push(["3'", '', max_tick, max_tick]);

        dataTable.addRows(data_array);

        var colors5 = ['#D8D8D8'].concat(colors5).concat(colors5_row2).concat(colors5_row3);
        var colors3 = ['#D8D8D8'].concat(colors3).concat(colors3_row2).concat(colors3_row3);
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
        data_array.push(['Relative Coordinates', name, start, end]);
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
        data_array.unshift(['Locus', locus['display_name'], start, end]);
        labels[locus['display_name']] = true;
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

    chart.draw(dataTable, options);
}

function set_up_history_table() {
    var options = {};
    options["aoColumns"] = [
                {"bSearchable":false, "bVisible":false}, //evidence_id
                {"bSearchable":false, "bVisible":false}, //analyze_id
                {"bSearchable":false, "bVisible":false}, //gene
                {"bSearchable":false, "bVisible":false}, //gene systematic name
                null, //date
                null, //note
                null //references
                ];
    options["bPaginate"] = false;
    options["aaSorting"] = [[4, "asc"]];

    var datatable = [];
    for (var i=0; i < locus['history'].length; i++) {
        if(locus['history'][i]['history_type'] == 'LSP' || sequence_tab == 'False') {
            datatable.push(history_data_to_table(locus['history'][i]));
        }
    }

    if(datatable.length > 0) {
        options["oLanguage"] = {"sEmptyTable": "No history entries for " + locus['display_name'] + '.'};
        options["aaData"] = datatable;

        $('#history_table_analyze').hide();
        $('#history_table_download').hide();

        return create_table("history_table", options);
    }
    else {
        hide_section('history');
    }
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
    options["bDestroy"] = true;
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
    options["oLanguage"] = {"sEmptyTable": "No subfeatures for " + locus['display_name'] + '.'};
    options['sDom'] = 't'

    return create_table("subfeature_table", options);
}

function create_expression_chart(all_data, min_value, max_value) {
    if(all_data != null && Object.keys(all_data).length > 0) {
        var capped_min = Math.max(-5.5, min_value);
        var capped_max = Math.min(5, max_value);
        var header_row = [];
        var colors = [];
        var indexes = [];
        if(capped_min == -5.5) {
            header_row.push('Low-Extreme');
            colors.push('#13e07a');
        }
        indexes.push(header_row.length-1);
        if(capped_min < 0) {
            header_row.push('Low');
            colors.push('#0d9853');
        }
        indexes.push(header_row.length-1);
        if(capped_max >= 0) {
            header_row.push('High');
            colors.push('#980D0D');
        }
        indexes.push(header_row.length-1);
        if(capped_max == 5) {
            header_row.push('High-Extreme');
            colors.push('#e01313');
        }
        indexes.push(header_row.length-1);

        var datatable2 = [header_row];

        for (var key in all_data) {
            var value = parseFloat(key);
            if(value == -5.5) {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[0]] = value;
                    datatable2.push(new_row);
                }
            }
            else if(value < 0) {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[1]] = value;
                    datatable2.push(new_row);
                }
            }
            else if(value == 5) {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[3]] = value;
                    datatable2.push(new_row);
                }
            }
            else {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[2]] = value;
                    datatable2.push(new_row);
                }
            }
        }

        var options = {
                                        legend: { position: 'none' },
                                        hAxis: {title: 'log2 ratio', viewWindow: {min: -5.5, max: 5.5}},
                                        vAxis: {title: 'Number of conditions', logScale:true},
                                        height: 300,
                                        colors: colors,
                                        histogram: {bucketSize:.5, hideBucketItems:true},
                                        isStacked: true,
                                        titlePosition: 'none',
                                        tooltip: {trigger: 'none'}

        };
        var chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart'));
        google.visualization.events.addListener(chart, 'ready', make_expression_ready_handler(min_value, max_value));
        chart.draw(google.visualization.arrayToDataTable(datatable2), options);

        // The select handler. Call the chart's getSelection() method
        function selectHandler() {
            window.location.href = '/locus/' + locus['sgdid'] + '/expression';
        }
        google.visualization.events.addListener(chart, 'select', selectHandler);
    }
}

function make_expression_ready_handler(min_value, max_value) {
    function ready_handler() {
        $("text:contains('-5.5')").first().html(min_value.toFixed(1));
        $("text:contains('5.5')").first().html(max_value.toFixed(1));
    }
    return ready_handler;
}