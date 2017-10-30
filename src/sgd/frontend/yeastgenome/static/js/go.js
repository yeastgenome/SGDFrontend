$(document).ready(function() {
	$.getJSON('/backend/go/' + go_term['id'] + '/locus_details', function(data) {
	  	create_go_table(data);

        if(go_term['descendant_locus_count'] > go_term['locus_count']) {
            create_show_child_button("go_table_show_children", go_table, data, '/backend/go/' + go_term['id'] + '/locus_details_all', go_data_to_table, function(table_data) {
                var genes = {};
                for (var i=0; i < table_data.length; i++) {
                    genes[table_data[i][1]] = true;
                }
                set_up_header('go_table', table_data.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');
            });
        }
	});

	$.getJSON('/backend/go/' + go_term['id'] + '/ontology_graph', function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data, null, false, "goOntology");
        create_cy_download_button(cy, "cy_download", go_term['display_name'] + '_ontology')

        if(data['all_children'] != null && data['all_children'].length > 0) {
            var children_div = document.getElementById("children");
            var more_children_div = document.getElementById("children_see_more");
            for(var i=0; i < data['all_children'].length; i++) {
                var a = document.createElement('a');
                a.innerHTML = data['all_children'][i]['display_name'];
                a.href = data['all_children'][i]['link']

                if(i < 20) {
                    children_div.appendChild(a);
                }
                else {
                    more_children_div.appendChild(a);
                }


                if(i != data['all_children'].length-1) {
                    var comma = document.createElement('span');
                    comma.innerHTML = ' &bull; ';
                    if(i < 20) {
                        children_div.appendChild(comma);
                    }
                    else {
                        more_children_div.appendChild(comma);
                    }
                }
            }

            if(data['all_children'].length <= 20) {
                $("#children_see_more_button").hide();
            }
        }
        else {
            $("#children_wrapper").hide()
        }
	});

});

function create_go_table(data) {
	var manualDatatable = [];
	var manualGenes = {};
    var htpDatatable = [];
    var htpGenes = {};
    var computationalDatatable = [];
    var computationalGenes = {};
	for (var i=0; i < data.length; i++) {
        var type = data[i].annotation_type;
        if (type === 'manually curated') {
            manualDatatable.push(go_data_to_table(data[i], i));
            manualGenes[data[i]["locus"]["id"]] = true;
        } else if (type === 'high-throughput') {
            htpDatatable.push(go_data_to_table(data[i], i));
            htpGenes[data[i]["locus"]["id"]] = true;
        } else if (type === 'computational') {
            computationalDatatable.push(go_data_to_table(data[i], i));
            computationalGenes[data[i]["locus"]["id"]] = true;
        }
	}
    set_up_header('manual_go_table', manualDatatable.length, 'entry', 'entries', Object.keys(manualGenes).length, 'gene', 'genes');
    set_up_header('htp_go_table', htpDatatable.length, 'entry', 'entries', Object.keys(htpGenes).length, 'gene', 'genes');
    set_up_header('computational_go_table', computationalDatatable.length, 'entry', 'entries', Object.keys(computationalGenes).length, 'gene', 'genes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["bDestroy"] = true;
	// options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + go_term['display_name']};
    options["aoColumns"] = [
        {"bSearchable":false, "bVisible":false}, //evidence_id
        {"bSearchable":false, "bVisible":false}, //analyze_id
        null, //gene
        {"bSearchable":false, "bVisible":false}, //gene systematic name
        null, //gene ontology term
        {"bSearchable":false, "bVisible":false}, //gene ontology term id
        null, //qualifier
        {"bSearchable":false, "bVisible":false}, //aspect
        null, //evidence
        {"bSearchable":false, "bVisible":false}, //method
        null, //source
        null, //assigned on
        null, //annotation_extension
        null // reference
    ];
    var manualOptions = $.extend({ aaData: manualDatatable, oLanguage: { sEmptyTable: 'No genes manually annotated directly to ' + go_term['display_name'] } }, options);
    var htpOptions = $.extend({ aaData: htpDatatable, oLanguage: { sEmptyTable: 'No high-throughput gene annotations for ' + go_term['display_name'] } }, options);
    var computationalOptions = $.extend({ aaData: computationalDatatable, oLanguage: { sEmptyTable: 'No genes computationally annotated directly to ' + go_term['display_name'] } }, options);
    var manualTable = create_table("manual_go_table", manualOptions);
    create_analyze_button("manual_go_table_analyze", manualTable, "<a href='" + go_term['link'] + "' class='gene_name'>" + go_term['display_name'] + "</a> genes", true);
    create_download_button("manual_go_table_download", manualTable, go_term['display_name'] + "_annotations");
    var htpTable = create_table("htp_go_table", htpOptions);
    create_analyze_button("htp_go_table_analyze", htpTable, "<a href='" + go_term['link'] + "' class='gene_name'>" + go_term['display_name'] + "</a> genes", true);
    create_download_button("htp_go_table_download", htpTable, go_term['display_name'] + "_annotations");
    var computationalTable = create_table("computational_go_table", computationalOptions);
    create_analyze_button("computational_go_table_analyze", computationalTable, "<a href='" + go_term['link'] + "' class='gene_name'>" + go_term['display_name'] + "</a> genes", true);
    create_download_button("computational_go_table_download", computationalTable, go_term['display_name'] + "_annotations");
}

var graph_style = cytoscape.stylesheet()
	.selector('node')
	.css({
		'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 14,
		'text-outline-width': 3,
		'text-valign': 'center',
		'width': 30,
		'height': 30,
		'border-color': '#fff',
		'background-color': "#43a0df",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector('edge')
	.css({
        'content': 'data(name)',
		'font-family': 'helvetica',
		'font-size': 12,
        'color': 'grey',
		'width': 2,
		'source-arrow-shape': 'triangle'
	})
	.selector("node[sub_type='FOCUS']")
	.css({
		'width': 30,
		'height': 30,
		'background-color': "#fade71",
		'text-outline-color': '#fff',
		'color': '#888'
	})
    .selector("node[id='NodeMoreChildren']")
	.css({
		'width': 30,
		'height': 30,
        'shape': 'rectangle'
	});
//	.selector("node[sub_type='HAS_CHILDREN']")
//	.css(
//		{'background-color': "#165782"
//	})
//	.selector("node[sub_type='HAS_DESCENDANTS']")
//	.css(
//		{'background-color': "#43a0df"
//	})
//	.selector("node[sub_type='NO_DESCENDANTS']")
//	.css(
//		{'background-color': "#c9e4f6"
//	});

var layout = {
    "name": "breadthfirst",
	"fit": true,
    "directed": true
};
