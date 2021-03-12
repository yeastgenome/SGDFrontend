$(document).ready(function() {

	$.getJSON('/backend/locus/' + locus['sgdid']  + '/complement_details', function(data) {
	    var complement_table = create_complement_table(data);
  	    create_download_button("complement_table_download", complement_table, locus['display_name'] + "_complement_annotations");

	});

        $.getJSON('/backend/locus/' + locus['sgdid']  + '/homolog_details', function(data) {
            var homolog_table = create_homolog_table(data);
            create_download_button("homolog_table_download", homolog_table, locus['display_name'] + "_homolog_annotations");

        });

        $.getJSON('/backend/locus/' + locus['sgdid']  + '/fungal_homolog_details', function(data) {
            var fungal_homolog_table = create_fungal_homolog_table(data);
            create_download_button("fungal_homolog_table_download", fungal_homolog_table, locus['display_name'] + "_fungal_homolog_annotations");

        });
    
        let externalIDs = locus["aliases"];

        if (externalIDs.length > 0) {
	    let alias_table = create_alias_table(externalIDs);
	    create_download_button("alias_table_download", alias_table, locus["display_name"] + "_external_ids");
	}
        else {
	    $("#alias_header").remove();
	    let $parent = $("#alias_table").parent();
	    $parent.html("No external identifier available for " + locus["display_name"] + ".");
	    return "";
	}
    
});


function create_fungal_homolog_table(data) {
        var datatable = [];
        var homologs = {};
        for (var i=0; i < data.length; i++) {
                datatable.push(fungal_homolog_data_to_table(data[i], i));
                homologs[data[i]["id"]] = true;
        }

        // set_up_header('fungal_homolog_table', datatable.length, 'entry', 'entries', Object.keys(homologs).length, 'homolog', 'homologs');
        set_up_header('fungal_homolog_table', datatable.length, 'entry', 'entries', datatable.length, 'homolog', 'homologs');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
        options["oLanguage"] = {"sEmptyTable": "No homolog data for " + locus['display_name']};
        options["aaData"] = datatable;

        return create_table("fungal_homolog_table", options);

}

function create_homolog_table(data) {
        var datatable = [];
        var homologs = {};
        for (var i=0; i < data.length; i++) {
        datatable.push(homolog_data_to_table(data[i], i));
                homologs[data[i]["id"]] = true;
        }

        set_up_header('homolog_table', datatable.length, 'entry', 'entries', Object.keys(homologs).length, 'homolog', 'homologs');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, null, null, null, null];
        options["oLanguage"] = {"sEmptyTable": "No homolog data for " + locus['display_name']};
        options["aaData"] = datatable;

        return create_table("homolog_table", options);

}


function create_complement_table(data) {
  	var datatable = [];
	var complements = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(complement_data_to_table(data[i], i));
		complements[data[i]["id"]] = true;
	}

        set_up_header('complement_table', datatable.length, 'entry', 'entries', Object.keys(complements).length, 'complement', 'complements');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, {"sWidth": "250px"},  null, null];
        options["oLanguage"] = {"sEmptyTable": "No complement data for " + locus['display_name']};
	options["aaData"] = datatable;

        return create_table("complement_table", options);

}

function create_alias_table(data) {

  var datatable = [];

  var sources = {};
  for (var i = 0; i < data.length; i++) {
    if (data[i]["protein"]) {
      datatable.push([
        data[i]["id"],
        create_link(data[i]["display_name"], data[i]["link"], true),
        data[i]["source"]["display_name"]
      ]);
      sources[data[i]["source"]["display_name"]] = true;
    }
  }

  set_up_header(
    "alias_table",
    datatable.length,
    "entry",
    "entries",
    Object.keys(sources).length,
    "source",
    "sources"
  );

  var options = {};
  options["aaSorting"] = [[2, "asc"]];
  options["aoColumns"] = [{ bSearchable: false, bVisible: false }, null, null];
  options["aaData"] = datatable;
  options["oLanguage"] = {
    sEmptyTable: "No external identifiers for " + locus["display_name"] + "."
  };

  return create_table("alias_table", options);
}

