
$(document).ready(function() {
    views.regulation.render();
    $("#enrichment_table_analyze").hide();
    if(locus['regulation_overview']['paragraph'] != null) {
        document.getElementById("summary_paragraph").innerHTML = locus['regulation_overview']['paragraph']['text'];
        set_up_references(locus['regulation_overview']['paragraph']['references'], "summary_paragraph_reference_list");
    }

    if(locus['regulation_overview']['target_count'] > 0) {
        $("#domain_table_analyze").hide();
        $.getJSON('/backend/locus/' + locus['id'] + '/protein_domain_details', function(data) {
            var domain_table = create_domain_table(data);
            if(domain_table != null) {
                create_download_button("domain_table_download", domain_table, locus['display_name'] + "_domains");
            }
        });
    }

    if(locus['regulation_overview']['target_count'] > 0) {
        $.getJSON('/backend/locus/' + locus['id'] + '/binding_site_details', function(data) {
            // manually change binding site motif locations to s3 locations
            data.forEach( function (d) {
                d.link = d.link.replace('/static/img/yetfasco', 'https://s3-us-west-2.amazonaws.com/sgd-prod-binding-site-motifs')
            });
            create_binding_site_table(data);
        });
    }

    $.getJSON('/backend/locus/' + locus['id'] + '/regulation_details', function(data) {
        
        if(locus['regulation_overview']['target_count'] > 0) {
            var target_tables = create_target_table(data);
            create_analyze_button("analyze_targets", target_tables.all, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> targets", false);
            create_analyze_button("manual_target_table_analyze", target_tables.manual, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> targets", true);
            create_download_button("manual_target_table_download", target_tables.manual, locus['display_name'] + "_targets");
            create_analyze_button("htp_target_table_analyze", target_tables.htp, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> targets", true);
            create_download_button("htp_target_table_download", target_tables.htp, locus['display_name'] + "_targets");

            $.getJSON('/backend/locus/' + locus['id'] + '/regulation_target_enrichment', function(enrichment_data) {
                var enrichment_table = create_enrichment_table("enrichment_table", target_tables.all, enrichment_data);
                create_download_button("enrichment_table_download", enrichment_table, locus['display_name'] + "_targets_go_process_enrichment");
            });
        }
        else {
            $("#targets").hide();
            $("#domain").hide();
            $("#enrichment").hide();
        }

        var regulator_tables = create_regulator_table(data);
        
        if(locus['regulation_overview']['target_count'] + locus['regulation_overview']['regulator_count'] > 0) {
            create_analyze_button("analyze_regulators", regulator_tables.all, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> regulators", false);
            create_analyze_button("manual_regulator_table_analyze", regulator_tables.manual, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> regulators", true);
            create_download_button("manual_regulator_table_download", regulator_tables.manual, locus['display_name'] + "_regulators");
            create_analyze_button("htp_regulator_table_analyze", regulator_tables.htp, "<a href='" + locus['link'] + "' class='gene_name'>" + locus['display_name'] + "</a> regulators", true);
            create_download_button("htp_regulator_table_download", regulator_tables.htp, locus['display_name'] + "_regulators");
        }
        else {
            $("#regulator_table_download").hide();
            $("#regulator_table_analyze").hide();
        }
    });

    $.getJSON('/backend/locus/' + locus['id'] + '/regulation_graph', function(data) {
        if(data != null && data["nodes"].length > 1) {
            var _categoryColors = {
                'REGULATOR': '#6CB665',
                'TARGET': '#9F75B8',
                'FOCUS': '#1f77b4'
            };
            views.network.render(data, _categoryColors);
        }
        else {
            hide_section("network");
        }
    });
});

function create_domain_table(data) {
    var domain_table = null;
    if(data != null && data.length > 0) {
        var datatable = [];
        var domains = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(domain_data_to_table(data[i]));
            domains[data[i]['domain']['id']] = true;
        }

        set_up_header('domain_table', datatable.length, 'entry', 'entries', Object.keys(domains).length, 'domain', 'domains');

        set_up_range_sort();

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null, null]
        options["aaData"] = datatable;

        domain_table = create_table("domain_table", options);
    }
    return domain_table;
}

function create_binding_site_table(data) {
    if(data.length > 0) {
        $("#binding").show();
        var list = $("#binding_motifs");
        for (var i=0; i < data.length; i++) {
            var evidence = data[i];

            var a = document.createElement("a");
            a.href = "http://yetfasco.ccbr.utoronto.ca/MotViewLong.php?PME_sys_qf2=" + evidence["motif_id"];
            a.target = "_blank";
            var img = document.createElement("img");
            img.src = evidence["link"];
            img.className = "yetfasco";

            a.appendChild(img);
            list.append(a);
        }
    }
    else {
        hide_section("binding");
    }
}

function create_target_table(data) {
    // table column options
    var targetTableColOptions = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null];
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = targetTableColOptions;
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var manualDatatable = [];
        var htpDatatable = [];
        var allDatatable = [];
        var manualGenes = {};
        var htpGenes = {};
        var target_entry_count = 0;
        for (var i=0; i < data.length; i++) {
            var d = data[i];
            if(d["locus1"]["id"] == locus['id']) {
                var isManual = (d.annotation_type !== 'high-throughput');
                if (isManual) {
                    manualDatatable.push(regulation_data_to_table(d, false));
                    manualGenes[d["locus2"]["id"]] = true;
                } else {
                    htpDatatable.push(regulation_data_to_table(d, false));
                    htpGenes[d["locus2"]["id"]] = true;
                }
                allDatatable.push(regulation_data_to_table(d, false));
                target_entry_count = target_entry_count + 1;
            }
        }
        set_up_header('manual_target_table', manualDatatable.length, 'entry', 'entries', Object.keys(manualGenes).length, 'gene', 'genes');
        set_up_header('htp_target_table', htpDatatable.length, 'entry', 'entries', Object.keys(htpGenes).length, 'gene', 'genes');

        var manualOptions = {};
        manualOptions["bPaginate"] = true;
        manualOptions["aaSorting"] = [[4, "asc"]];
        manualOptions["aoColumns"] = targetTableColOptions;
        manualOptions["oLanguage"] = {"sEmptyTable": "No manually curated targets " + locus['display_name']};
        manualOptions["aaData"] = manualDatatable;
        var htpOptions = {};
        htpOptions["bPaginate"] = true;
        htpOptions["aaSorting"] = [[4, "asc"]];
        htpOptions["aoColumns"] = targetTableColOptions;
        htpOptions["oLanguage"] = {"sEmptyTable": "No HTP targets for " + locus['display_name']};
        htpOptions["aaData"] = htpDatatable;
        var allOptions = {};
        allOptions["bPaginate"] = true;
        allOptions["aaSorting"] = [[4, "asc"]];
        allOptions["aoColumns"] = targetTableColOptions;
        allOptions["oLanguage"] = {"sEmptyTable": "No HTP targets for " + locus['display_name']};
        allOptions["aaData"] = allDatatable;
    }

    var _manual = create_table("manual_target_table", manualOptions);
    var _htp = create_table("htp_target_table", htpOptions);
    var _all = create_table("all_target_table", allOptions);
    return {
        manual: _manual,
        htp: _htp,
        all: _all,
    };
}

function create_regulator_table(data) {
    var regulatorTableColOptions = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, {"bSearchable":false, "bVisible":false}, null, null, null];
    var manualDatatable = [];
    var htpDatatable = [];
    var allDatatable = [];
    var manualGenes = {};
    var htpGenes = {};
    var regulation_entry_count = 0;
    for (var i=0; i < data.length; i++) {
        var d = data[i];
        if(d["locus2"]["id"] == locus['id']) {
           var isManual = (d.annotation_type !== 'high-throughput');
            if (isManual) {
                manualDatatable.push(regulation_data_to_table(d, true));
                manualGenes[d["locus1"]["id"]] = true;
            } else {
                htpDatatable.push(regulation_data_to_table(d, true));
                htpGenes[d["locus1"]["id"]] = true;
            }
            allDatatable.push(regulation_data_to_table(d, true));
            regulation_entry_count = regulation_entry_count+1;
        }
    }
    set_up_header('manual_regulator_table', manualDatatable.length, 'entry', 'entries', Object.keys(manualGenes).length, 'gene', 'genes');
    set_up_header('htp_regulator_table', htpDatatable.length, 'entry', 'entries', Object.keys(htpGenes).length, 'gene', 'genes');

    var manualOptions = {};
    manualOptions["bPaginate"] = true;
    manualOptions["aaSorting"] = [[2, "asc"]];
    manualOptions["aoColumns"] = regulatorTableColOptions;
    manualOptions["oLanguage"] = {"sEmptyTable": "No manually curated regulators for " + locus['display_name']};
    manualOptions["aaData"] = manualDatatable;
    var htpOptions = {};
    htpOptions["bPaginate"] = true;
    htpOptions["aaSorting"] = [[2, "asc"]];
    htpOptions["aoColumns"] = regulatorTableColOptions;
    htpOptions["oLanguage"] = {"sEmptyTable": "No HTP regulators for " + locus['display_name']};
    htpOptions["aaData"] = htpDatatable;
    var allOptions = {};
    allOptions["bPaginate"] = true;
    allOptions["aaSorting"] = [[2, "asc"]];
    allOptions["aoColumns"] = regulatorTableColOptions;
    allOptions["oLanguage"] = {"sEmptyTable": "No HTP regulators for " + locus['display_name']};
    allOptions["aaData"] = allDatatable;

    var _manual = create_table("manual_regulator_table", manualOptions);
    var _htp = create_table("htp_regulator_table", htpOptions);
    var _all = create_table("all_regulator_table", allOptions);
    return {
        manual: _manual,
        htp: _htp,
        all: _all,
    };
}
