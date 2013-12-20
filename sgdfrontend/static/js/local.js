http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
function post_to_url(path, params) {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
}

function post_json_to_url(link, data, onSuccess, onFailure) {
	$.ajax({url: link,
  		type: 'post',
  		data: JSON.stringify(data),
  		contentType: 'application/json',
  		processData: false,
  		dataType: "json",
  		success: onSuccess
 	}).fail(onFailure);
}

function download_citations(citation_div, download_link, list_name) {
	var reference_ids = [];
	var entries = document.getElementById(citation_div).children;
	for(var i=0,len=entries.length; i<len; i++) {
		reference_ids.push(entries[i].id)
	}
	
	post_to_url(download_link, {"display_name":list_name, "reference_ids": reference_ids});
}

function download_table(table, download_link, table_name) {
	var data = table._('tr', {"filter": "applied"});
	
	var table_headers = table.fnSettings().aoColumns;
	var headers = [];
	for(var i=0,len=table_headers.length; i<len; i++) {
		headers.push(table_headers[i].nTh.innerHTML);
	}

    var search_term = table.fnSettings().oPreviousSearch.sSearch
	if(search_term != '') {
		table_name = table_name + '_filtered_by_-' + search_term + '-'
	}

	post_to_url(download_link, {"display_name":table_name, 'headers': JSON.stringify(headers), 'data': JSON.stringify(data)});
}

function download_image(stage, width, height, download_link, image_name) {
	stage.toDataURL({
		width: width,
		height: height,
		callback: function(dataUrl) {
			post_to_url(download_link, {"display_name":image_name, 'data': dataUrl});
		}
	});
}

function analyze_table(analyze_link, list_name, ev_table, index, format_name_to_id) {
	var bioent_ids = [];
	
	var data = ev_table._('tr', {"filter": "applied"});
	for (var i=0,len=data.length; i<len; i++) { 
		var sys_name = data[i][index];
		bioent_ids.push(format_name_to_id[sys_name])
	}	
		
	var search_term = ev_table.fnSettings().oPreviousSearch.sSearch

	if(search_term != '') {
		list_name = list_name + ' filtered by -' + search_term + '-'
	}
	
	post_to_url(analyze_link, {'list_name': list_name, 'bioent_ids': JSON.stringify(bioent_ids)});
}

function set_up_references(references, ref_list_id) {
  	//Set up references
	var ref_list = document.getElementById(ref_list_id);
	for (var i=0; i < references.length; i++) {
		var reference = references[i];

		var li = document.createElement('li');
		li.id = references[i]['id']
		
		var a = document.createElement('a');
		var linkText = document.createTextNode(reference['display_name']);
		a.appendChild(linkText);
		a.href = reference['link'];
		li.appendChild(a);
		
		var span = document.createElement('span');
		var citation = reference['citation'];
		span.innerHTML = citation.substring(citation.indexOf(')')+1, citation.length) + ' ';
		li.appendChild(span);
		
		var pmid = document.createElement('small');
		pmid.innerHTML = 'PMID:' + reference['pubmed_id'];
		li.appendChild(pmid);
		
		var refLinks = document.createElement("ul");
		refLinks.className = "ref-links";
		
		var reflink_li = document.createElement('li');
		var a = document.createElement('a');
		var linkText = document.createTextNode('SGD Paper');
		a.appendChild(linkText);
		a.href = reference['link'];
		reflink_li.appendChild(a);
		refLinks.appendChild(reflink_li);
		
		for (var j=0; j < reference['urls'].length; j++) {
			var url = reference['urls'][j]
			var reflink_li = document.createElement('li');
			var a = document.createElement('a');
			var linkText = document.createTextNode(url['display_name']);
			a.appendChild(linkText);
			a.href = url['link'];
			a.target = '_blank';
			reflink_li.appendChild(a);
			refLinks.appendChild(reflink_li);
		}

		li.appendChild(refLinks);
		
		ref_list.appendChild(li);
	}
}

function set_up_resources(resource_id, data) {
	resource_list = document.getElementById(resource_id);
	for (var i=0; i < data.length; i++) {
		var a = document.createElement('a');
		var linkText = document.createTextNode(data[i]['display_name']);
		a.appendChild(linkText);
		a.href = data[i]['link'];
		a.target = '_blank';
		resource_list.appendChild(a);

        if(i != data.length-1) {
            var span=document.createElement('span');
		    span.innerHTML = ' | ';
		    resource_list.appendChild(span);
        }
	}
}

function create_link(display_name, link, new_window) {
	if(new_window) {
		return '<a href="' + link + '" target="_blank">' + display_name + '</a>'
	}
	else {
		return '<a href="' + link + '">' + display_name + '</a>'
	}
}

function create_note_icon(drop_id_num, text) {
	var icon;
	if(text != null && text != '') {
		icon = "<a href='#' data-dropdown='drop" + drop_id_num + "'><i class='icon-info-sign'></i></a><div id='drop" + drop_id_num + "' class='f-dropdown content medium' data-dropdown-content><p>" + text + "</p></div>"
	}
	else {
		icon = '';
	}
	return icon;
}

