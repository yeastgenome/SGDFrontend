google.load("visualization", "1", {packages:["corechart"]});

var phosphodata = null;
var current_residues = null;

var source_to_color = {};


$(document).ready(function() {

    create_physico_chemical_download();

    $.getJSON(protein_domains_link, function(data) {
        var domain_table = create_domain_table(data);
        create_download_button("domain_table_download", domain_table, download_table_link, domains_table_filename);
        draw_domain_chart("domain_chart", data);

        $.getJSON(protein_domain_graph_link, function(data) {
            if(data['nodes'].length > 1) {
                var graph_style = prep_style();
                create_cytoscape_vis("cy", layout, graph_style, data);
            }
            else {
                $("#shared_domains").hide();
            }
        });
	});

    $("#domain_table_analyze").hide();


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
            $("#sequence_residues").html(prep_sequence(protein_data[index]['residues']));
            $("#strain_description").html(protein_data[index]['strain']['description']);
            $("#navbar_sequence").children()[0].innerHTML = 'Sequence <span>' + '- ' + protein_data[index]['strain']['display_name'] + '</span>';
            set_up_properties(protein_data[index]);
            current_residues = protein_data[index]['residues'];
            draw_phosphodata();
            $("#sequence_download").click(function f() {
                download_sequence(protein_data[index]['residues'], download_sequence_link, display_name, '');
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

    $.getJSON(ec_number_details_link, function(data) {
        if(data.length > 0) {
            var ec_number_html = "<strong>Enzyme Commission (EC) Number:</strong> ";
            for (var i=0; i < data.length; i++) {
                ec_number_html = ec_number_html + "<a href='" + data[i]['ecnumber']['link'] + "'>" + data[i]['ecnumber']['display_name'] + "</a>";
                if(i != data.length-1) {
                    ec_number_html = ec_number_html + ', ';
                }
            }
            $("#ec_number").html(ec_number_html)
        }
	});

    $.getJSON(protein_experiment_details_link, function(data) {
        if(data.length > 0) {
            var protein_experiment_table = create_protein_experiment_table(data);
            create_download_button("protein_experiment_table_download", protein_experiment_table, download_table_link, protein_experiment_table_filename);
        }
        else {
            hide_section('experiment');
        }
	});

    $.getJSON(bioentity_details_link, function(data) {
        var description_references = [];
        for (var i=0; i < data.length; i++) {
            if(data[i]['info_key'] == 'Description') {
                description_references.push('<a href="' + data[i]['reference']['link'] + '">' + data[i]['reference']['display_name'] + '</a>');
            }
        }
        if(description_references != '') {
            $('#description_references').html(description_references.join(', '));
        }
	});

    var alias_table = create_alias_table(aliases);
    create_download_button("alias_table_download", alias_table, download_table_link, alias_table_filename);

    //Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function create_physico_chemical_download() {
    var download_button = $("#protein_properties_download");
    var download_function = function() {
        var data = table._('tr', {"filter": "applied"});
        var filename = name;

        var table_headers = table.fnSettings().aoColumns;
        var headers = [];
        for(var i=0,len=table_headers.length; i<len; i++) {
            headers.push(table_headers[i].nTh.innerHTML);
        }

        var search_term = table.fnSettings().oPreviousSearch.sSearch
        if(search_term != '') {
            filename = filename + '_filtered_by_-' + search_term + '-'
        }

        post_to_url(download_link, {"display_name":filename, 'headers': JSON.stringify(headers), 'data': JSON.stringify(data)});
    };
    download_button.click(download_function);
}

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

function update_property(prop_id, prop_value) {
    if(prop_value != null && prop_value != 'None') {
        $("#" + prop_id).html(prop_value);
    }
    else {
        $("#" + prop_id).html('-');
    }
}

function get_perc(top, bottom) {
    return (100.0*top/bottom).toFixed(2);
}

function set_up_properties(data) {
    update_property('length', data['residues'].length-1);
    update_property('molecular_weight', data['molecular_weight']);
    update_property('pi', data['pi']);
    update_property('aliphatic_index', data['aliphatic_index']);
    update_property('instability_index', data['instability_index']);
    var formula = '-';
    if(data['carbon'] != null) {
        formula = 'C<sub>' + data['carbon'] + '</sub>H<sub>' + data['hydrogen'] + '</sub>N<sub>' + data['nitrogen'] + '</sub>O<sub>' + data['oxygen'] + '</sub>S<sub>' + data['sulfur'] + '</sub>';
    }
    update_property('formula', formula);

    update_property('codon_bias', data['codon_bias']);
    update_property('cai', data['cai']);
    update_property('fop_score', data['fop_score']);
    update_property('gravy_score', data['gravy_score']);
    update_property('aromaticity_score', data['aromaticity_score']);

    update_property('ecoli_half_life', data['ecoli_half_life']);
    update_property('mammal_half_life', data['mammal_half_life']);
    update_property('yeast_half_life', data['yeast_half_life']);

    update_property('all_half_cys_ext_coeff', data['all_half_cys_ext_coeff']);
    update_property('no_cys_ext_coeff', data['no_cys_ext_coeff']);
    update_property('all_cys_ext_coeff', data['all_cys_ext_coeff']);
    update_property('all_pairs_cys_ext_coeff', data['all_pairs_cys_ext_coeff']);

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[0, "asc"]];
    options["bFilter"] = false;
    options["bDestroy"] = true;
    var total = data['ala'] + data['arg'] + data['asn'] + data['asp'] + data['cys'] + data['gln'] + data['glu'] + data['gly'] + data['his'] + data['ile'] + data['leu'] + data['lys'] + data['met'] + data['phe'] + data['pro'] + data['ser'] + data['thr'] + data['trp'] + data['tyr'] + data['val'];
    options["aaData"] = [['A', data['ala'], get_perc(data['ala'], total)], ['R', data['arg'], get_perc(data['arg'], total)], ['N', data['asn'], get_perc(data['asn'], total)], ['D', data['asp'], get_perc(data['asp'], total)],
                         ['C', data['cys'], get_perc(data['cys'], total)], ['Q', data['gln'], get_perc(data['gln'], total)], ['E', data['glu'], get_perc(data['glu'], total)], ['G', data['gly'], get_perc(data['gly'], total)],
                         ['H', data['his'], get_perc(data['his'], total)], ['I', data['ile'], get_perc(data['ile'], total)], ['L', data['leu'], get_perc(data['leu'], total)], ['K', data['lys'], get_perc(data['lys'], total)],
                         ['M', data['met'], get_perc(data['met'], total)], ['F', data['phe'], get_perc(data['phe'], total)], ['P', data['pro'], get_perc(data['pro'], total)], ['S', data['ser'], get_perc(data['ser'], total)],
                         ['T', data['thr'], get_perc(data['thr'], total)], ['W', data['trp'], get_perc(data['trp'], total)], ['Y', data['tyr'], get_perc(data['tyr'], total)], ['V', data['val'], get_perc(data['val'], total)]];

    create_table("amino_acid_table", options);

    options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[0, "asc"]];
    options["bFilter"] = false;
    options["bDestroy"] = true;

    if(data['carbon'] != null) {
        total = data['carbon'] + data['hydrogen'] + data['nitrogen'] + data['oxygen'] + data['sulfur'];
        options["aaData"] = [['Carbon', data['carbon'], get_perc(data['carbon'], total)], ['Hydrogen', data['hydrogen'], get_perc(data['hydrogen'], total)], ['Nitrogen', data['nitrogen'], get_perc(data['nitrogen'], total)],
                         ['Oxygen', data['oxygen'], get_perc(data['oxygen'], total)], ['Sulfur', data['sulfur'], get_perc(data['sulfur'], total)]];
    }
    else {
        options["aaData"] = [['Carbon', '-', '-'], ['Hydrogen', '-', '-'], ['Nitrogen', '-', '-'], ['Oxygen', '-', '-'], ['Sulfur', '-', '-']];
    }

    create_table("atomic_table", options);
}

function draw_phosphodata() {
    var data = [];
    if(phosphodata != null && phosphodata.length > 0 && current_residues != null) {
        var num_digits = ('' + current_residues.length).length;
        var residues = $("#sequence_residues");
        var old_residues = residues.html();
        var new_residues = '';
        var start = 0;
        for (var i=0; i < phosphodata.length; i++) {
            var index = relative_to_html(phosphodata[i]['site_index']-1, num_digits);
            if(old_residues.substring(index, index+1) == phosphodata[i]['site_residue']) {
                new_residues = new_residues + old_residues.substring(start, index) +
                    "<span style='color:red'>" +
                    old_residues.substring(index, index+1) +
                    "</span>";
                start = index+1
                data.push(phosphodata[i]);
            }
        }
        new_residues = new_residues + old_residues.substring(start, old_residues.length)
        residues.html(new_residues);
        var phospho_table = create_phosphorylation_table(data);
        create_download_button("phosphorylation_table_download", phospho_table, download_table_link, phosphorylation_table_filename);

        $("#phosphorylation_sites_wrapper").show();
    }
    else {
        $("#phosphorylation_sites_wrapper").hide();
    }
}

function relative_to_html(index, num_digits) {
    var row = Math.floor(1.0*index/60);
    var column = index - row*60;
    return row*(71+num_digits) + 1 + num_digits + column + Math.floor(1.0*column/10);
}

function create_phosphorylation_table(data) {
	var datatable = [];

    var sites = {};
    for (var i=0; i < data.length; i++) {
        datatable.push(phosphorylation_data_to_table(data[i]));
        sites[data[i]['site_residue'] + data[i]['site_index']] = true;
    }

    set_up_header('phosphorylation_table', datatable.length, 'entry', 'entries', Object.keys(sites).length, 'site', 'sites');

    set_up_phospho_sort();

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[4, "asc"]];
    options["bDestroy"] = true;
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "phospho" }, null, null, null];
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": 'No phosphorylation data for this strain.'};

    return create_table("phosphorylation_table", options);
}

