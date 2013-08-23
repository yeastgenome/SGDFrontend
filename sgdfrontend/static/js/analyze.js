
function set_up_gene_table(table_id, download_button_id, download_link, download_table_filename) {
	var options = {};
	options["bPaginate"] = false;
	options["aaSorting"] = [[0, "asc"]];
	options["aoColumns"] = [null, null];
	var table = $("#" + table_id).dataTable(options);

	document.getElementById(download_button_id).onclick = function() {
		download_table(table, download_link, download_table_filename)
	};

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

function set_up_tools(go_term_finder_id, go_slim_mapper_id, spell_id, yeastmine_id, bioent_ids) {
	document.getElementById(go_term_finder_id).onclick = function f() {
		post_to_url("http://yeastgenome.org/cgi-bin/GO/goTermFinder.pl", {
			"loci" : bioent_ids
		});
	};
	document.getElementById(go_slim_mapper_id).onclick = function f() {
		post_to_url("http://yeastgenome.org/cgi-bin/GO/goSlimMapper.pl", {
			"loci" : bioent_ids
		});
	};
	document.getElementById(spell_id).onclick = function f() {
		post_to_url("http://spell.yeastgenome.org/search/show_results", {
			"search_string" : bioent_ids
		});
	};
	document.getElementById(yeastmine_id).onclick = function f() {
		post_to_yeastmine(bioent_ids.split(' '));
	};
}