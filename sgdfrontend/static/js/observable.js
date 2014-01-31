
$(document).ready(function() {

	$.getJSON(phenotype_details_link, function(data) {
        var phenotype_table = create_phenotype_table(data);
        create_analyze_button("phenotype_table_analyze", phenotype_table, analyze_link, analyze_filename, true);
        create_download_button("phenotype_table_download", phenotype_table, download_table_link, download_filename);

        if(child_count > count) {
            create_show_child_button("phenotype_table_show_children", phenotype_table, data, phenotype_details_all_link, phenotype_data_to_table, function(table_data) {
                $("#phenotype_header").html(table_data.length);

                var genes = {};
                for (var i=0; i < table_data.length; i++) {
                    genes[table_data[i][1]] = true;
                }
                $("#phenotype_subheader").html(Object.keys(genes).length);
            });
        }
	});

	$.getJSON(ontology_graph_link, function(data) {
  		create_cytoscape_vis("cy", layout, graph_style, data);
        if(data['all_children'] != null && data['all_children'].length > 0) {
            var children_div = document.getElementById("children");
            for(var i=0; i < data['all_children'].length; i++) {
                var a = document.createElement('a');
                a.innerHTML = data['all_children'][i]['display_name'];
                a.href = data['all_children'][i]['link']
                children_div.appendChild(a);

                if(i != data['all_children'].length-1) {
                    var comma = document.createElement('span');
                    comma.innerHTML = ', ';
                    children_div.appendChild(comma);
                }
            }
        }
        else {
            $("#children_wrapper").hide();
        }
	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("phenotype");

});

function create_phenotype_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[2, "asc"]];
        options["bDestroy"] = true;
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {"sWidth": "250px"}, null];
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            genes[data[i]["bioentity"]["id"]] = true;
        }

        $("#phenotype_header").html(data.length);
        $("#phenotype_subheader").html(Object.keys(genes).length);

        if(Object.keys(genes).length == 1) {
            $("#phenotype_subheader_type").html('gene');
        }
        else {
            $("#phenotype_subheader_type").html('genes');
        }
        if(datatable.length == 1) {
            $("#phenotype_header_type").html("entry for ");
        }
        else {
            $("#phenotype_header_type").html("entries for ");
        }

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[2, "asc"]];
        options["bDestroy"] = true;
        options["oLanguage"] = {"sEmptyTable": "No genes annotated directly to " + display_name};
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {"sWidth": "250px"}, null];
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
	"fit": false
};

