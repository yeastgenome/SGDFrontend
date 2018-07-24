
$(document).ready(function() {

	$.getJSON('/backend/complex/' + complex['id'], function(data) {
	  	var complex_table = create_complex_table(data);
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
    options["aaSorting"] = true;
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

