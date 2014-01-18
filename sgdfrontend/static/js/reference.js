
$(document).ready(function() {

  	$.getJSON(interaction_details_link, function(data) {
  	    var interaction_table = create_interaction_table(data);
        create_download_button("interaction_table_download", interaction_table, download_table_link, interaction_download_filename);
        create_analyze_button("interaction_table_analyze", interaction_table, analyze_link, interaction_analyze_filename, true);
  	});

  	$.getJSON(go_details_link, function(data) {
  		var go_table = create_go_table(data);
  		create_download_button("all_go_table_download", go_table, download_table_link, go_download_filename);
	  	create_analyze_button("all_go_table_analyze", go_table, analyze_link, go_analyze_filename, true);
  	});

  	$.getJSON(phenotype_details_link, function(data) {
  		var phenotype_table = create_phenotype_table(data);
        create_download_button("phenotype_table_download", phenotype_table, download_table_link, phenotype_download_filename);
        create_analyze_button("phenotype_table_analyze", phenotype_table, analyze_link, phenotype_analyze_filename, true);
  	});

  	$.getJSON(regulation_details_link, function(data) {
  		var regulation_table = create_regulation_table(data);
  	    create_download_button("all_regulation_table_download", regulation_table, download_table_link, regulation_download_filename);
  		create_analyze_button("all_regulation_table_analyze", regulation_table, analyze_link, regulation_analyze_filename, true);
  	});

  	//Hack because footer overlaps - need to fix this.
	add_footer_space("all_regulation");

});

function create_interaction_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}]
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(interaction_data_to_table(data[i], i));
            genes[data[i]["bioentity2"]["id"]] = true;
        }

        $("#interaction_header").html(data.length);
        $("#interaction_subheader").html(Object.keys(genes).length);
        $("#interaction_subheader_type").html("genes");

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}]
        options["oLanguage"] = {"sEmptyTable": "No interaction data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("interaction_table", options);
}

function create_go_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["bDestroy"] = true;
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}];
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(go_data_to_table(data[i], i));
            genes[data[i]["bioentity"]["id"]] = true;
        }

        $("#all_go_header").html(data.length);
        $("#all_go_subheader").html(Object.keys(genes).length);
        $("#all_go_subheader_type").html("genes");

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["bDestroy"] = true;
        options["oLanguage"] = {"sEmptyTable": "No gene ontology data for " + display_name};
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}];
        options["aaData"] = datatable;
    }

    return create_table("all_go_table", options);
}

function create_phenotype_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {'sWidth': '250px'}, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var phenotypes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            phenotypes[data[i]['bioconcept']['id']] = true;
        }

        $("#phenotype_header").html(data.length);
        $("#phenotype_subheader").html(Object.keys(phenotypes).length);
        $("#phenotype_subheader_type").html('phenotypes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {'sWidth': '250px'}, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("phenotype_table", options);
}

function create_regulation_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, {"bSearchable":false, "bVisible":false}]
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(regulation_data_to_table(data[i], false));
            genes[data[i]["bioentity2"]["id"]] = true;
        }

        $("#all_regulation_header").html(data.length);
        $("#all_regulation_subheader").html(Object.keys(genes).length);
        $("#all_regulation_subheader_type").html("genes");

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, {"bSearchable":false, "bVisible":false}]
        options["oLanguage"] = {"sEmptyTable": "No regulation data for " + display_name};
        options["aaData"] = datatable;
    }

	return create_table("all_regulation_table", options);
}