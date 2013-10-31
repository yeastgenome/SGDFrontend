
var table;
var format_name_to_id = new Object();
var filter_used_for_go = '';
var filter_message;
function update_filter_used() {
	filter_used_for_go = table.fnSettings().oPreviousSearch.sSearch;
	filter_message.style.display = "none";
}

function set_up_gene_table(table_id, header_id, filter_message_id, download_button_id, download_link, download_table_filename, data) {
	var datatable = [];
	for (var i=0; i < data.length; i++) {
		var bioent = data[i];
  			
		var bioent_name = create_link(bioent['display_name'], bioent['link'])
		
		format_name_to_id[bioent['format_name']] = bioent['id']
		
  		datatable.push([bioent['format_name'], bioent_name, bioent['description']])
  	}
  	  	
  	document.getElementById(header_id).innerHTML = data.length;
  	
  	var options = {};
	options["bPaginate"] = false;
	options["aaSorting"] = [[1, "asc"]];
	options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, null, null];	
	options["aaData"] = datatable;
  				
	setup_datatable_highlight();	
	table = $("#" + table_id).dataTable(options);
	table.fnSearchHighlighting();
	
	filter_message = document.getElementById(filter_message_id);
	table.bind("filter", function() {
		var search = table.fnSettings().oPreviousSearch.sSearch;
		if(search != filter_used_for_go) {
			filter_message.style.display = "block";
		}
		else {
			filter_message.style.display = "none";
		}
	})

	document.getElementById(download_button_id).onclick = function() {
		download_table(table, download_link, download_table_filename)
	};
	return table;
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
