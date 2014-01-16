add_navbar_title(list_name_html);
add_navbar_element('Tools', 'tools');
add_navbar_element('Genes', 'gene_list');
add_navbar_element('GO Process Enrichment', 'enrichment');

$(document).ready(function() {

    var gene_table = create_gene_table(bioents);
    create_download_button("gene_list_table_download", gene_table, download_table_link, list_name);

    var enrichment_table = create_enrichment_table("enrichment_table", gene_table, null);
    create_download_button("enrichment_table_download", enrichment_table, download_table_link, list_name + "_go_enrichment");

    set_up_tools("go_term_finder", "go_slim_mapper", "spell", "yeastmine");

});

function create_gene_table(data) {
    var gene_table = null;
    if(data != null && data.length > 0) {
	    var datatable = [];

        for (var i=0; i < data.length; i++) {
            datatable.push(gene_data_to_table(data[i]));
        }

        $("#gene_list_header").html(data.length);

        var options = {};
	    options["bPaginate"] = false;
	    options["aaSorting"] = [[3, "asc"]];
	    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null];
	    options["aaData"] = datatable;

        gene_table = create_table("gene_list_table", options);
	}
	return gene_table;
}

function post_to_yeastmine(bioent_ids) {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "http://yeastmine.yeastgenome.org/yeastmine/portal.do");
    
    var cinp = document.createElement("input");
    cinp.setAttribute("type", "hidden");
    cinp.setAttribute("name", "class");
    cinp.setAttribute("value", "ORF");
    form.appendChild(cinp);

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "externalids");
    hiddenField.setAttribute("value", bioent_ids);
        hiddenField.id = "data";
    form.appendChild(hiddenField);

    document.body.appendChild(form);
    form.submit();
}

function set_up_tools(go_term_finder_id, go_slim_mapper_id, spell_id, yeastmine_id) {
	document.getElementById(go_term_finder_id).onclick = function f() {
		var bioent_format_names = '';

		var data = table._('tr', {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][0];
			bioent_format_names = bioent_format_names + sys_name + ' ';
		}
		post_to_url("http://yeastgenome.org/cgi-bin/GO/goTermFinder.pl", {
			"loci" : bioent_format_names
		});
	};
	document.getElementById(go_slim_mapper_id).onclick = function f() {
		var bioent_format_names = '';
		var data = table._('tr', {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][0];
			bioent_format_names = bioent_format_names + sys_name + ' ';
		}
		post_to_url("http://yeastgenome.org/cgi-bin/GO/goSlimMapper.pl", {
			"loci" : bioent_format_names
		});
	};
	document.getElementById(spell_id).onclick = function f() {
		var bioent_format_names = [];
		var data = table._('tr', {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][0];
			bioent_format_names.push(sys_name);
		}
		post_to_url("http://spell.yeastgenome.org/search/show_results", {
			"search_string" : bioent_format_names
		});
	};
	document.getElementById(yeastmine_id).onclick = function f() {
		var bioent_format_names = [];
		var data = table._('tr', {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][0];
			bioent_format_names.push(sys_name);
		}
		post_to_yeastmine(bioent_format_names);
	};
}
