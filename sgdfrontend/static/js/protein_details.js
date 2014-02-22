google.load("visualization", "1", {packages:["corechart"]});

var phosphodata = null;

$(document).ready(function() {

    $.getJSON(protein_domains_link, function(data) {
        var domain_table = create_domain_table("domains_table", "domains_header", "No known domains for " + display_name + ".", data);
        create_download_button("domains_table_download", domain_table, download_table_link, domains_table_filename);
        draw_domain_chart("domain_chart", data);
	});

    $("#domains_table_analyze").hide();
    $.getJSON(protein_domain_graph_link, function(data) {
  		if(data['nodes'].length > 1) {
  			var graph = create_cytoscape_vis("cy", layout, graph_style, data);
  		}
		else {
			hide_section("network");
		}
	});

    $.getJSON(protein_sequence_details_link, function(data) {
        var strain_selection = $("#strain_selection");
        for (var i=0; i < data.length; i++) {
            var option = document.createElement("option");
            option.setAttribute("value", data[i]['strain']['format_name']);
            option.innerHTML = data[i]['strain']['display_name'];
            strain_selection.append(option);

        }

        function on_change(index) {
            $("#sequence_residues").html(data[index]['sequence']['residues'].chunk(10).join(' '));
            $("#navbar_sequence").children()[0].innerHTML = 'Sequence <span class="subheader">' + '- ' + data[index]['strain']['display_name'] + '</span>';
            $("#length").html(data[index]['sequence']['length']);
            draw_phosphodata();
        }

        strain_selection.change(function() {on_change(this.selectedIndex)});
        on_change(0);
	});

    $.getJSON(protein_phosphorylation_details_link, function(data) {
        phosphodata = data;
        create_phosphorylation_table(data);
        draw_phosphodata();
	});

    //Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function draw_phosphodata() {
    if(phosphodata != null) {
        var additional = 0;
        for (var i=0; i < phosphodata.length; i++) {
            var index = phosphodata[i]['site_index'] + Math.floor(1.0*(phosphodata[i]['site_index']-1)/10) - 1 + additional;
            var residues = $("#sequence_residues");
            var old_residues = residues.html();
            if(phosphodata[i]['site_residue'] == old_residues.substring(index, index+1)) {
                residues.html(old_residues.substring(0, index) + "<span style='color:red'>" + old_residues.substring(index, index+1) + "</span>" + old_residues.substring(index+1, old_residues.length));
                additional = additional + 31;
            }
        }
    }
}

function create_phosphorylation_table(data) {
	var datatable = [];

    var sites = {};
    for (var i=0; i < data.length; i++) {
        datatable.push(phosphorylation_data_to_table(data[i]));
        sites[data[i]['site_residue'] + data[i]['site_index']] = true;
    }

    $("#phosphorylation_header").html(data.length);
    $("#phosphorylation_subheader").html(Object.keys(sites).length);

    if(Object.keys(sites).length == 1) {
        $("#phosphorylation_subheader_type").html('site');
    }
    else {
        $("#phosphorylation_subheader_type").html('sites');
    }
    if(datatable.length == 1) {
        $("#phosphorylation_header_type").html("entry for ");
    }
    else {
        $("#phosphorylation_header_type").html("entries for ");
    }

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": 'No phosphorylation data for ' + display_name + '.'};

    return create_table("phosphorylation_table", options);
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
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null]
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
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var descriptions = [];
    var domains = {};

    var max_tick = 0;

    for (var i=0; i < data.length; i++) {
        var start = data[i]['start']*10;
        var end = data[i]['end']*10;
        data_array.push([data[i]['domain']['display_name'], data[i]['domain']['display_name'], start, end]);
        descriptions.push(data[i]['domain']['description']);
        domains[data[i]['domain']['id']] = true;
        if(end > max_tick) {
            max_tick = end;
        }
    }
    dataTable.addRows(data_array);

    var options = {
        'height': 50*Object.keys(domains).length + 35,
        'timeline': {'showRowLabels': false,
                        'hAxis': {'position': 'none'},
        }
    };
    chart.draw(dataTable, options);

    function tooltipHandler(e) {
        var datarow = data_array[e.row];
        var spans = $(".google-visualization-tooltip-action > span");
        spans[0].innerHTML = 'Relative Coordinates:'
        spans[1].innerHTML = ' ' + datarow[2]/10 + '-' + datarow[3]/10;
        spans[2].innerHTML = 'Description: ';
        if(descriptions[e.row] != null) {
            spans[3].innerHTML = '<span>' + descriptions[e.row] + '</span>';
        }
        else {
            spans[3].innerHTML = 'Not available.';
        }
    }

    var tickmark_holder = $("#" + chart_id + " > div > div > svg > g")[1];
    var tickmarks = tickmark_holder.childNodes;
    for (var i=0; i < tickmarks.length; i++) {
        tickmarks[i].innerHTML = 100*i;
    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
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