function create_protein_experiment_table(data) {
	var datatable = [];

    var experiment_types = {};
    for (var i=0; i < data.length; i++) {
        datatable.push(protein_experiment_data_to_table(data[i]));
        experiment_types[data[i]['data_type']] = true;
    }

    set_up_header('protein_experiment_table', datatable.length, 'entry', 'entries', Object.keys(experiment_types).length, 'experiment', 'experiments');

    var options = {};
    options["bPaginate"] = false;
    options["aaSorting"] = [[4, "asc"]];
    options["bDestroy"] = true;
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null];
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": 'No protein experiment data for this protein.'};

    return create_table("protein_experiment_table", options);
}

function create_alias_table(data) {
	var datatable = [];

    var sources = {};
    for (var i=0; i < data.length; i++) {
        if(data[i]['protein']) {
            datatable.push([data[i]['id'], create_link(data[i]['display_name'], data[i]['link'], true), data[i]['source']['display_name']]);
            sources[data[i]['source']['display_name']] = true;
        }
    }

    set_up_header('alias_table', datatable.length, 'entry', 'entries', Object.keys(sources).length, 'source', 'sources');

    var options = {};
    options["aaSorting"] = [[2, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, null, null];
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": 'No external identifiers for ' + display_name + '.'};

    return create_table("alias_table", options);
}

function create_domain_table(data) {
	var datatable = [];

    var domains = {};
    for (var i=0; i < data.length; i++) {
        datatable.push(domain_data_to_table(data[i]));
        domains[data[i]['domain']['id']] = true;
    }
    $("#domain_header").html(data.length);

    set_up_header('domain_table', datatable.length, 'entry', 'entries', Object.keys(domains).length, 'domain', 'domains');

    set_up_range_sort();

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, null, null, null, null];
    options["aaData"] = datatable;
    options["oLanguage"] = {"sEmptyTable": "No known domains for " + display_name + "."};

    return create_table("domain_table", options);
}