function setup_cytoscape_vis(div_id, layout, style, data, f) {
	var height = .5*$(window).height();
	var width = $('#' + div_id).width();
	document.getElementById(div_id).style.height = height + 'px';
	$(loadCy = function(){
		options = {
			showOverlay: false,
			layout: layout,
		    minZoom: 0.5,
		    maxZoom: 2,
		    style: style,
		
		    elements: {
		     	nodes: data['nodes'],
		     	edges: data['edges'],
		    },
		
		    ready: function(){
		      	cy = this;
		      	cy.zoomingEnabled(false);
		      	if(f != null) {
		      		f();
		      	}
		      	cy.on('tap', 'node', function(evt){
  					var node = evt.cyTarget;
  					window.location.href = node.data().link;
				});
				cy.on('layoutstop', function(evt){
					$('#cy_recenter').removeAttr('disabled'); 
				});
				cy.on('tap', function (evt) {
					this.zoomingEnabled(true);
				});
				cy.on('mouseout', function(evt) {
					this.zoomingEnabled(false);
				});
		    }, 
		  };
	
		$('#' + div_id).cytoscape(options);
	});
	var cytoscape_div = document.getElementById(div_id);
	var recenter_button = document.createElement('a');
	recenter_button.id = "cy_recenter";
	recenter_button.className = "small button secondary";
	recenter_button.innerHTML = "Reset";
	recenter_button.onclick = function() {
		var old_zoom_value = cy.zoomingEnabled();
		cy.zoomingEnabled(true);
		cy.reset();
		cy.layout().run();
		cy.zoomingEnabled(old_zoom_value);
	};
	cytoscape_div.parentNode.insertBefore(recenter_button, cytoscape_div);
	recenter_button.setAttribute('disabled', 'disabled'); 
}

//http://datatables.net/forums/discussion/2123/filter-post-processing-and-highlighting/p1
function setup_datatable_highlight() {
	// HIGHLIGHT FCT
jQuery.fn.dataTableExt.oApi.fnSearchHighlighting = function(oSettings) {
    // Initialize regex cache
    oSettings.oPreviousSearch.oSearchCaches = {};
       
    oSettings.oApi._fnCallbackReg( oSettings, 'aoRowCallback', function( nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        // Initialize search string array
        var searchStrings = [];
        var oApi = this.oApi;
        var cache = oSettings.oPreviousSearch.oSearchCaches;
        // Global search string
        // If there is a global search string, add it to the search string array
        if (oSettings.oPreviousSearch.sSearch) {
            searchStrings.push(oSettings.oPreviousSearch.sSearch);
        }
        // Individual column search option object
        // If there are individual column search strings, add them to the search string array
        if ((oSettings.aoPreSearchCols) && (oSettings.aoPreSearchCols.length > 0)) {
            for (var i in oSettings.aoPreSearchCols) {
                if (oSettings.aoPreSearchCols[i].sSearch) {
                searchStrings.push(oSettings.aoPreSearchCols[i].sSearch);
                }
            }
        }
        // Create the regex built from one or more search string and cache as necessary
        if (searchStrings.length > 0) {
            var sSregex = searchStrings.join("|");
            if (!cache[sSregex]) {
                var regRules = "("
                ,   regRulesSplit = sSregex.split(' ');
                 
                regRules += "("+ sSregex +")";
                for(var i=0; i<regRulesSplit.length; i++) {
                  regRules += "|("+ regRulesSplit[i] +")";
                }
                regRules += ")";
             
                // This regex will avoid in HTML matches
                cache[sSregex] = new RegExp(regRules+"(?!([^<]+)?>)", 'ig');
            }
            var regex = cache[sSregex];
        }
        // Loop through the rows/fields for matches
        jQuery('td', nRow).each( function(i) {
            // Take into account that ColVis may be in use
            var j = oApi._fnVisibleToColumnIndex( oSettings,i);
            // Only try to highlight if the cell is not empty or null
            if (aData[j]) {         
                // If there is a search string try to match
                if ((typeof sSregex !== 'undefined') && (sSregex)) {
                    this.innerHTML = aData[j].replace( regex, function(matched) {
                        return "<span class='filterMatches'>"+matched+"</span>";
                    });
                }
                // Otherwise reset to a clean string
                else {
                    this.innerHTML = aData[j];
                }
            }
        });
        return nRow;
    }, 'row-highlight');
    return this;
};
}

function set_up_scientific_notation_sorting() {
	/* new sorting functions */
	jQuery.fn.dataTableExt.oSort['scinote-asc']  = function(a,b) {
          var x = parseFloat(a);
          var y = parseFloat(b);
          return ((x < y) ? -1 : ((x > y) ?  1 : 0));
        };
 
	jQuery.fn.dataTableExt.oSort['scinote-desc']  = function(a,b) {
          var x = parseFloat(a);
          var y = parseFloat(b);
          return ((x < y) ? 1 : ((x > y) ?  -1 : 0));
        };
 
	/* pick the column to give the datatype 'allnumeric' too */
	$('#example').dataTable({
          "aoColumnDefs": [{ "sType": "scinote", "aTargets": [ 3 ] } ]
	} );
}

