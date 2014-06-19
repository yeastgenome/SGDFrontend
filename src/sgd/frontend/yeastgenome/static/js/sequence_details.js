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
//                if(dna_data[i]['strand'] == '-') {
//                    $("#reference_contig").html('<a href="' + dna_data[i]['contig']['link'] + '">' + dna_data[i]['contig']['display_name'] + '</a>: ' + dna_data[i]['end'] + ' - ' + dna_data[i]['start']);
//                }
//                else {
//                    $("#reference_contig").html('<a href="' + dna_data[i]['contig']['link'] + '">' + dna_data[i]['contig']['display_name'] + '</a>: ' + dna_data[i]['start'] + ' - ' + dna_data[i]['end']);
//                }

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
            if('S288C' in strain_to_genomic_data) {
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
                    //color_sequence("reference_sequence", strain_to_genomic_data['S288C']);
                }
            }
            else {
                hide_section("reference");
            }

        }
        $("#reference_chooser").change(reference_on_change);
        reference_on_change();

        function alternative_on_change() {
            if(alternative_selection.val() in strain_to_genomic_data) {
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
            else {
                hide_section("alternative");
            }
        }
        alternative_selection.change(alternative_on_change);
        $("#alternative_chooser").change(alternative_on_change);
        alternative_on_change();

        function other_on_change() {
            if(other_selection.val() in strain_to_genomic_data) {
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
            else {
                hide_section("other");
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

    $.getJSON(history_details_link, function(data) {
        var sequence_data = [];
        for(var i=1; i < data.length; i++) {
            if(data[i]['history_type'] == 'SEQUENCE') {
                sequence_data.push(data[i]);
            }
        }
        if(sequence_data.length > 0) {
            draw_history_chart('history_chart', sequence_data);
            var history_table = create_history_table(sequence_data);
            create_download_button("history_table_download", history_table, download_table_link, history_table_filename);
        }
        else {
            hide_section("history");
        }
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


function color_sequence(seq_id, data) {
    var tags = data['tags'];
    tags.sort(function(a, b){return a['relative_start']-b['relative_start']});
    if(tags.length > 1) {
        var num_digits = ('' + data['residues'].length).length;

        var seq = $("#" + seq_id).html();
        var new_seq = '';
        var start = 0;
        for (var i=0; i < tags.length; i++) {
            var color;
            if(tags[i]['display_name'] in label_to_color) {
                color = label_to_color[tags[i]['display_name']];

                var start_index = tags[i]['relative_start']-1;
                var end_index = tags[i]['relative_end'];

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

function create_history_table(data) {
    var options = {"bPaginate":  true,
                    "aaSorting": [[4, "asc"]],
                    "aoColumns":  [
                        {"bSearchable":false, "bVisible":false}, //Evidence ID
                        {"bSearchable":false, "bVisible":false}, //Analyze ID
                        {"bSearchable":false, "bVisible":false}, //Gene
                        {"bSearchable":false, "bVisible":false}, //Gene Systematic Name
                        null, //Date
                        null, //Note
                        null //Reference
                    ]
    };


    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        for (var i=0; i < data.length; i++) {
            datatable.push(history_data_to_table(data[i], i));
        }

        set_up_header('history_table', datatable.length, 'entry', 'entries');

        options["oLanguage"] = {"sEmptyTable": "No history data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("history_table", options);
}

function draw_history_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Position' });
    dataTable.addColumn({ type: 'string', id: 'Category' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });

    var data_array = [['History', "SGD Goes Live", new Date(1990, 8, 8), new Date(1990, 8, 8)]];

    for (var i=0; i < data.length; i++) {
        var date_values = data[i]['date_created'].split('-');
        var start = new Date(parseInt(date_values[0]), parseInt(date_values[1])-1, parseInt(date_values[2]));
        data_array.push(['History', data[i]['category'], start, start]);
    }
    data_array.push(['History', 'Today', new Date(), new Date()])

    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'timeline': {'hAxis': {'position': 'none'},
                    'showRowLabels': false,
                    'groupByRowLabel': true,
                    'colorByRowLabel': true},

        'tooltip': {'isHTML': true}
    }

    chart.draw(dataTable, options);

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;

    chart.draw(dataTable, options);
}