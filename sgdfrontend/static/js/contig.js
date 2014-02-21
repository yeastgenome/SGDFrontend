
$(document).ready(function() {


  	$.getJSON(sequence_details_link, function(data) {
        set_up_sequence("sequence_div", data);
  	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("sequence");
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
    var min_tick = 0;
    var max_tick = length;

    for (var i=0; i < data.length; i++) {
        var start = data[i]['start'];
        var end = data[i]['end'];
        var direction = strand_to_direction(data[i]['strand']);
        if(direction == "5'") {
            data_array.unshift([direction, data[i]['bioentity']['display_name'], start, end]);
            has_five_prime = true;
        }
        else {
            data_array.push([direction, data[i]['bioentity']['display_name'], start, end]);
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
    var myColors = ['#A4A4A4'];

    var options = {
        'height': 200,
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
    var space = 1000;
    if(max_tick > 30000) {
        space = 30000;
    }
    if(max_tick > 60000) {
        space = 60000;
    }
    for (var i=0; i < tickmarks.length; i++) {
        if(i==0) {
            tickmarks[i].innerHTML = 1;
        }
        else {
            tickmarks[i].innerHTML = min_tick + space*i;
        }

    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
}
