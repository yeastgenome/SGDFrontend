$(document).ready(function() {
	$.getJSON('/backend/disease/' + disease['id'] + '/locus_details', function(data) {
	  	create_disease_table(data);
	});

	$.getJSON('/backend/disease/' + disease['id'] + '/ontology_graph', function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data, null, false, "diseaseOntology");
        create_cy_download_button(cy, "cy_download", disease['display_name'] + '_ontology')

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

function create_disease_table(data) {
	var manualDatatable = [];
	var manualGenes = {};
    var htpDatatable = [];
    var htpGenes = {};
    var computationalDatatable = [];
    var computationalGenes = {};
	for (var i=0; i < data.length; i++) {
        var type = data[i].annotation_type;
        if (type === 'manually curated') {
            manualDatatable.push(disease_data_to_table(data[i], i));
            manualGenes[data[i]["locus"]["id"]] = true;
        } else if (type === 'high-throughput') {
            htpDatatable.push(disease_data_to_table(data[i], i));
            htpGenes[data[i]["locus"]["id"]] = true;
        } else if (type === 'computational') {
            computationalDatatable.push(disease_data_to_table(data[i], i));
            computationalGenes[data[i]["locus"]["id"]] = true;
        }
	}
    set_up_header('manual_disease_table', manualDatatable.length, 'entry', 'entries', Object.keys(manualGenes).length, 'gene', 'genes');
    set_up_header('htp_disease_table', htpDatatable.length, 'entry', 'entries', Object.keys(htpGenes).length, 'gene', 'genes');
    set_up_header('computational_disease_table', computationalDatatable.length, 'entry', 'entries', Object.keys(computationalGenes).length, 'gene', 'genes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [
        {"bSearchable":false, "bVisible":false}, // evidence_id
        {"bSearchable":false, "bVisible":false}, // some other id
        null, // gene
        {"bSearchable":false, "bVisible":false}, //gene systematic name
        null, //disease name
        {"bSearchable":false, "bVisible":false}, // doid
        {"bSearchable":false, "bVisible":false}, // null, empty
        null, // assay
        null, // method manual or htp
        null, // source
        null, // date
        null, // with
        null// reference
    ];

    create_or_hide_table(manualDatatable, options, "manual_disease_table", disease["display_name"], disease["link"], disease["id"], "manually curated", data);
    create_or_hide_table(htpDatatable, options, "htp_disease_table", disease["display_name"], disease["link"], disease["id"], "high-throughput", data);
    create_or_hide_table(computationalDatatable, options, "computational_disease_table", disease["display_name"], disease["link"], disease["id"], "computational", data);
}

function create_or_hide_table(tableData, options, tableIdentifier, doName, doLink, doId, annotationType, originalData) {
    if (tableData.length) {
        var localOptions =  $.extend({ aaData: tableData, oLanguage: { sEmptyTable: 'No genes annotated directly to ' + doName } }, options);
        var table = create_table(tableIdentifier, localOptions);
        create_analyze_button(tableIdentifier + "_analyze", table, "<a href='" + doLink + "' class='gene_name'>" + doName + "</a> genes", true);
        create_download_button(tableIdentifier + "_download", table, doName + "_annotations");

        if(disease['descendant_locus_count'] > disease['locus_count']) {
            create_show_child_button(tableIdentifier + "_show_children", table, originalData, "/backend/disease/" + doId + "/locus_details_all", disease_data_to_table, function(table_data) {
                var genes = {};
                for (var i=0; i < table_data.length; i++) {
                    genes[table_data[i][1]] = true;
                }
                set_up_header(tableIdentifier, table_data.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');
            }, annotationType);
        }
        return table;
    } else {
        $("#" + tableIdentifier + "_header").remove();
        var $parent = $("#" + tableIdentifier).parent();
        var emptyMessage = "There are no " + annotationType + " annotations for " + doName + ".";
        $parent.html(emptyMessage);
    }
};

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

var layout = {
    "name": "breadthfirst",
	"fit": true,
    "directed": true
};
