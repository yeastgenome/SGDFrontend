
$(document).ready(function() {

    var gene_table = create_gene_table(bioents);
    create_download_button("gene_list_table_download", gene_table, list_name);
    $("#gene_list_table_analyze").hide();
    set_up_tools(gene_table, "go_term_finder", "go_slim_mapper", "spell", "alliancemine");

});

function create_gene_table(data) {
    var gene_table = null;
    if(data != null && data.length > 0) {
	    var datatable = [];

        for (var i=0; i < data.length; i++) {
            datatable.push(gene_data_to_table(data[i]));
        }

        $("#gene_list_table_header").html(data.length);

        var options = {};
	    options["bPaginate"] = false;
	    options["aaSorting"] = [[3, "asc"]];
	    options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, null, null];
	    options["aaData"] = datatable;

        gene_table = create_table("gene_list_table", options);
	}
	return gene_table;
}

function post_to_alliancemine(bioent_ids) {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "https://www.alliancegenome.org/alliancemine/portal.do?goToListUpload=true");
    
    var cinp = document.createElement("input");
    cinp.setAttribute("type", "hidden");
    cinp.setAttribute("name", "class");
    cinp.setAttribute("value", "Gene");
    form.appendChild(cinp);

    var vinp = document.createElement("input");
    vinp.setAttribute("type", "hidden");
    vinp.setAttribute("name", "extraValue");
    vinp.setAttribute("value", "S. cerevisiae");
    form.appendChild(vinp);

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "externalids");
    hiddenField.setAttribute("value", bioent_ids);
    hiddenField.id = "data";
    form.appendChild(hiddenField);

    document.body.appendChild(form);
    form.submit();
}

function set_up_tools(table, go_term_finder_id, go_slim_mapper_id, spell_id, alliancemine_id) {
	document.getElementById(go_term_finder_id).onclick = function f() {
		var bioent_format_names = '';

		var data = table._("tr", {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][2];
			bioent_format_names = bioent_format_names + sys_name + " ";
		}
		var localStorageGeneList = data.reduce(function(acc, d) {
			var sysName = d[2];
			return acc + sysName + " ";
		}, "");
		window.localStorage.setItem("geneList", localStorageGeneList);
		var url = '/goTermFinder';
		location.assign(url);
	};
	document.getElementById(go_slim_mapper_id).onclick = function f() {
	        var bioent_format_names = '';

	        var data = table._("tr", {"filter": "applied"});
	        for (var i=0,len=data.length; i<len; i++) {
		    var sys_name = data[i][2];
		    bioent_format_names = bioent_format_names + sys_name + " ";
	        }
	        var localStorageGeneList = data.reduce(function(acc, d) {
		    var sysName = d[2];
		    return acc + sysName + " ";
                }, "");
	        window.localStorage.setItem("geneList4slim", localStorageGeneList);
	        var url = '/goSlimMapper';
	        location.assign(url);

	};
	document.getElementById(spell_id).onclick = function f() {
		var bioent_format_names = [];
		var data = table._("tr", {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][2];
			bioent_format_names.push(sys_name);
		}
		post_to_url("https://spell.yeastgenome.org/search/show_results", {
			"search_string" : bioent_format_names
		});
	};
	document.getElementById(alliancemine_id).onclick = function f() {
		var bioent_format_names = [];
		var data = table._('tr', {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][2];
			bioent_format_names.push(sys_name);
		}
		post_to_alliancemine(bioent_format_names);
	};
}
