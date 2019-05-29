
$(document).ready(function() {

	$.getJSON('/backend/chemical/' + chemical['id']  + '/phenotype_details', function(data) {
	  	var phenotype_table = create_phenotype_table(data);
	  	create_analyze_button("phenotype_table_analyze", phenotype_table, "<a href='" + chemical['link'] + "' class='gene_name'>" + chemical['display_name'] + "</a> Genes", true);
  	    create_download_button("phenotype_table_download", phenotype_table, chemical['display_name'] + "_phenotype_annotations");
	});

	$.getJSON('/backend/chemical/' + chemical['id']  + '/go_details', function(data) {
                var go_table = create_go_table(data);
                create_analyze_button("go_table_analyze", go_table, "<a href='" + chemical['link'] + "' class='gene_name'>" + chemical['display_name'] + "</a> Genes", true);
		create_download_button("go_table_download", go_table, chemical['display_name'] + "_go_annotations");
	});

	$.getJSON('/backend/chemical/' + chemical['id']  + '/network_graph', function(data) {

		if (data != null && data["nodes"].length > 1) {
		    var _categoryColors = {
			'FOCUS': 'black',
			'GO': '#2ca02c',
			'PHENOTYPE': '#1f77b4',
			'COMPLEX': '#E6AB03',
			'CHEMICAL': '#7d0df3'
		    };
		    var filters = {
			' All': function(d) { return true; },
			' GO Terms': function(d) {
			    var acceptedCats = ['FOCUS', 'GO', 'CHEMICAL'];
			    return acceptedCats.includes(d.category);
			},
			' Phenotypes': function(d) {
			    var acceptedCats = ['FOCUS', 'PHENOTYPE', 'CHEMICAL'];
			    return acceptedCats.includes(d.category);
			},
			' Complexes': function(d) {
                            var acceptedCats = ['FOCUS', 'COMPLEX', 'CHEMICAL'];
                            return acceptedCats.includes(d.category);
                        },
		       
		    }
		    views.network.render(data, _categoryColors, "j-chemical-network", filters, true);
		} else {
		    hide_section("network");
		}
		
	});

});


function create_phenotype_table(data) {
  	var datatable = [];
	var phenotypes = {};
	for (var i=0; i < data.length; i++) {
        datatable.push(phenotype_data_to_table(data[i], i));
		phenotypes[data[i]["phenotype"]["id"]] = true;
	}

    set_up_header('phenotype_table', datatable.length, 'entry', 'entries', Object.keys(phenotypes).length, 'phenotype', 'phenotypes');

	var options = {};
	options["bPaginate"] = true;
	options["aaSorting"] = [[4, "asc"]];
    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, {"bSearchable":false, "bVisible":false}, null, null, {"bSearchable":false, "bVisible":false}, null, null, null, {"sWidth": "250px"}, null];
    options["oLanguage"] = {"sEmptyTable": "No phenotype data for " + chemical['display_name']};
	options["aaData"] = datatable;

    return create_table("phenotype_table", options);
}

function create_go_table(data) {

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[3, "asc"]];
    options["bDestroy"] = true;
    options["aoColumns"] = [
	    {"bSearchable":false, "bVisible":false}, //evidence_id                                       
	    {"bSearchable":false, "bVisible":false}, //analyze_id                                        
	    null, //gene                                                                                 
	    {"bSearchable":false, "bVisible":false}, //gene systematic name                              
	    null, //gene ontology term                                                                   
	    {"bSearchable":false, "bVisible":false}, //gene ontology term id                             
	    null, //qualifier                                                                            
	    {"bSearchable":false, "bVisible":false}, //aspect                                            
	    null, //method                                                                               
	    null, //evidence                                                                             
	    null, //source                                                                               
	    null, //assigned on                                                                          
	    null, //annotation_extension                                                                 
	    {"bSearchable":false, "bVisible":false} // reference                                         
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

        options["oLanguage"] = {"sEmptyTable": "No gene ontology data for " + chemical['display_name']};
        options["aaData"] = datatable;
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
            {"aTargets":[13],"mData":13} // reference  
	];
    }

    return create_table("go_table", options);
}