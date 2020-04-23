$(document).ready(function() {
    if(reference['expression_datasets'].length > 0) {
        $("#expression_table_analyze").hide();
        var expression_table = create_expression_table(reference['expression_datasets']);
        create_download_button("expression_table_download", expression_table, reference['display_name'] + '_datasets');
    }
    else {
        hide_section('expression');
    }

    if(reference['downloadable_files'].length > 0) {
        $("#downloadable_file_table_analyze").hide();
        var file_table = create_downloadable_file_table(reference['downloadable_files']);
        create_download_button("downloadable_file_table_download", file_table, reference['display_name'] + '_files');
    }
    else {
        hide_section('file');
    }

    $.getJSON('/backend/reference/' + reference['sgdid'] + '/literature_details', function(data) {
        data.sort(function(a, b) {return a['locus']['display_name'] > b['locus']['display_name']});

        create_literature_list('primary', data, 'Primary Literature')
        create_literature_list('additional', data, 'Additional Literature')
        create_literature_list('review', data, 'Reviews')
    });

    var download_link = '/download_citations';
    $("#download_citation").click(function() {post_to_url(download_link, {"display_name":reference['display_name'].replace(' ', '_') + '_citation.nbib', "reference_ids": [reference['id']]});})

    if(reference['counts']['interaction'] > 0) {
        $.getJSON('/backend/reference/' + reference['sgdid'] + '/interaction_details', function(data) {
            var interaction_table = create_interaction_table(data);
            create_download_button("interaction_table_download", interaction_table, reference['display_name'] + "_interactions");
            create_analyze_button("interaction_table_analyze", interaction_table, reference['display_name'] + " interaction genes", true);
        });
    }
    else {
        hide_section("interaction");
    }

    if(reference['counts']['go'] > 0) {
        $.getJSON('/backend/reference/' + reference['sgdid'] + '/go_details', function(data) {
            var go_table = create_go_table(data);
            create_download_button("go_table_download", go_table, reference['display_name'] + "_go_terms");
            create_analyze_button("go_table_analyze", go_table, reference['display_name'] + " Gene Ontology terms", true);
        });
    }
    else {
        hide_section("go");
    }

    if(reference['counts']['phenotype'] > 0) {
        $.getJSON('/backend/reference/' + reference['sgdid'] + '/phenotype_details', function(data) {
            var phenotype_table = create_phenotype_table(data);
            create_download_button("phenotype_table_download", phenotype_table, reference['display_name'] + "_phenotypes");
            create_analyze_button("phenotype_table_analyze", phenotype_table, reference['display_name'] + " phenotype genes", true);
        });
    }
    else {
        hide_section("phenotype");
    }

    if(reference['counts']['disease'] > 0) {
        $.getJSON('/backend/reference/' + reference['sgdid'] + '/disease_details', function(data) {
            var disease_table = create_disease_table(data);
            create_download_button("disease_table_download", disease_table, reference['display_name'] + "_diseases");
            create_analyze_button("disease_table_analyze", disease_table, reference['display_name'] + " disease genes", true);
        });
    }
    else {
        hide_section("disease");
    }

    if(reference['counts']["regulation"] > 0) {
        $.getJSON('/backend/reference/' + reference['sgdid'] + '/regulation_details', function(data) {
            var regulation_table = create_regulation_table(data);
            create_download_button("regulation_table_download", regulation_table, reference['display_name'] + "_regulation");
            create_analyze_button("regulation_table_analyze", regulation_table, reference['display_name'] + " regulation genes", true);
        });
    }
    else {
        hide_section("regulation");
    }

    if(reference['counts']['ptms'] > 0){
        $.getJSON('/backend/reference/' + reference['sgdid'] + '/posttranslational_details', function(data) {
            var phosphorylation_table = create_phosphorylation_table(data);
            create_download_button("phosphorylation_table_download",phosphorylation_table,reference['display_name'] + "_posttranslationannotations");
        });
    }
    else{
        hide_section("posttranslationannotation");
    }

});

