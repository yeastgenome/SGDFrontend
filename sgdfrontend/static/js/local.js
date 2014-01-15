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

function download_image(stage, width, height, download_link, image_name) {
	stage.toDataURL({
		width: width,
		height: height,
		callback: function(dataUrl) {
			post_to_url(download_link, {"display_name":image_name, 'data': dataUrl});
		}
	});
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

function set_up_range_sort() {
	jQuery.fn.dataTableExt.oSort['range-desc'] = function(x,y) {
		x = x.split("-");
		y = y.split("-");

		x0 = parseInt(x[0]);
		y0 = parseInt(y[0]);

		return (x0 > y0) ? -1 : ((x0 < y0) ? 1 : 0);

	};

	jQuery.fn.dataTableExt.oSort['range-asc'] = function(x,y) {

		x = x.split("-");
		y = y.split("-");

		x0 = parseInt(x[0]);
		y0 = parseInt(y[0]);

		return (x0 < y0) ? -1 : ((x0 > y0) ? 1 : 0);

	};
}

function set_up_show_child_button(child_button_id, phenotype_header_id, header_id, details_link, details_all_link, table_id, set_up_table_f, new_filter_f) {
	var child_button = $("#" + child_button_id);
	var has_all_data = false;
	  
	child_button.click(function() {
	  	child_button.attr('disabled', true);
					
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
	  		$("#" + phenotype_header_id).html('_');
			$("#" + header_id).html('_');
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
	});
	child_button.attr('disabled', false);
}

function create_table(table_id, options) {
    setup_datatable_highlight();
  	table = $('#' + table_id).dataTable(options);
  	setup_datatable_highlight();
  	table.fnSearchHighlighting();
  	return table;
}

function create_analyze_button(analyze_button_id, table, analyze_link, name, apply_filter) {
    //When button is clicked, collect bioent_ids and send them to Analyze page.

    var analyze_button = $("#" + analyze_button_id);
    var analyze_function = function() {
        var bioent_ids = [];
        var filename = name;
        var data;
        if(apply_filter) {
            data = table._('tr', {"filter": "applied"});

            //Set filename to include search term.
            var search_term = table.fnSettings().oPreviousSearch.sSearch
            if(search_term != '') {
                filename = filename + ' filtered by -' + search_term + '-'
            }
        }
        else {
            data = table._('tr', {});
        }

        for (var i=0,len=data.length; i<len; i++) {
            bioent_ids.push(data[i][1]);
        }

        post_to_url(analyze_link, {'list_name': filename, 'bioent_ids': JSON.stringify(bioent_ids)});
    };
    analyze_button.click(analyze_function);

    //When the associated table is filtered so that no genes are being displayed, disable button.
    if(apply_filter) {
        table.bind('filter', function() {
  	        var data = table._('tr', {"filter": "applied"});
  	        if(data.length == 0) {
  	            analyze_button.attr('disabled', true);
  	            analyze_button.click(null);
  	        }
  	        else {
  	            analyze_button.attr('disabled', false);
  	            analyze_button.click(analyze_function);
  	        }
  	    });
    }

    analyze_button.attr('disabled', false);
}

function create_download_button(download_button_id, table, download_link, name) {

    var download_button = $("#" + download_button_id);
    var download_function = function() {
        var data = table._('tr', {"filter": "applied"});
        var filename = name;

        var table_headers = table.fnSettings().aoColumns;
        var headers = [];
        for(var i=0,len=table_headers.length; i<len; i++) {
            headers.push(table_headers[i].nTh.innerHTML);
        }

        var search_term = table.fnSettings().oPreviousSearch.sSearch
        if(search_term != '') {
            filename = filename + '_filtered_by_-' + search_term + '-'
        }

        post_to_url(download_link, {"display_name":filename, 'headers': JSON.stringify(headers), 'data': JSON.stringify(data)});
    };
    download_button.click(download_function);

    //When the associated table is filtered so that no genes are being displayed, disable button.
    table.bind('filter', function() {
  	    var data = table._('tr', {"filter": "applied"});
  	    if(data.length == 0) {
  	        download_button.attr('disabled', true);
  	        download_button.click(null);
  	    }
  	    else {
  	        download_button.attr('disabled', false);
  	        download_button.click(download_function);
  	    }
  	});

    download_button.attr('disabled', false);
}

function set_up_enrichment_table(data) {
    var options = {"bPaginate": true, "bDestroy": true, "oLanguage": {'sEmptyTable': 'Error calculating shared GO processes.'}, "aaData": []};

    if(data != null) {
	    var datatable = [];
	    for (var i=0; i < data.length; i++) {
		    var evidence = data[i];
		    var go = '';
		    if(evidence['go'] != null) {
			    go = create_link(evidence['go']['display_name'], evidence['go']['link']);
		    }
  		    datatable.push([evidence['go']['id'], go, evidence['match_count'].toString(), evidence['pvalue']])
    	}

  	    $("#enrichment_header").html(data.length);

	    set_up_scientific_notation_sorting();

        options["aaSorting"] = [[3, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, null, {'sWidth': '100px'}, { "sType": "scinote", 'sWidth': '100px'}]
        options["aaData"] = datatable;
        options["oLanguage"] = {'sEmptyTable': 'No significant shared GO processes found.'}
    }

    return create_table("enrichment_table", options);
}

function create_enrichment_table(table_id, target_table, init_data) {
    var enrichment_recalc = $("#enrichment_table_recalculate");
    var filter_used = '';

    var get_filter_bioent_ids = function() {
        var bioent_ids = [];
		var already_used = {};
		//Get bioent_ids
		var data = target_table._('tr', {"filter": "applied"});
		for (var i=0,len=data.length; i<len; i++) {
			var bioent_id = data[i][1];
			if(!already_used[bioent_id]) {
				bioent_ids.push(bioent_id)
				already_used[bioent_id] = true;
			}
		}
		return bioent_ids;
    };

    var update_enrichment = function() {
        enrichment_recalc.attr('disabled', true);

        var options = {"bPaginate": true, "bDestroy": true, "oLanguage": {'sEmptyTable': '<center><img src="/static/img/dark-slow-wheel.gif"></center>'}, "aaData": []};
        create_table("enrichment_table", options);

        var bioent_ids = get_filter_bioent_ids();

		$("#enrichment_gene_header").html(bioent_ids.length);
		$("#enrichment_header").html('_');
		post_json_to_url(go_enrichment_link, {'bioent_ids': bioent_ids},
		    function(data) {
  			    var enrichment_table = set_up_enrichment_table(data)
  			    filter_used = target_table.fnSettings().oPreviousSearch.sSearch;
  			    enrichment_recalc.attr('disabled', false);
  			    enrichment_recalc.hide();
  		    }
  		);
  		return enrichment_table;
    };

    target_table.bind("filter", function() {
	    var search = target_table.fnSettings().oPreviousSearch.sSearch;
		if(search != filter_used) {
		    enrichment_recalc.show();
		}
		else {
		    enrichment_recalc.hide();
		}
	});

	enrichment_recalc.click(update_enrichment);

    var enrichment_table = null;
    if(init_data != null) {
        enrichment_table = set_up_enrichment_table(init_data);
		$("#enrichment_gene_header").html(get_filter_bioent_ids().length);
    }
    else {
        enrichment_table = update_enrichment();
    }

    $("#enrichment").show();
    return enrichment_table;
}