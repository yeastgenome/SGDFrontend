
$(document).ready(function() {

	$.getJSON('/backend/go/' + go_term['id'] + '/locus_details?callback=?', function(data) {
	  	var go_table = create_go_table(data);
	  	create_analyze_button("go_table_analyze", go_table, "<a href='" + go_term['link'] + "' class='gene_name'>" + go_term['display_name'] + "</a> genes", true);
  	    create_download_button("go_table_download", go_table, go_term['display_name'] + "_annotations");

        if(go_term['descendant_locus_count'] > go_term['locus_count']) {
            create_show_child_button("go_table_show_children", go_table, data, '/backend/go/' + go_term['id'] + '/locus_details_all?callback=?', go_data_to_table, function(table_data) {
                var genes = {};
                for (var i=0; i < table_data.length; i++) {
                    genes[table_data[i][1]] = true;
                }
                set_up_header('go_table', table_data.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');
            });
        }
	});

	$.getJSON('/backend/go/' + go_term['id'] + '/ontology_graph?callback=?', function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data);
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
	var datatable = [];
	var genes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(go_data_to_table(data[i], i));
		genes[data[i]["locus"]["id"]] = true;
	}
    set_up_header('go_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[3, "asc"]];
	options["bDestroy"] = true;
	options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + go_term['display_name']};
    options["aoColumns"] = [
            {"bSearchable":false, "bVisible":false}, //evidence_id
            {"bSearchable":false, "bVisible":false}, //analyze_id
            null, //gene
            {"bSearchable":false, "bVisible":false}, //gene systematic name
            null, //gene ontology term
            {"bSearchable":false, "bVisible":false}, //gene ontology term id
            null, //qualifier
            {"bSearchable":false, "bVisible":false}, //aspect
            {"bSearchable":false, "bVisible":false}, //method
            null, //evidence
            null, //source
            null, //assigned on
            null, //annotation_extension
            null // reference
            ];
    options["aaData"] = datatable;

    return create_table("go_table", options);
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
