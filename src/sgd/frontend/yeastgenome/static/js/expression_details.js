
$(document).ready(function() {
  	$.getJSON(expression_details_link, function(data) {
  	    var expression_table = create_expression_table(data);
        create_download_button("expression_table_download", expression_table, download_table_link, download_table_filename);
        $("#expression_table_analyze").hide();
        create_expression_chart(data);
  	});

  	$.getJSON(expression_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
            var graph = create_cytoscape_vis("cy", layout, graph_style, data, null, true);
  		}
		else {
			hide_section("network");
		}
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function create_expression_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, null];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var geo_ids = {};
        var evidence_ids = {};
        var new_data = [];
        for (var i=0; i < data.length; i++) {
            if(!(data[i]['dataset']['pcl_filename'] in evidence_ids)) {
                datatable.push(expression_data_to_table(data[i], i));
                evidence_ids[data[i]['dataset']['pcl_filename']] = true;
                geo_ids[data[i]['geo_id']] = true;
            }
        }

        set_up_header('expression_table', datatable.length, 'entry', 'entries');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null];
        options["oLanguage"] = {"sEmptyTable": "No expression data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("expression_table", options);
}
google.load("visualization", "1", {packages:["corechart"]});

function create_expression_chart(data) {
    data.sort(function(a, b) {return b['value'] - a['value']});
    var datatable2 = [['Low', 'Medium', 'High']];
    var datatable_left = [['Name', 'Number']];
    var datatable_left_links = [];
    var datatable_right = [['Name', 'Number']];
    var datatable_right_links = [];

    var sum = 0;
    var sum_of_squares = 0;
    var n = 0;
    for (var i=0; i < data.length; i++) {
        var value = data[i]['value'];
        sum = sum + value;
        sum_of_squares = sum_of_squares + value*value;
        n = n + 1;
    }
    var mean = 1.0*sum/n;
    var variance = 1.0*sum_of_squares/n - mean*mean;
    var standard_dev = Math.sqrt(variance);

    for (var i=0; i < data.length; i++) {
        if(data[i]['value'] <= (mean - 2*standard_dev)) {
            datatable_left.push([data[i]['condition'], data[i]['value']]);
            datatable_left_links.push(data[i]['dataset']['link']);
            datatable2.push([data[i]['value'], null, null]);
        }
        else if(data[i]['value'] >= (mean + 2*standard_dev)) {
            datatable_right.push([data[i]['condition'], data[i]['value']]);
            datatable_right_links.push(data[i]['dataset']['link']);
            datatable2.push([null, null, data[i]['value']]);
        }
        else {
            datatable2.push([null, data[i]['value'], null]);
        }
    }

    var left_chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart_left'));
    left_chart.draw(google.visualization.arrayToDataTable(datatable_left), {
                                title: 'Low-Expression Experiments',
                                legend: { position: 'none' },
                                hAxis: {title: 'log2 ratio'},
                                vAxis: {title: 'Number of experiments'},
                                height: 300,
                                colors: ['#7FBF7B']
                            });

    var right_chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart_right'));
    right_chart.draw(google.visualization.arrayToDataTable(datatable_right), {
                                title: 'High-Expression Experiments',
                                legend: { position: 'none' },
                                hAxis: {title: 'log2 ratio'},
                                vAxis: {title: 'Number of experiments'},
                                height: 300,
                                colors: ['#AF8DC3']
                            });

    var chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart'));
    chart.draw(google.visualization.arrayToDataTable(datatable2), {
                                title: 'All Experiments',
                                legend: { position: 'none' },
                                hAxis: {title: 'log2 ratio'},
                                vAxis: {title: 'Number of experiments'},
                                height: 300,
                                colors: ['#7FBF7B', '#888', '#AF8DC3'],
                                isStacked: true
                            });

    // The select handler. Call the chart's getSelection() method
    function leftSelectHandler() {
        var selectedItem = left_chart.getSelection();
        window.location = datatable_left_links[selectedItem[0].row];
    }
    function rightSelectHandler() {
        var selectedItem = right_chart.getSelection();
        window.location = datatable_right_links[selectedItem[0].row];
    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(left_chart, 'select', leftSelectHandler);
    google.visualization.events.addListener(right_chart, 'select', rightSelectHandler);
}

var graph_style = cytoscape.stylesheet()
	.selector('node')
	.css({
		'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 14,
		'text-outline-width': 3,
		'text-outline-color': '#888',
		'text-valign': 'center',
		'color': '#fff',
		'width': 30,
		'height': 30,
		'border-color': '#fff'
	})
	.selector('edge')
	.css({
		'width': 'data(score)'
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[type='PHENOTYPE']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888',
		'background-color': "#D0A9F5"
    })
    .selector("edge[direction = 'positive']")
	.css({
		'line-color': "#AF8DC3"
	})
	.selector("edge[direction = 'negative']")
	.css({
		'line-color': "#7FBF7B"
	});

var layout = {
	"name": "arbor",
	"liveUpdate": true,
	"ungrabifyWhileSimulating": true,
	"nodeMass":function(data) {
		if(data.sub_type == 'FOCUS') {
			return 10;
		}
		else {
			return 1;
		}
	}
};
