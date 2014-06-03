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

function download_sequence(sequence, download_link, list_name, contig_name) {
	post_to_url(download_link, {"display_name":list_name, "sequence": sequence, 'contig_name': contig_name});
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

function add_footer_space(section_id) {
    next_section = $("#" + section_id);
    next_section.append(document.createElement("br"));
    next_section.append(document.createElement("br"));
    next_section.append(document.createElement("br"));
    next_section.append(document.createElement("br"));
            next_section.append(document.createElement("br"));
            next_section.append(document.createElement("br"));
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

        if(reference['pubmed_id'] != null) {
		    var pmid = document.createElement('small');
		    pmid.innerHTML = 'PMID:' + reference['pubmed_id'];
		    li.appendChild(pmid);
        }
		
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

String.prototype.chunk = function(n) {
    var ret = [];
    for(var i=0, len=this.length; i < len; i += n) {
       ret.push(this.substr(i, n))
    }
    return ret
};

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
    if(link == null) {
        return display_name
    }
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
		icon = "<a href='#' data-dropdown='drop" + drop_id_num + "'><i class='fa fa-info-circle'></i></a><div id='drop" + drop_id_num + "' class='f-dropdown content medium' data-dropdown-content><p>" + text + "</p></div>"
	}
	else {
		icon = '';
	}
	return icon;
}

function hide_section(section_id) {
    $("#" + section_id).hide();
    $("#navbar_" + section_id).hide();
    $("#navbar_" + section_id).removeAttr('data-magellan-arrival')
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

function set_up_phospho_sort() {
	jQuery.fn.dataTableExt.oSort['phospho-desc'] = function(x,y) {
		x0 = parseInt(x.slice(1,x.length));
		y0 = parseInt(y.slice(1,y.length));

		return (x0 > y0) ? -1 : ((x0 < y0) ? 1 : 0);

	};

	jQuery.fn.dataTableExt.oSort['phospho-asc'] = function(x,y) {
		x0 = parseInt(x.slice(1,x.length));
		y0 = parseInt(y.slice(1,y.length));

		return (x0 < y0) ? -1 : ((x0 > y0) ? 1 : 0);

	};
}

function create_show_child_button(child_button_id, table, data, details_all_link, data_to_table, set_up_table_f) {
    var direct_data = [];
    var indirect_data = null;

    for (var i=0; i < data.length; i++) {
        direct_data.push(data_to_table(data[i], i));
    }

	var child_button = $("#" + child_button_id);

	child_button.click(function() {
	  	child_button.attr('disabled', true);


        if(child_button.html() == 'Hide Annotations to Child Terms') {
            table.fnClearTable();
            table.fnAddData(direct_data);
            set_up_table_f(direct_data);

            child_button.html('Add Annotations to Child Terms');
            child_button.removeAttr('disabled');
        }
        else {
            if(indirect_data == null) {
                var original_empty_message = table.fnSettings().oLanguage.sEmptyTable;
                table.fnSettings().oLanguage.sEmptyTable = '<center><img src="/static/img/dark-slow-wheel.gif"></center>';
                table.fnClearTable();

                post_json_to_url(details_all_link, {},
                    function(data) {
                        table.fnSettings().oLanguage.sEmptyTable = original_empty_message;
                        indirect_data = []
                        if("Error" in data) {
                            table.fnAddData(indirect_data);
                        }
                        else {
                            for (var i=0; i < data.length; i++) {
                                indirect_data.push(data_to_table(data[i], i));
                            }
                            table.fnAddData(indirect_data);
                            set_up_table_f(indirect_data);

                        }
                        child_button.html('Hide Annotations to Child Terms');
                        child_button.removeAttr('disabled');
                    }
                );
            }
            else {
                table.fnClearTable();
                table.fnAddData(indirect_data);
                set_up_table_f(indirect_data);
                child_button.html('Hide Annotations to Child Terms');
                child_button.removeAttr('disabled');
            }
        }
    });

    child_button.removeAttr('disabled');
    child_button.show();
}

function create_table(table_id, options) {
    if('oLanguage' in options) {
        options['oLanguage']['sSearch'] = '<a href="#" data-dropdown="' + table_id + '_filter_drop"><i class="fa fa-info-circle"></i></a><div id="' + table_id + '_filter_drop" class="f-dropdown content medium" data-dropdown-content><p>Type a keyword (examples: “BAS1”, “zinc”) into this box to filter for those rows within the table that contain the keyword. Type in more than one keyword to find rows containing all keywords: for instance, “BAS1 37” returns rows that contain both "BAS1" and "37".</p></div> Filter:';
    }
    else {
        options['oLanguage'] = {'sSearch': '<a href="#" data-dropdown="' + table_id + '_filter_drop"><i class="fa fa-info-circle"></i></a><div id="' + table_id + '_filter_drop" class="f-dropdown content medium" data-dropdown-content><p>Type a keyword (examples: “BAS1”, “zinc”) into this box to filter for those rows within the table that contain the keyword. Type in more than one keyword to find rows containing all keywords: for instance, “BAS1 37” returns rows that contain both "BAS1" and "37".</p></div> Filter:'};
    }
    if(options['bPaginate']) {
        options['sDom'] = '<"clearfix" p<"left" f>rtl<"right" i>>';
    }
    else {
        options['sDom'] = '<"clearfix" <"left" f><"right" i>>t';
    }

    setup_datatable_highlight();
  	table = $('#' + table_id).dataTable(options);
  	setup_datatable_highlight();
  	table.fnSearchHighlighting();
  	return table;
}

function create_analyze_button_with_list(analyze_button_id, bioent_ids, analyze_link, filename) {
    //When button is clicked, send bioent_ids to Analyze page.

    var analyze_button = $("#" + analyze_button_id);
    var analyze_function = function() {
        post_to_url(analyze_link, {'list_name': filename, 'bioent_ids': JSON.stringify(bioent_ids)});
    };
    analyze_button.click(analyze_function);

    analyze_button.attr('disabled', false);
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

        for (var i=0; i<data.length; i++) {
            if(data[i]) {
                if(typeof data[i][1] == 'string') {
                    var cur_bioent_ids = String(data[i][1]).split(",");
                    for(var j=0; j<cur_bioent_ids.length; j++) {
                        bioent_ids.push(cur_bioent_ids[j]);
                    }
                }
                else {
                    bioent_ids.push(data[i][1]);
                }
            }

        }

        post_to_url(analyze_link, {'list_name': filename, 'bioent_ids': JSON.stringify(bioent_ids)});
    };

    //When the associated table is filtered so that no genes are being displayed, disable button.
    if(apply_filter) {
        table.bind('filter', function() {
  	        var data = table._('tr', {"filter": "applied"});
  	        if(data.length == 0) {
  	            analyze_button.attr('disabled', true);
  	            analyze_button.click(function(){});
  	        }
  	        else {
  	            analyze_button.attr('disabled', false);
  	            analyze_button.click(analyze_function);
  	        }
  	    });
    }

    var data = table._('tr', {"filter": "applied"});
  	if(data.length == 0) {
  	    analyze_button.attr('disabled', true);
  	    analyze_button.click(function(){});
  	}
  	else {
  	    analyze_button.attr('disabled', false);
  	    analyze_button.click(analyze_function);
  	}
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
  	        download_button.off('click');
  	    }
  	    else {
  	        download_button.attr('disabled', false);
  	        download_button.click(download_function);
  	    }
  	});

    var data = table._('tr', {"filter": "applied"});
  	if(data.length == 0) {
  	    download_button.attr('disabled', true);
  	    download_button.off('click');
  	}
  	else {
  	    download_button.attr('disabled', false);
  	    download_button.click(download_function);
  	}
}

