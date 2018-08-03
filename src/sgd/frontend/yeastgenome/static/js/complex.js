
$(document).ready(function() {

	$.getJSON('/backend/complex/' + complex['complex_accession'], function(data) {

	  	var complex_table = create_complex_table(data);

		if(data != null && data["graph"]["nodes"].length > 1) {

		    var graph = create_cytoscape_vis("cy", layout, graph_style, data["graph"], null, true, "complex");
		    create_cy_download_button(graph, "cy_download", complex['complex_accession'] + '_subunit_graph')

		}
		else {                                                                                                   
                    hide_section("diagram");                                                                              
                } 
		
		if (data != null && data["network_graph"]["nodes"].length > 1) {
		    
		    var graph2 = create_cytoscape_vis("cy2", layout, graph_style, data["network_graph"], null, true, "complex_network");
		    create_cy_download_button(graph2, "cy2_download", complex['complex_accession'] + '_complex_network_graph')
		}
		else {
		    hide_section("network");
		}
	});

});

function create_complex_table(data) {
    var evidence = data['subunit'];
    var datatable = [];
    var subunits = {};
    for (var i = 0; i < evidence.length; i++) {
	datatable.push(complex_subunit_data_to_table(evidence[i]));
	subunits[evidence[i]["display_name"]] = true;
    }

    set_up_header(
		  "complex_table",
		  datatable.length,
		  "entry",
		  "entries",
		  Object.keys(subunits).length,
		  "subunit",
		  "subunits"
		  );

    var options = {};
    options["bPaginate"] = false;
    options["bDestroy"] = true;
    options["aoColumns"] = [
			  null,
			  null,
			  null
			  ];
  options["aaData"] = datatable;
  options["oLanguage"] = {
      sEmptyTable: "No subunits for this complex???."
  };

  return create_table("complex_table", options);

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
    .selector("node[type='small-molecule']")
    .css({
	    'text-outline-color': "#338AFF",
	})
    .selector("node[type='Gene']")
    .css({
            'text-outline-color': "#FF8933",
        })
    .selector("node[type='Go']")
    .css({
            'text-outline-color': "#A133FF",
        })
    .selector("node[type='Complex']")
    .css({
            'text-outline-color': "#0E9F36",
        })
    .selector('edge')
    .css({
	    'width': 2,
	    'target-arrow-shape': 'triangle',
	    'line-color': '#848484',
	    'target-arrow-color': '#848484'
        })
    .selector("node[sub_type='FOCUS']")
    .css({
	    'background-color': "#fade71",
	    'text-outline-color': '#fff',
	    'color': '#888'
        })
    .selector("edge[class_type = 'complex_go']")
    .css({
            'line-color': "#7233FF"
        })
    .selector("edge[class_type = 'complex_gene']")
    .css({
            'line-color': "#74FF33"
        })
    .selector("edge[class_type = 'complex']")
    .css({
	    'line-color': "#74FF33" 
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
