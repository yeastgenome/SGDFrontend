
$(document).ready(function() {
  	$.getJSON(sequence_details_link, function(data) {
        for (var i=0; i < data.length; i++) {
            set_up_strain(data[i]);
        }
  	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

String.prototype.chunk = function(n) {
    var ret = [];
    for(var i=0, len=this.length; i < len; i += n) {
       ret.push(this.substr(i, n))
    }
    return ret
};

var colors = ["#2E2EFE", "#FA5858", "#088A08", "#F3F781", "#9F81F7"];
var color_index = 0;

function set_up_strain(data) {
    var strain_name = data['strain']['display_name'];
    var strains = $("#strains");

    var header = document.createElement('h2');
    header.className = "subheader";
    header.innerHTML = strain_name;
    if(data['strain']['description'] != null) {
        header.innerHTML = header.innerHTML + ' <small>(' + data['strain']['description'] + ')</small>'
    }
    strains.append(header);

    var sequence_labels = document.createElement('div');
    sequence_labels.id = strain_name + '_labels';
    strains.append(sequence_labels);

    if(data['contig'] != null) {
        var chromosome = document.createElement('div');
        chromosome.innerHTML = data['contig']['display_name'] + ': ' + data['start'] + ' - ' + data['end'];
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
        'timeline': {'hAxis': {'position': 'none'},
                        'enableInteractivity': false,
                    },
        'colors': myColors
    };

    chart.draw(dataTable, options);
}