function create_download_button_no_table(download_button_id, headers, data, download_link, filename) {
    var download_button = $("#" + download_button_id);
    var download_function = function() {
        post_to_url(download_link, {"display_name":filename, 'headers': JSON.stringify(headers), 'data': JSON.stringify(data)});
    };
    download_button.click(download_function);
}

function set_up_enrichment_table(data, gene_count) {
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

  	    set_up_header('enrichment_table', datatable.length, 'entry', 'entries', gene_count, 'gene', 'genes');

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
    var enrichment_table = null;

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

        set_up_header('enrichment_table', '_', 'entry', 'entries', bioent_ids.length, 'gene', 'genes');
		post_json_to_url(go_enrichment_link, {'bioent_ids': bioent_ids},
		    function(data) {
  			    set_up_enrichment_table(data, bioent_ids.length)
  			    filter_used = target_table.fnSettings().oPreviousSearch.sSearch;
  			    enrichment_recalc.attr('disabled', false);
  			    enrichment_recalc.hide();
  		    }
  		);
    };

    target_table.bind("filter", function() {
	    var search = target_table.fnSettings().oPreviousSearch.sSearch;
	    var data = target_table._('tr', {"filter": "applied"});
		if(search != filter_used && data.length > 0) {
		    enrichment_recalc.show();
		}
		else {
		    enrichment_recalc.hide();
		}
	});

	enrichment_recalc.click(update_enrichment);

    if(init_data != null) {
        var gene_count = get_filter_bioent_ids().length;
        enrichment_table = set_up_enrichment_table(init_data, gene_count);
        set_up_header('enrichment_table', init_data.length, 'entry', 'entries', gene_count, 'gene', 'genes');
    }
    else {
        var options = {"bPaginate": true, "bDestroy": true, "oLanguage": {'sEmptyTable': '<center><img src="/static/img/dark-slow-wheel.gif"></center>'}, "aaData": []};
        enrichment_table = create_table("enrichment_table", options);
        update_enrichment();
    }

    $("#enrichment").show();
    return enrichment_table;
}

function set_up_header(table_id, header_count, header_singular, header_plural, subheader_count, subheader_singular, subheader_plural) {
    var header_label = header_plural;
    if(header_count == 1) {
        header_label = header_singular;
    }
    var header_text = header_count + ' <small>' + header_label + '</small>';
    if(subheader_count != null) {
        var subheader_label = subheader_plural;
        if(subheader_count == 1) {
            subheader_label = subheader_singular;
        }
        header_text = header_text + ' <small>for</small> ' + subheader_count + ' <small>' + subheader_label + '</small>';
    }
    $("#" + table_id + "_header").html(header_text);
}