
$(document).ready(function() {


  	$.getJSON(sequence_details_link, function(data) {
        var alternative_selection = $("#alternative_strain_selection");
        var other_selection = $("#other_strain_selection");
        var strain_to_data = {};
        for (var i=0; i < data.length; i++) {
            if(data[i]['strain']['display_name'] == 'S288C') {
                $("#reference_sequence").html(data[i]['sequence']['residues'].chunk(10).join(' '));
                $("#reference_contig").html('<a href="' + data[i]['contig']['link'] + '">' + data[i]['contig']['display_name'] + '</a>: ' + data[i]['start'] + ' - ' + data[i]['end']);
                draw_label_chart('reference_label_chart', data[i]);
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
            $("#navbar_alternative").children()[0].innerHTML = 'Alternative Reference Strains <span class="subheader">' + '- ' + alternative_selection.val() + '</span>';
            $("#alternative_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
            draw_label_chart('alternative_label_chart', strain_data);
        }
        alternative_selection.change(function() {alternative_on_change()});
        alternative_on_change();

        function other_on_change() {
            var strain_data = strain_to_data[other_selection.val()];
            $("#other_sequence").html(strain_data['sequence']['residues'].chunk(10).join(' '));
            $("#navbar_other").children()[0].innerHTML = 'Other Strains <span class="subheader">' + '- ' + other_selection.val() + '</span>';
            $("#other_contig").html('<a href="' + strain_data['contig']['link'] + '">' + strain_data['contig']['display_name'] + '</a>: ' + strain_data['start'] + ' - ' + strain_data['end']);
            draw_label_chart('other_label_chart', strain_data);
        }
        other_selection.change(function() {other_on_change()});
        other_on_change();
  	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

var colors = ["#2E2EFE", "#FA5858", "#088A08", "#F3F781", "#9F81F7"];
var color_index = 0;

function set_up_strain(data) {
    var strain_name = data['strain']['format_name'];
    var strains = $("#strains");

    var header = document.createElement('h2');
    header.className = "subheader";
    header.innerHTML = data['strain']['display_name'];
    if(data['strain']['description'] != null) {
        header.innerHTML = header.innerHTML + ' <small>(' + data['strain']['description'] + ')</small>'
    }
    strains.append(header);

    var sequence_labels = document.createElement('div');
    sequence_labels.id = strain_name + '_labels';
    strains.append(sequence_labels);

    if(data['contig'] != null) {
        var chromosome = document.createElement('div');
        chromosome.innerHTML = '<a href="' + data['contig']['link'] + '">' + data['contig']['display_name'] + '</a>: ' + data['start'] + ' - ' + data['end'];
        strains.append(chromosome);
    }

    var sequence = document.createElement('blockquote');
    sequence.innerHTML = data['sequence']['residues'].chunk(10).join(' ');
    sequence.style.fontFamily = "Monospace";
    strains.append(sequence);

    draw_label_chart(strain_name + '_labels', data);

    var label_to_color = {};
    if(data['sequence_labels'].length > 1) {
        var seq = sequence.innerHTML;
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
        sequence.innerHTML = new_seq;
    }
}

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
    var min_tick = data['start'];
    var max_tick = data['end'];

    if(data['strand'] == "+") {
        has_five_prime = true;
    }
    else {
        has_three_prime = true;
    }

    if(data['sequence_labels'].length > 0) {
        for (var i=0; i < data['sequence_labels'].length; i++) {
            var start = data['sequence_labels'][i]['relative_start'] + data['start'];
            var end = data['sequence_labels'][i]['relative_end'] + data['start'];
            var name = data['sequence_labels'][i]['display_name'];
            if(name == 'CDS') {
                name = display_name;
            }
            data_array.push([strand_to_direction(data['strand']), name, start, end]);
            labels[name] = true;
        }
    }
    else {
        var start = data['start'];
        var end = data['end'];
        data_array.push([strand_to_direction(data['strand']), display_name, start, end]);
        labels[display_name] = true;
    }

    var before_count = 0;
    for (var i=0; i < data['neighbors'].length; i++) {
        var start = data['neighbors'][i]['start'];
        var end = data['neighbors'][i]['end'];
        var direction = strand_to_direction(data['neighbors'][i]['strand']);
        if(direction == "5'") {
            data_array.unshift([direction, data['neighbors'][i]['display_name'], start, end]);
            if(data['neighbors'][i]['start'] < data['start'] || data['strand'] != '+') {
                before_count = before_count + 1;
            }
            has_five_prime = true;
        }
        else {
            data_array.push([direction, data['neighbors'][i]['display_name'], start, end]);
            if(data['neighbors'][i]['start'] < data['start'] && data['strand'] != '+') {
                before_count = before_count + 1;
            }
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
        before_count = before_count + 1
    }
    if(!has_three_prime) {
        data_array.push(["3'", '', null, null]);
    }

    dataTable.addRows(data_array);
    var myColors = [];
    for(var i=0; i < before_count; i++) {
        myColors.push('#A4A4A4');
    }
    for(var i=0; i < Object.keys(labels).length; i++) {
        myColors.push(colors[i]);
    }
    for(var i=0; i < data['neighbors'].length - before_count; i++) {
        myColors.push('#A4A4A4');
    }
    if(!has_five_prime || !has_three_prime) {
        myColors.push('#A4A4A4');
    }

    var options = {
        'height': 135,
        'timeline': {'hAxis': {'position': 'none'}},
        'colors': myColors,
        //'enableInteractivity': false,
        'tooltip': {'isHTML': true}
    }



    chart.draw(dataTable, options);

    function tooltipHandler(e) {
        var datarow = data_array[e.row];
        var spans = $(".google-visualization-tooltip-action > span");
        spans[1].innerHTML = ' ' + datarow[2] + '-' + datarow[3];
        spans[2].innerHTML = 'Length:';
        spans[3].innerHTML = ' ' + datarow[3] - datarow[2] + 1;
    }

    var tickmark_holder = $("#" + chart_id + " > div > div > svg > g")[1];
    var tickmarks = tickmark_holder.childNodes;
    min_tick = Math.floor(1.0*min_tick/1000)*1000;
    for (var i=0; i < tickmarks.length; i++) {
       tickmarks[i].innerHTML = min_tick + 1000*i;
    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
}

function set_up_sankey(data) {
    var row_length = 10;
    var char_length = 10;
    for(var k=0; k < data[0]['sequence']['residues'].length; k=k+row_length*char_length) {
        var datatable = new google.visualization.DataTable();
        datatable.addColumn('string', 'From');
        datatable.addColumn('string', 'To');
        datatable.addColumn('number', 'Weight');

        var rows = [];
        for(var i=0; i < row_length*char_length; i=i+char_length) {
             var transitions = {};
             for(var j=0; j < data.length; j++) {
                 var transition = data[j]['sequence']['residues'].substring(k+i, k+i+(2*char_length));
                 if(transition in transitions) {
                    transitions[transition] = transitions[transition] + 1;
                 }
                 else {
                    transitions[transition] = 1;
                 }
             }

             var transition_keys = Object.keys(transitions)
             for(var j=0; j < transition_keys.length; j++) {
                var transition_key = transition_keys[j];
                rows.push([transition_key.substring(0, char_length) + (k+i), transition_key.substring(char_length, 2*char_length) + (k+i+char_length), transitions[transition_key]]);
             }

        }
        $("#output").html(rows);

        datatable.addRows(rows);

        var parent_div = $("#sankey_multiple");
        var child_div = document.createElement('div');
        child_div.id = 'sankey_multiple' + k;
        parent_div.append(child_div);
        // Instantiate and draw our chart, passing in some options.
        var chart = new google.visualization.Sankey(document.getElementById('sankey_multiple' + k));
        chart.draw(datatable, {height: 100});
    }
}