function create_literature_list(list_id, data, topic) {
    var primary_list = $("#" + list_id + "_list");
    var see_more_list = document.createElement('span');
    see_more_list.id = list_id + '_see_more'

    var topic_data = [];
    for(var i=0; i < data.length; i++) {
        if(data[i]['topic'] == topic) {
            topic_data.push(data[i]);
        }
    }
    var count = 0;
    for(var i=0; i < topic_data.length; i++) {
        count = count + 1;
        var a = document.createElement('a');
        a.href = topic_data[i]['locus']['link'];
        a.innerHTML = topic_data[i]['locus']['display_name'];
        if(i > 10) {
            see_more_list.appendChild(a);
        }
        else {
            primary_list.append(a);
        }
        if(i != topic_data.length-1) {
            var comma = document.createElement('span');
	    comma.innerHTML = ' | ';  
            if(i > 10) {
                see_more_list.appendChild(comma);
            }
            else {
                primary_list.append(comma);
            }
        }
        else if(topic_data.length > 10) {
            var see_less = document.createElement('a');
            see_less.innerHTML = ' <i class="fa fa-arrow-circle-left"></i> Show fewer';
            see_less.id = list_id + '_see_less_button';
            see_less.onclick = function() {
                $('#' + list_id + '_see_more').hide();
                $('#' + list_id + '_see_more_button').show();
            };
            see_more_list.appendChild(see_less);
        }
        if(i==10) {
            var see_more = document.createElement('a');
            see_more.innerHTML = ' ... <i class="fa fa-arrow-circle-right"></i> Show all';
            see_more.id = list_id + '_see_more_button';
            see_more.onclick = function() {
                $('#' + list_id + '_see_more').show();
                $('#' + list_id + '_see_more_button').hide();
            };

            primary_list.append(see_more);
            primary_list.append(see_more_list);
        }
        $('#' + list_id + '_see_more').hide();
    }

    if(count > 0) {
        primary_list.show();
    }
    else {
        $("#" + list_id + "_list_header").hide()

    }
}

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
            genes[data[i]["locus1"]["id"]] = true;
            genes[data[i]["locus2"]["id"]] = true;
        }

        set_up_header('interaction_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bSortable":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, null, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}]
        options["oLanguage"] = {"sEmptyTable": "No interaction data for " + reference['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("interaction_table", options);
}

function create_go_table(data) {
    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[3, "asc"]];
    options["bDestroy"] = true;
    options["aoColumns"] = [
        //Use of mData
        {"bSearchable":false, "bVisible":false,"aTargets":[0],"mData":0}, //evidence_id
        {"bSearchable":false, "bVisible":false,"aTargets":[1],"mData":1}, //analyze_id
        {"aTargets":[2],"mData":2}, //gene
        {"bSearchable":false, "bVisible":false,"aTargets":[3],"mData":3}, //gene systematic name
        {"aTargets":[4],"mData":6}, //gene ontology term  -----> qualifier
        {"bSearchable":false, "bVisible":false,"aTargets":[5],"mData":5}, //gene ontology term id
        {"aTargets":[6],"mData":4}, //qualifier   -----> gene ontology term
        {"bSearchable":false, "bVisible":false,"aTargets":[7],"mData":7}, //aspect
        {"aTargets":[8],"mData":12}, //evidence   -----> annotation_extension
        {"aTargets":[9],"mData":8}, //method -----> evidence
        {"bSearchable":false,"bVisible":false,"aTargets":[10],"mData":9}, //source -----> method
        {"aTargets":[11],"mData":10}, //assigned on -----> source
        {"aTargets":[12],"mData":11}, //annotation_extension -----> assigned on
        {"aTargets":[13],"mData":13,"bVisible":false} // reference        
    ];

    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(go_data_to_table(data[i], i));
            genes[data[i]["locus"]["id"]] = true;
        }

        set_up_header('go_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        options["oLanguage"] = {"sEmptyTable": "No gene ontology data for " + reference['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("go_table", options);
}

function create_phenotype_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bSearchable":false, "bVisible":false}, null, null, null, {'sWidth': '250px'}, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(phenotype_data_to_table(data[i], i));
            genes[data[i]['locus']['id']] = true;
        }

        set_up_header('phenotype_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bSearchable":false, "bVisible":false}, null, null, null, {'sWidth': '250px'}, {"bSearchable":false, "bVisible":false}];
        options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + reference['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("phenotype_table", options);
}

function create_disease_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false},{"bSearchable":false, "bVisible":false},null,{"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false},null,null, {"bSearchable":false, "bVisible":false},null, null,{"bSearchable":false, "bVisible":false},null];
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(disease_data_to_table(data[i], i));
            genes[data[i]['locus']['id']] = true;
        }

        set_up_header('disease_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false},{"bSearchable":false, "bVisible":false},null,{"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false},null,null, {"bSearchable":false, "bVisible":false},null, null,{"bSearchable":false, "bVisible":false},null];
        options["oLanguage"] = {"sEmptyTable": "No disease data for " + reference['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("disease_table", options);
}

function create_regulation_table(data) {
    if("Error" in data) {
        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[4, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null, null, null, null, {"bSearchable":false, "bVisible":false}]
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var not = {"bSearchable":false, "bVisible":false};
        var tableOptions = [not, not, null, not, null, not, not, not, not, not, null, null, null, null, null, not, not];
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(regulation_data_to_table(data[i], null));
            genes[data[i]["locus1"]["id"]] = true;
            genes[data[i]["locus2"]["id"]] = true;
        }

        set_up_header('regulation_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        var options = {};
        options["bPaginate"] = true;
        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = tableOptions;
        options["oLanguage"] = {"sEmptyTable": "No regulation data for " + reference['display_name']};
        options["aaData"] = datatable;
    }

	return create_table("regulation_table", options);
}

function create_expression_table(data) {
    var options = {
        'bPaginate': true,
        'aaSorting': [[3, "asc"]],
        'aoColumns': [
            {"bSearchable":false, "bVisible":false}, //Evidence ID
            {"bSearchable":false, "bVisible":false}, //Analyze ID,
            {"bVisible":false}, //Histogram
            null, //Dataset
            null, //Description
            null, //Tags
            null, //Number of Conditions
            {"bSearchable":false, "bVisible":false} //Reference
            ]
    }
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var reference_ids = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(dataset_datat_to_table(data[i], i));
            if(data[i]['reference'] != null) {
                reference_ids[data[i]['reference']['id']] = true;
            }
        }

        set_up_header('expression_table', datatable.length, 'dataset', 'datasets', Object.keys(reference_ids).length, 'reference', 'references');

        options["oLanguage"] = {"sEmptyTable": "No expression data for " + reference['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("expression_table", options);
}


function create_downloadable_file_table(data) {
    var options = {
        'bPaginate': true,
        'aaSorting': [[3, "asc"]],
        'aoColumns': [
             {"bSearchable":false, "bVisible":false}, //Evidence ID
             {"bSearchable":false, "bVisible":false}, //Analyze ID,
             null, //File
             null //Description
        ]
    }
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        // var reference_ids = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(downloadable_file_to_table(data[i], i));
            // if(data[i]['reference'] != null) {
            //    reference_ids[data[i]['reference']['id']] = true;
            // }
        }

        set_up_header('downloadable_file_table', datatable.length, 'file', 'files');

        options["oLanguage"] = {"sEmptyTable": "No downloadable file for " + reference['display_name']};
        options["aaData"] = datatable;
    }

    return create_table("downloadable_file_table", options);
}



function create_phosphorylation_table(data) {
    var datatable = [];
    
    var sites = {};
    for (var i = 0; i < data.length; i++) {
        datatable.push(['','','','',data[i]['protein'],'',data[i]["site_residue"] + data[i]["site_index"],data[i]['modification'],'',data[i]['modifier']])
        sites[data[i]["site_residue"] + data[i]["site_index"]] = true;
    }
    set_up_header("phosphorylation_table", datatable.length, "entry", "entries", Object.keys(sites).length, "site", "sites");
    
    set_up_phospho_sort();
    
    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[4, "asc"]];
    options["bDestroy"] = true;
    options["aoColumns"] = [
        { bSearchable: false, bVisible: false },
        { bSearchable: false, bVisible: false },
        { bSearchable: false, bVisible: false },
        { bSearchable: false, bVisible: false },
        { sTitle:'Protein', bSearchable: true, bVisible: true },
        { bSearchable: false, bVisible: false },
        { sTitle:'Site',sType: "phospho" ,bSearchable: true},
        {sTitle:'Modification',},
        { bSearchable: false, bVisible: false },
        {sTitle:'Modifier',bSearchable: true},
    ];
    options["aaData"] = datatable;
    
    options["oLanguage"] = {
        sEmptyTable: "No post-translational data for this reference."
    };
    
    return create_table("phosphorylation_table", options);
    }