function go_enrichment(go_enrichment_link, table, format_name_to_id, index, header_id, gene_header_id, table_id, enrich_recalc_button_id,
	download_button_id, download_link, enrichment_table_filename) {

	function f() {
		document.getElementById(enrich_recalc_button_id).setAttribute('disabled', 'disabled');
		set_table_message(table_id, '<center><img src="/static/img/dark-slow-wheel.gif"></center>')	
		
		var bioent_ids = [];
		var already_used = {};
		//Get bioent_ids	
		var data = table._('tr', {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) { 
			var sys_name = data[i][index];
			if(!already_used[sys_name]) {
				bioent_ids.push(format_name_to_id[sys_name])
				already_used[sys_name] = true;
			}
			
		}	
		
		document.getElementById(gene_header_id).innerHTML = bioent_ids.length;
		document.getElementById(header_id).innerHTML = '_';
		post_json_to_url(go_enrichment_link, {'bioent_ids': bioent_ids}, 
		function(data) {  		
  			set_up_enrichment_table(header_id, table_id, download_button_id, download_link, enrichment_table_filename, data)
  			$('#' + enrich_recalc_button_id).removeAttr('disabled');
  			update_filter_used();
  		},
  		function() {
    		$('#' + enrich_recalc_button_id).removeAttr('disabled');
  		}
  		);
  	}
  	
  	document.getElementById(enrich_recalc_button_id).onclick = f;
  	return f;
}

function set_table_message(table_id, message) {
	var options = {};
	options["bPaginate"] = true;
	options["bDestroy"] = true;
	options['oLanguage'] = {'sEmptyTable': message}
	options["aaData"] = [];
  				
  	var enrichment_table = $('#' + table_id).dataTable(options);
}

function set_up_enrichment_table(header_id, table_id, download_button_id, download_link, download_table_filename, data) { 
	var datatable = [];
	for (var i=0; i < data.length; i++) {
		var evidence = data[i];	
		var go = '';
		if(evidence['go'] != null) {
			go = create_link(evidence['go']['display_name'], evidence['go']['link']);
		}
  		datatable.push([go, evidence['match_count'].toString(), evidence['pvalue']])
  	}
  	
  	document.getElementById(header_id).innerHTML = data.length;
  	
  	var element = document.getElementById("temp_spinner");
  	if(element != null) {
  		element.parentNode.removeChild(element);
  	}
	
	set_up_scientific_notation_sorting();
	
  	if (data == null) {
  		set_table_message(table_id, 'Error calculating shared GO processes.');
  		document.getElementById(download_button_id).setAttribute('disabled', 'disabled'); 
  	}
  	else if (data.length == 0) {
  		set_table_message(table_id, 'No significant shared GO processes found.');
  		document.getElementById(download_button_id).setAttribute('disabled', 'disabled'); 
  	}
  	else {
    	var options = {};
		options["bPaginate"] = true;
		options["aaSorting"] = [[2, "asc"]];
		options["aoColumns"] = [null, {'sWidth': '100px'}, { "sType": "scinote", 'sWidth': '100px'}]
		options["bDestroy"] = true;
		options["aaData"] = datatable;
  		
  		setup_datatable_highlight();
  		var enrichment_table = $('#' + table_id).dataTable(options);
  		setup_datatable_highlight();
  		enrichment_table.fnSearchHighlighting();
  		
  		document.getElementById(download_button_id).onclick = function() {download_table(enrichment_table, download_link, download_table_filename)};
    	$('#' + download_button_id).removeAttr('disabled');
    }
}

function set_up_show_child_button(child_button_id, phenotype_header_id, header_id, details_link, details_all_link, table_id, set_up_table_f, new_filter_f) {
	var child_button = document.getElementById(child_button_id);
	var has_all_data = false;
	  
	child_button.onclick = function() {
	  	child_button.setAttribute('disabled', 'disabled'); 
					
		var new_message = null;
		if(child_button.innerHTML == 'Hide Genes Associated With Child Terms') {
			new_message = 'Add Genes Associated With Child Terms';
			$.fn.dataTableExt.afnFiltering.push(new_filter_f);
		}
		else {
			new_message = 'Hide Genes Associated With Child Terms';
			$.fn.dataTableExt.afnFiltering.splice(0, 1);
		}
		if(!has_all_data) {	
			set_table_message(table_id, '<center><img src="/static/img/dark-slow-wheel.gif"></center>');
	  		document.getElementById(phenotype_header_id).innerHTML = '_';
			document.getElementById(header_id).innerHTML = '_';
			post_json_to_url(details_all_link, {}, 
				function(data) {  
					set_up_table_f(data);		
  					child_button.innerHTML = new_message;
  					$('#' + child_button_id).removeAttr('disabled');
  				},
  				function() {
    				$('#' + child_button_id).removeAttr('disabled');
  				}
  			);
  			has_all_data = true;
  		}
  		else {
  			child_button.innerHTML = new_message;
  			$('#' + child_button_id).removeAttr('disabled');
  			ev_table.fnDraw();
  		}
	  				
	};
	$('#' + child_button_id).removeAttr('disabled');
}