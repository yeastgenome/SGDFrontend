$(document).ready(function() {

  	$.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/disease_details', function(data) {
  	    var mc_disease_table = create_disease_table("mc", "No manually curated terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "manually curated"}, data);
        create_download_button("mc_disease_table_download", mc_disease_table, locus['display_name'] + "_mc_disease");

        var htp_disease_table = create_disease_table("htp", "No high-throughput terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "high-throughput"}, data);
        create_download_button("htp_disease_table_download", htp_disease_table, locus['display_name'] + "_htp_disease");

        var comp_disease_table = create_disease_table("comp", "No computational terms for " + locus['display_name'], function(x) {return x["annotation_type"] == "computational"}, data);
        create_download_button("comp_disease_table_download", comp_disease_table, locus['display_name'] + "_comp_disease");


        var transformed_data = [];
        var mc_count = 0;
        var htp_count = 0;
        var comp_count = 0;
        for (var i=0; i < data.length; i++) {
            transformed_data.push(disease_data_to_table(data[i], i));
            if(data[i]['annotation_type'] == 'manually curated') {
                mc_count = mc_count + 1;
            }
            else if(data[i]['annotation_type'] == 'high-throughput') {
                htp_count = htp_count + 1;
            }
            else if(data[i]['annotation_type'] == 'computational') {
                comp_count = comp_count + 1;
            }
        }
        var headers = ["Evidence ID", "Analyze ID", "", "Gene", "Gene Format Name", "Disease Ontology Term", "Disease Ontology Term ID", "With", "Method", "Evidence", "Source", "Assigned On", "Reference", "Relationships"];
        create_download_button_no_table("disease_download_all", headers, transformed_data, locus['display_name'] + "_disease_annotations")

        if(mc_count == 0) {
            $("#manual_message").show();
        }
        if(htp_count == 0) {
            $("#htp_message").show();
        }
        if(comp_count == 0) {
            $("#comp_message").show();
        }
  	});

  	$.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/disease_graph', function(data) {
            if(data['nodes'].length > 1) {
		var analyze_genes = [];
                for (var i = 0; i < data["nodes"].length; i++) {
                    if (data["nodes"][i]["category"] === 'Yeast Gene' || data["nodes"][i]["category"] === data["nodes"][i]["name"]) {
                        analyze_genes.push(data["nodes"][i]["id"]);
                    }
		}
		create_analyze_button_with_list(
                    "cy_shared_disease_gene_analyze",
                    analyze_genes,
                    "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> Shared Disease Gene List",
                    true
                );
                var _categoryColors = {
                    'FOCUS': 'black',
                    'Yeast Gene': '#1f77b4',
                    'Human Gene': '#17becf',
                    'Disease': '#D95F02'
                };
                views.network.render(data, _categoryColors);
	    }
	    else {
		hide_section("network");
	    }
	});
});

function create_disease_table(prefix, message, filter, data) {
    var options = {};
     options["aoColumns"] = [
            {"bSearchable":false, "bVisible":false}, //evidence_id
            {"bSearchable":false, "bVisible":false}, //analyze_id
            {"bSearchable":false, "bVisible":false}, //gene
            {"bSearchable":false, "bVisible":false}, //gene systematic name
            null, //disease ontology term
            {"bSearchable":false, "bVisible":false}, // disease ontology term id
            null, //qualifier
            null, //evidence
            {"bSearchable":false, "bVisible":false}, //method
            null, //source
            null, //assigned on
            {"bSearchable":false, "bVisible":false}, //annotation_extension
            null // reference
    ];
    options["bPaginate"] = true;
    options["aaSorting"] = [[5, "asc"]];

    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var diseases = {};
        for (var i=0; i < data.length; i++) {
            if(filter(data[i])) {
                datatable.push(disease_data_to_table(data[i], i));
                diseases[data[i]['disease']['id']] = true;
            }
        }

        set_up_header(prefix + '_disease_table', datatable.length, 'entry', 'entries', Object.keys(diseases).length, 'Disease Ontology term', 'Disease Ontology terms');

        options["oLanguage"] = {"sEmptyTable": message};
        options["aaData"] = datatable;

        if(Object.keys(diseases).length == 0) {
            $("#" + prefix + "_disease").hide();
            $("#" + prefix + "_subsection").hide();
        }

        $("#" + prefix + "_disease_table_analyze").hide();
        return create_table(prefix + "_disease_table", options);

    }

}

function slider_filter(new_cutoff) {
    return "node[gene_count >= " + new_cutoff + "], edge";
}
