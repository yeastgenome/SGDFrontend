$(document).ready(function() {
	$.getJSON('/redirect_backend?param=go/' + go_term['id'] + '/locus_details', function(data) {
	  	create_go_table(data);
	});

	$.getJSON('/redirect_backend?param=go/' + go_term['id'] + '/ontology_graph', function(data) {
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
        //Use of mData
        {"bSearchable":false, "bVisible":false,"aTargets":[0],"mData":0}, //evidence_id
        {"bSearchable":false, "bVisible":false,"aTargets":[1],"mData":1}, //analyze_id
        {"aTargets":[2],"mData":2}, //gene
        {"bSearchable":false, "bVisible":false,"aTargets":[3],"mData":3}, //gene systematic name
        {"aTargets":[4],"mData":4}, //gene ontology term  -----> qualifier
        {"bSearchable":false, "bVisible":false,"aTargets":[5],"mData":5}, //gene ontology term id
        {"aTargets":[6],"mData":6}, //qualifier   -----> gene ontology term
        {"bSearchable":false, "bVisible":false,"aTargets":[7],"mData":7}, //aspect
        {"aTargets":[8],"mData":8}, //evidence   -----> annotation_extension
        {"aTargets":[9],"mData":9}, //method -----> evidence
        {"bSearchable":false,"bVisible":false,"aTargets":[10],"mData":10}, //source -----> method
        {"aTargets":[11],"mData":11}, //assigned on -----> source
        {"aTargets":[12],"mData":12}, //annotation_extension -----> assigned on
        {"aTargets":[13],"mData":13} // reference        
    ];
    create_or_hide_table(manualDatatable, options, "manual_go_table", go_term["display_name"], go_term["link"], go_term["id"], "manually curated", data);
    create_or_hide_table(htpDatatable, options, "htp_go_table", go_term["display_name"], go_term["link"], go_term["id"], "high-throughput", data);
    create_or_hide_table(computationalDatatable, options, "computational_go_table", go_term["display_name"], go_term["link"], go_term["id"], "computational", data);
}

function create_or_hide_table(tableData, options, tableIdentifier, goName, goLink, goId, annotationType, originalData) {
    if (tableData.length) {
        var localOptions =  $.extend({ aaData: tableData, oLanguage: { sEmptyTable: 'No genes annotated directly to ' + goName } }, options);
        var table = create_table(tableIdentifier, localOptions);
        create_analyze_button(tableIdentifier + "_analyze", table, "<a href='" + goLink + "' class='gene_name'>" + goName + "</a> genes", true);
        create_download_button(tableIdentifier + "_download", table, goName + "_annotations");
        
        if(go_term['descendant_locus_count'] > go_term['locus_count']) {
            create_show_child_button(tableIdentifier + "_show_children", table, originalData, "/redirect_backend?param=go/" + goId + "/locus_details_all", go_data_to_table, function(table_data) {
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
        var emptyMessage = "There are no " + annotationType + " annotations for " + goName + ".";
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
