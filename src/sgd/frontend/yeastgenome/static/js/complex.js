
$(document).ready(function() {

	$.getJSON('/backend/complex/' + complex['complex_accession'], function(data) {

	  	var complex_table = create_complex_table(data);

		if(data != null && data["graph"]["nodes"].length > 1) {

		    var graph = create_cytoscape_vis("cy", layout, graph_style, data["graph"], null, true, "complex");
		    //  create_cy_download_button(graph, "cy_download", data['display_name'] + '_complex_graph')

		    if(true) {
			    $("#discrete_filter").show();
		     }
		     else {
			    $("#discrete_filter").hide();
		     }
		}
		else {
		    hide_section("diagram");
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

