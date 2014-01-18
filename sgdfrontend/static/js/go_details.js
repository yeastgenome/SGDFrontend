$(document).ready(function() {

  	$.getJSON(go_details_link, function(data) {
  	    var mc_bp_go_table = create_go_table("mc_bp", "No manually curated biological process terms for " + display_name, function(x) {return x["method"] == "manually curated"}, data['biological_process']);
        create_download_button("mc_bp_go_table_download", mc_bp_go_table, download_table_link, mc_bp_download_table_filename);

        var mc_mf_go_table = create_go_table("mc_mf", "No manually curated molecular function terms for " + display_name, function(x) {return x["method"] == "manually curated"}, data['molecular_function']);
        create_download_button("mc_mf_go_table_download", mc_mf_go_table, download_table_link, mc_mf_download_table_filename);

        var mc_cc_go_table = create_go_table("mc_cc", "No manually curated cellular component terms for " + display_name, function(x) {return x["method"] == "manually curated"}, data['cellular_component']);
        create_download_button("mc_cc_go_table_download", mc_cc_go_table, download_table_link, mc_cc_download_table_filename);

        var htp_bp_go_table = create_go_table("htp_bp", "No high-throughput biological process terms for " + display_name, function(x) {return x["method"] == "high-throughput"}, data['biological_process']);
        create_download_button("htp_bp_go_table_download", htp_bp_go_table, download_table_link, htp_bp_download_table_filename);

        var htp_mf_go_table = create_go_table("htp_mf", "No high-throughput molecular function terms for " + display_name, function(x) {return x["method"] == "high-throughput"}, data['molecular_function']);
        create_download_button("htp_mf_go_table_download", htp_mf_go_table, download_table_link, htp_mf_download_table_filename);

        var htp_cc_go_table = create_go_table("htp_cc", "No high-throughput cellular component terms for " + display_name, function(x) {return x["method"] == "high-throughput"}, data['cellular_component']);
        create_download_button("htp_cc_go_table_download", htp_cc_go_table, download_table_link, htp_cc_download_table_filename);

        var comp_bp_go_table = create_go_table("comp_bp", "No computational biological process terms for " + display_name, function(x) {return x["method"] == "computational"}, data['biological_process']);
        create_download_button("comp_bp_go_table_download", comp_bp_go_table, download_table_link, comp_bp_download_table_filename);

        var comp_mf_go_table = create_go_table("comp_mf", "No computational molecular function terms for " + display_name, function(x) {return x["method"] == "computational"}, data['molecular_function']);
        create_download_button("comp_mf_go_table_download", comp_mf_go_table, download_table_link, comp_mf_download_table_filename);

        var comp_cc_go_table = create_go_table("comp_cc", "No computational cellular component terms for " + display_name, function(x) {return x["method"] == "computational"}, data['cellular_component']);
        create_download_button("comp_cc_go_table_download", comp_cc_go_table, download_table_link, comp_cc_download_table_filename);
  	});

	//Hack because footer overlaps - need to fix this.
	add_footer_space("comp");
});

function create_go_table(prefix, message, filter, data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var gos = {};
        for (var i=0; i < data.length; i++) {
            if(filter(data[i])) {
                datatable.push(go_data_to_table(data[i], i));
                gos[data[i]['bioconcept']['id']] = true;
            }
        }

        $("#" + prefix + "_go_header").html(datatable.length);
        $("#" + prefix + "_go_subheader").html(Object.keys(gos).length);
        $("#" + prefix + "_go_subheader_type").html('gene ontology terms');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[5, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": message};
        options["aaData"] = datatable;
    }

	$("#" + prefix + "_go_table_analyze").hide();

    return create_table(prefix + "_go_table", options);
}