function make_domain_ready_handler(chart_id, chart, min_start, max_end, descriptions, data_array) {
    function ready_handler() {
        //Fix tooltips.
        function tooltipHandler(e) {
            var datarow = data_array[e.row];
            var spans = $(".google-visualization-tooltip-action > span");
            if(spans.length > 3) {
                spans[0].innerHTML = 'Coords:';
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
        google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);

        //Fix axis.
        var svg_gs = $("#" + chart_id + " > div > div > svg > g");

        var rectangle_holder = svg_gs[3];
        rectangles = rectangle_holder.childNodes;
        var y_one = min_start/10;
        var y_two = max_end/10;

        var x_one = null;
        var x_two = null;

        for (i=0; i < rectangles.length; i++) {
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

        var tickmark_holder = svg_gs[1];
        var tickmarks = tickmark_holder.childNodes;
        var tickmark_space;
        if(tickmarks.length > 1) {
            tickmark_space = Math.round(tickmarks[1].getAttribute('x')) - Math.round(tickmarks[0].getAttribute('x'));
        }
        else {
            tickmark_space = 100;
        }
        for (i=0; i < tickmarks.length; i++) {
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
            $(tickmarks[i]).html(y_new);
        }

        //Grab colors for network.
        rectangle_holder = svg_gs[3];
        var rectangles = rectangle_holder.childNodes;
        var ordered_colors = [];
        for (var i=0; i < rectangles.length; i++) {
            if(rectangles[i].nodeName == 'rect') {
                var color = $(rectangles[i]).attr('fill');
                if(ordered_colors[ordered_colors.length - 1] != color) {
                    ordered_colors.push(color);
                }

            }
        }

        var label_holder = svg_gs[0];
        var labels = label_holder.childNodes;
        var color_index = 0;
        for (var i=0; i < labels.length; i++) {
            if(labels[i].nodeName == 'text') {
                source_to_color[$(labels[i]).text()] = ordered_colors[color_index];
                color_index = color_index + 1;
            }
        }
    }
    return ready_handler;
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
        var source = '';
        if(data[i]['domain']['source'] != null) {
            source = data[i]['domain']['source']['display_name'];
        }
        data_array.push([source, data[i]['domain']['display_name'], start, end]);
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
            'hAxis': {'position': 'none'}
        }
    };

    chart.draw(dataTable, options);
    google.visualization.events.addListener(chart, 'ready', make_domain_ready_handler(chart_id, chart, min_start, max_end, descriptions, data_array));

    options['height'] = $("#" + chart_id + " > div > div > div > svg").height() + 60;
    chart.draw(dataTable, options);
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
		'width': 2
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector("node[type='DOMAIN']")
	.css({
		'shape': 'rectangle',
		'text-outline-color': '#fff',
		'color': '#888'
    })
    .selector("node[type='DOMAIN'][source='-']")
	.css({
		'background-color': source_to_color['-']
    })
    .selector("node[type='DOMAIN'][source='Gene3D']")
	.css({
		'background-color': source_to_color['Gene3D']
    })
    .selector("node[type='DOMAIN'][source='JASPAR']")
	.css({
		'background-color': source_to_color['JASPAR']
    })
    .selector("node[type='DOMAIN'][source='PANTHER']")
	.css({
		'background-color': source_to_color['PANTHER']
    })
    .selector("node[type='DOMAIN'][source='Pfam']")
	.css({
		'background-color': source_to_color['Pfam']
    })
    .selector("node[type='DOMAIN'][source='PIR superfamily']")
	.css({
		'background-color': source_to_color['PIR superfamily']
    })
    .selector("node[type='DOMAIN'][source='PRINTS']")
	.css({
		'background-color': source_to_color['PRINTS']
    })
    .selector("node[type='DOMAIN'][source='ProDom']")
	.css({
		'background-color': source_to_color['ProDom']
    })
    .selector("node[type='DOMAIN'][source='PROSITE']")
	.css({
		'background-color': source_to_color['PROSITE']
    })
    .selector("node[type='DOMAIN'][source='SignalP']")
	.css({
		'background-color': source_to_color['SignalP']
    })
    .selector("node[type='DOMAIN'][source='SMART']")
	.css({
		'background-color': source_to_color['SMART']
    })
    .selector("node[type='DOMAIN'][source='SUPERFAMILY']")
	.css({
		'background-color': source_to_color['SUPERFAMILY']
    })
    .selector("node[type='DOMAIN'][source='TIGRFAMs']")
	.css({
		'background-color': source_to_color['TIGRFAMs']
    })
    .selector("node[type='DOMAIN'][source='TMHMM']")
	.css({
		'background-color': source_to_color['TMHMM']
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