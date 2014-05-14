
$(document).ready(function() {
  	$.getJSON(expression_details_link, function(data) {
  	    var expression_table = create_expression_table(data);
        create_download_button("expression_table_download", expression_table, download_table_link, download_table_filename);
        $("#expression_table_analyze").hide();
        create_expression_chart(data);
  	});

//  	$.getJSON(expression_details_link, function(data) {
//  		if(data['nodes'].length > 1) {
//  			var graph = create_cytoscape_vis("cy", layout, graph_style, data);
//  		}
//		else {
//			hide_section("network");
//		}
//	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function create_expression_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {'sWidth': '250px'}, null];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var geo_ids = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(expression_data_to_table(data[i], i));
            geo_ids[data[i]['geo_id']] = true;
        }

        set_up_header('expression_table', datatable.length, 'entry', 'entries', Object.keys(geo_ids).length, 'GEO ID', 'GEO IDS');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null];
        options["oLanguage"] = {"sEmptyTable": "No expression data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("expression_table", options);
}
google.load("visualization", "1", {packages:["corechart"]});

function create_expression_chart(data) {
    google.setOnLoadCallback(drawChart);
    function drawChart() {
        var datatable = [['Name', 'Number']];
        for (var i=0; i < data.length; i++) {
            datatable.push([data[i]['condition'], data[i]['value']]);
        }
        var chartdata = google.visualization.arrayToDataTable(datatable);

        var options = {
            title: 'Number of experiments vs. log2 ratios',
            legend: { position: 'none' },
            height: 300
        };

        var chart = new google.visualization.Histogram(document.getElementById('expression_chart'));
        chart.draw(chartdata, options);
    }
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
		'width': 2
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
