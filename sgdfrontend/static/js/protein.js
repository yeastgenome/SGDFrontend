google.load("visualization", "1", {packages:["corechart"]});

$(document).ready(function() {

    $.getJSON(protein_domains_link, function(data) {
        var domain_table = create_domain_table("domains_table", "domains_header", "No known domains for " + display_name + ".", data);
        create_download_button("domains_table_download", domain_table, download_table_link, domains_table_filename);
        draw_domain_chart("domain_chart", data);
	});

    $.getJSON(protein_domain_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
  			var graph = create_cytoscape_vis("cy", layout, graph_style, data);
  		}
		else {
			hide_section("network");
		}
	});

    draw_chart()

    //Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function draw_chart() {
    google.load("visualization", "1", {packages:["corechart"]});
    google.setOnLoadCallback(drawChart);
    function drawChart() {
        var data = google.visualization.arrayToDataTable([
          ['Amino Acid', 'Count'],
          ['Ala',   26],
          ['Arg',   18],
          ['Asn',   9],
          ['Asp',   20],
          ['Cys',   4],
          ['Gln',   14],
          ['Glu',   27],
          ['Gly',   29],
          ['His',   10],
          ['Ile',   30],
          ['Leu',   25],
          ['Lys',   18],
          ['Met',   16],
          ['Phe',   14],
          ['Pro',   19],
          ['Ser',   31],
          ['Thr',   21],
          ['Trp',   4],
          ['Tyr',   14],
          ['Val',   26],
        ]);

        var options = {
          title: 'Amino Acid Composition',
          legend: 'none',
          pieSliceText: 'label',
          width:500,
          height:500

        };

        var chart = new google.visualization.PieChart(document.getElementById('amino_acid_composition'));
        chart.draw(data, options);

        var data = google.visualization.arrayToDataTable([
          ['Atom', 'Count'],
          ['Carbon',     1853],
          ['Hydrogen',   2906],
          ['Nitrogen',   494],
          ['Oxygen',     559],
          ['Sulfur',     20]
        ]);

        var options = {
          title: 'Atomic Composition',
          legend: 'none',
          pieSliceText: 'label',
          width:500,
          height:500
        };

        var chart = new google.visualization.PieChart(document.getElementById('atomic_composition'));
        chart.draw(data, options);
    }
}

function create_domain_table(div_id, header_id, message, data) {
	var datatable = [];

    for (var i=0; i < data.length; i++) {
        datatable.push(domain_data_to_table(data[i]));
    }

    $("#" + header_id).html(data.length);

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[2, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": message};

    return create_table(div_id, options);
}

function draw_domain_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Domain' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });

    var data_array = [];
    var domains = {};

    for (var i=0; i < data.length; i++) {
        var start = new Date()
        start.setFullYear(data[i]['start'])
        var end = new Date()
        end.setFullYear(data[i]['end'])
        data_array.push([data[i]['domain']['display_name'], data[i]['domain']['display_name'], start, end]);
        domains[data[i]['domain']['id']] = true;
    }
    dataTable.addRows(data_array);

    var options = {
        'height': 50*Object.keys(domains).length + 35,
        'timeline': {'showRowLabels': false,
                        'hAxis': {'position': 'none'},
                        'enableInteractivity': false
        },
    };
    chart.draw(dataTable, options);
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
		'width': 2,
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888',
	})
	.selector("node[type='BIOITEM']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888',
		'background-color': "#D0A9F5",
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