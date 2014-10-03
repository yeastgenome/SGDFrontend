
$(document).ready(function() {

	$.getJSON('/backend/observable/' + observable['id'] + '/locus_details?callback=?', function(data) {
        var phenotype_table = create_phenotype_table(data);
        create_analyze_button("phenotype_table_analyze", phenotype_table, "<a href='" + observable['link'] + "' class='gene_name'>" + observable['display_name'] + "</a> genes", true);
        create_download_button("phenotype_table_download", phenotype_table, observable['display_name'] + "_annotations");

        if(observable['descendant_locus_count'] > observable['locus_count']) {
            create_show_child_button("phenotype_table_show_children", phenotype_table, data, '/backend/observable/' + observable['id'] + '/locus_details_all?callback=?', phenotype_data_to_table, function(table_data) {

                var genes = {};
                for (var i=0; i < table_data.length; i++) {
                    genes[table_data[i][1]] = true;
                }
                set_up_header('phenotype_table', table_data.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');
            });
        }
	});

	$.getJSON('/backend/observable/' + observable['id'] + '/ontology_graph?callback=?', function(data) {
  		var cy = create_cytoscape_vis("cy", layout, graph_style, data);
        create_cy_download_button(cy, "cy_download", observable['display_name'] + '_ontology')

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

function create_phenotype_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[2, "asc"]];
        options["bDestroy"] = true;
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            genes[data[i]["locus"]["id"]] = true;
        }

        set_up_header('phenotype_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[2, "asc"]];
        options["bDestroy"] = true;
        options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + observable['display_name']};
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
        options["aaData"] = datatable;
    }

    return create_table("phenotype_table", options);
}

//Graph style
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
		'background-color': "grey",
		'text-outline-color': '#fff',
		'color': '#888'
	})
	.selector('edge')
	.css({
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
	})
	.selector("node[sub_type='morphology']")
	.css(
		{'background-color': "#7FBF7B"
	})
	.selector("node[sub_type='fitness']")
	.css(
		{'background-color': "#AF8DC3"
	})
	.selector("node[sub_type='essentiality']")
	.css(
		{'background-color': "#1F78B4"
	})
	.selector("node[sub_type='interaction with host/environment']")
	.css(
		{'background-color': "#FB9A99"
	})
	.selector("node[sub_type='metabolism and growth']")
	.css(
		{'background-color': "#E31A1C"
	})
	.selector("node[sub_type='cellular processes']")
	.css(
		{'background-color': "#FF7F00"
	})
	.selector("node[sub_type='development']")
	.css(
		{'background-color': "#BF5B17"
});

var layout = {
	"name": "breadthfirst",
	"fit": true,
    "directed": true
};

