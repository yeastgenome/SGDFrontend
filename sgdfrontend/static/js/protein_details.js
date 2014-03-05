google.load("visualization", "1", {packages:["corechart"]});

var phosphodata = null;

var source_to_color = {};


$(document).ready(function() {

    $.getJSON(protein_domains_link, function(data) {
        var domain_table = create_domain_table("domains_table", "domains_header", "No known domains for " + display_name + ".", data);
        create_download_button("domains_table_download", domain_table, download_table_link, domains_table_filename);
        draw_domain_chart("domain_chart", data);

        $.getJSON(protein_domain_graph_link, function(data) {
            if(data['nodes'].length > 1) {
                var graph_style = prep_style();
                var graph = create_cytoscape_vis("cy", layout, graph_style, data);
            }
            else {
                hide_section("network");
            }
        });
	});

    $("#domains_table_analyze").hide();


    $.getJSON(sequence_details_link, function(data) {
        var protein_data = data['protein'];
        var strain_selection = $("#strain_selection");
        for (var i=0; i < protein_data.length; i++) {
            var option = document.createElement("option");
            option.setAttribute("value", protein_data[i]['strain']['format_name']);
            option.innerHTML = protein_data[i]['strain']['display_name'];
            strain_selection.append(option);

        }

        function on_change(index) {
            $("#sequence_residues").html(protein_data[index]['sequence']['residues'].chunk(10).join(' '));
            $("#strain_description").html(protein_data[index]['strain']['description']);
            $("#navbar_sequence").children()[0].innerHTML = 'Sequence <span class="subheader">' + '- ' + protein_data[index]['strain']['display_name'] + '</span>';
            $("#length").html(protein_data[index]['sequence']['length']);
            draw_phosphodata();
            $("#sequence_download").click(function f() {
                download_sequence(protein_data[index]['sequence']['residues'], download_sequence_link, display_name, '');
            });
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
    var data = [];
    if(phosphodata != null) {
        var additional = 0;
        for (var i=0; i < phosphodata.length; i++) {
            var index = phosphodata[i]['site_index'] + Math.floor(1.0*(phosphodata[i]['site_index']-1)/10) - 1 + additional;
            var residues = $("#sequence_residues");
            var old_residues = residues.html();
            if(phosphodata[i]['site_residue'] == old_residues.substring(index, index+1)) {
                residues.html(old_residues.substring(0, index) + "<span style='color:red'>" + old_residues.substring(index, index+1) + "</span>" + old_residues.substring(index+1, old_residues.length));
                additional = additional + 31;
                data.push(phosphodata[i]);
            }
        }
        create_phosphorylation_table(data);
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
    options["bDestroy"] = true;
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
    options["bPaginate"] = true;
    options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null, null]
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": message};

    return create_table(div_id, options);
}

function draw_domain_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Source' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    var descriptions = [];

    var min_start = null;
    var max_end = null;

    for (var i=0; i < data.length; i++) {
        var start = data[i]['start']*10;
        var end = data[i]['end']*10;
        data_array.push([data[i]['domain']['source'], data[i]['domain']['display_name'], start, end]);
        descriptions.push(data[i]['domain']['description']);
        if(min_start == null || start < min_start) {
            min_start = start;
        }
        if(max_end == null || end > max_end) {
            max_end = end;
        }
    }
    dataTable.addRows(data_array);

    var options = {
        'height': 1,
        'timeline': {'colorByRowLabel': true,
            'hAxis': {'position': 'none'},
        }
    };

    chart.draw(dataTable, options);

    var height = $("#" + chart_id + " > div > div > div > svg").height() + 50;
    options['height'] = height;
    chart.draw(dataTable, options);

    function tooltipHandler(e) {
        var datarow = data_array[e.row];
        var spans = $(".google-visualization-tooltip-action > span");
        if(spans.length > 3) {
            spans[0].innerHTML = 'Coords:'
            spans[1].innerHTML = ' ' + datarow[2]/10 + '-' + datarow[3]/10;
            spans[2].innerHTML = 'Descr: ';
            if(descriptions[e.row] != null) {
                spans[3].innerHTML = '<span>' + descriptions[e.row] + '</span>';
            }
            else {
                spans[3].innerHTML = 'Not available.';
            }
        }
    }

    var rectangle_holder = $("#" + chart_id + " > div > div > svg > g")[3];
    var rectangles = rectangle_holder.childNodes;
    var y_one = min_start/10;
    var y_two = max_end/10;

    var x_one = null;
    var x_two = null;

    for (var i=0; i < rectangles.length; i++) {
        if(rectangles[i].nodeName == 'rect') {
            var x = Math.round(rectangles[i].getAttribute('x'));
            var y = Math.round(rectangles[i].getAttribute('y'));
            if(x_one == null || x < x_one) {
                x_one = x;
            }
            if(x_two == null || x > x_two) {
                x_two = x + Math.round(rectangles[i].getAttribute('width'));
            }
        }
    }

    var m = (y_two - y_one)/(x_two - x_one);
    var b = y_two - m*x_two;

    var tickmark_holder = $("#" + chart_id + " > div > div > svg > g")[1];
    var tickmarks = tickmark_holder.childNodes;
    var tickmark_space;
    if(tickmarks.length > 1) {
        tickmark_space = Math.round(tickmarks[1].getAttribute('x')) - Math.round(tickmarks[0].getAttribute('x'));
    }
    else {
        tickmark_space = 100;
    }
    for (var i=0; i < tickmarks.length; i++) {
        var x_new = Math.round(tickmarks[i].getAttribute('x'));
        var y_new = Math.round(m*x_new + b);
        if(m*tickmark_space > 10000) {
            y_new = 10000*Math.round(y_new/10000);
        }
        else if(m*tickmark_space > 1000) {
            y_new = 1000*Math.round(y_new/1000);
        }
        else if(m*tickmark_space > 100) {
            y_new = 100*Math.round(y_new/100);
        }
        else if(m*tickmark_space > 10) {
            y_new = 10*Math.round(y_new/10)
        }
        if(y_new <= 0) {
            y_new = 1;
        }
        tickmarks[i].innerHTML = y_new;
    }

    var rectangle_holder = $("#" + chart_id + " > div > div > svg > g")[3];
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

    var label_holder = $("#" + chart_id + " > div > div > svg > g")[0];
    var labels = label_holder.childNodes;
    var color_index = 0;
    for (var i=0; i < labels.length; i++) {
        if(labels[i].nodeName == 'text') {
            source_to_color[labels[i].innerHTML] = ordered_colors[color_index];
            color_index = color_index + 1;
        }
    }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
}

function prep_style() {
    return cytoscape.stylesheet()
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
    })
    .selector("node[type='BIOITEM'][source='-']")
	.css({
		'background-color': source_to_color['-'],
    })
    .selector("node[type='BIOITEM'][source='Gene3D']")
	.css({
		'background-color': source_to_color['Gene3D'],
    })
    .selector("node[type='BIOITEM'][source='JASPAR']")
	.css({
		'background-color': source_to_color['JASPAR'],
    })
    .selector("node[type='BIOITEM'][source='PANTHER']")
	.css({
		'background-color': source_to_color['PANTHER'],
    })
    .selector("node[type='BIOITEM'][source='Pfam']")
	.css({
		'background-color': source_to_color['Pfam'],
    })
    .selector("node[type='BIOITEM'][source='PIR superfamily']")
	.css({
		'background-color': source_to_color['PIR superfamily'],
    })
    .selector("node[type='BIOITEM'][source='PRINTS']")
	.css({
		'background-color': source_to_color['PRINTS'],
    })
    .selector("node[type='BIOITEM'][source='ProDom']")
	.css({
		'background-color': source_to_color['ProDom'],
    })
    .selector("node[type='BIOITEM'][source='PROSITE']")
	.css({
		'background-color': source_to_color['PROSITE'],
    })
    .selector("node[type='BIOITEM'][source='SignalP']")
	.css({
		'background-color': source_to_color['SignalP'],
    })
    .selector("node[type='BIOITEM'][source='SMART']")
	.css({
		'background-color': source_to_color['SMART'],
    })
    .selector("node[type='BIOITEM'][source='SUPERFAMILY']")
	.css({
		'background-color': source_to_color['SUPERFAMILY'],
    })
    .selector("node[type='BIOITEM'][source='TIGRFAMs']")
	.css({
		'background-color': source_to_color['TIGRFAMs'],
    })
    .selector("node[type='BIOITEM'][source='TMHMM']")
	.css({
		'background-color': source_to_color['TMHMM'],
    })

;
}

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