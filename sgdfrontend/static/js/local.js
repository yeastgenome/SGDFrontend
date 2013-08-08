//http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
function add_params_to_form(params) {

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");

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
    return form;
}

function add_tabletools() {
	TableTools.DEFAULTS.sSwfPath = "../static/js/copy_csv_xls_pdf.swf";
}

function analyze(analyze_link, list_name, bioents) {
	var path = analyze_link;
	var form = add_params_to_form({"display_name":list_name, "locus": bioents})
	form.setAttribute("method", 'get');
    form.setAttribute("action", path);
	form.submit();
}

function download_citations(citation_div, download_link, list_name) {
	var reference_ids = [];
	var entries = document.getElementById(citation_div).children;
	for(var i=0,len=entries.length; i<len; i++) {
		reference_ids.push(entries[i].id)
	}
	
	var path = download_link;
	var form = add_params_to_form({"display_name":list_name, "reference_ids": reference_ids})
	form.setAttribute("method", 'get');
    form.setAttribute("action", path);
	form.submit();
}

function name_from_link(name_with_link) {
	name_with_link = name_with_link.substring(0, name_with_link.lastIndexOf('"'))
	var name = name_with_link.substring(name_with_link.lastIndexOf('/')+1, name_with_link.length);
	return name;
}

function add_analyze_tabletool(analyze_link, list_name, table_index, name_with_link_index) {
	add_tabletools();
	
	TableTools.BUTTONS.analyze = $.extend( true, TableTools.buttonBase, {
		"sNewLine": "<br>",
		"sButtonText": "<i class='icon-briefcase'></i> Analyze",
		"fnClick": function( nButton, oConfig ) {
			var table = $.fn.dataTable.fnTables(true)[table_index];
			var data = $(table).dataTable()._('tr', {"filter": "applied"});
			var bioents = [];
			for (var i=0,len=data.length; i<len; i++) { 
				var name_with_link = data[i][name_with_link_index];
				var name = name_from_link(name_with_link);
				bioents.push(name);
			}	

			var search_term = $(table).dataTable().fnSettings().oPreviousSearch.sSearch
			if(search_term != '') {
				list_name = list_name + ' filtered by "' + search_term + '"'
			}			
			analyze(analyze_link, list_name, bioents);
		}
	} );
}

function table_tool_option(save_name, use_analyze, analyze_link, list_name, table_index, name_with_link_index) {
	var buttons = [
			"copy",
			"print",
			{
				"sExtends": "csv",
				"sTitle": save_name + '.csv'
			},
			{
				"sExtends": "xls",
				"sTitle": save_name + '.xls'
			}
		];
	if(use_analyze) {
		add_analyze_tabletool(analyze_link, list_name, table_index, name_with_link_index);
		buttons.push('analyze');
	}
	else {
		add_tabletools();
	}
	return {"aButtons": buttons}
}

function set_up_count(num_rows, header_id) {
	document.getElementById(header_id).innerHTML = '(' + num_rows + ')';
}

function set_up_count_no_message(header_id) {
	return function() {
		this.fnAdjustColumnSizing(true);
		var num_rows = this.fnSettings().fnRecordsTotal();
		set_up_count(num_rows, header_id);
	}
}

function set_up_message_and_count(header_id, message_id, wrapper_id) {
	return function() {
		this.fnAdjustColumnSizing(true);
		var num_rows = this.fnSettings().fnRecordsTotal();
		set_up_count(num_rows, header_id);
		if(num_rows == 0) {
    		document.getElementById(message_id).style.display = 'block';
			document.getElementById(wrapper_id).style.display = 'none';
		}
	}
}

function create_nCloneTd() {
   	var nCloneTd = document.createElement( 'td' );
    nCloneTd.className = "center";
    var b = document.createElement('button');
    b.className = 'btn btn-link';
    b.innerHTML = '<i class="icon-plus-sign"></i>';
    nCloneTd.appendChild(b);
    return nCloneTd;
}

function add_detail_column(table_id) {
	var nCloneTd = create_nCloneTd();
	$('#' + table_id + ' tbody tr').each( function () {
		this.insertBefore(  nCloneTd.cloneNode( true ), this.childNodes[0] );
	});
}

function set_up_details(get_details) {
	var nCloneTd = create_nCloneTd();
	return function(oSettings) {
		var table = this;
  		this.$('tr').each( function () {
  			var details = get_details(table.fnGetData(this));
  			if(details != null) {
    			this.removeChild(this.childNodes[0]);
    			this.insertBefore(nCloneTd.cloneNode( true ), this.childNodes[0]);
   			}
   		});
   		this.$('button').click( function () {
  			var nTr = $(this).parents('tr')[0];

        	if ( table.fnIsOpen(nTr) ) {
           	 	// This row is already open - close it
           	 	this.innerHTML = '<i class="icon-plus-sign"></i>';
            	table.fnClose( nTr );
        	}
        	else {
            	// Open this row
            	this.innerHTML = '<i class="icon-minus-sign"></i>';
  				var details = get_details(table.fnGetData(nTr));
            	table.fnOpen( nTr, details, 'details' );
        	}
   		});
   }
}

function set_up_references(references, ref_list_id) {
  	//Set up references
	ref_list = document.getElementById(ref_list_id);
	for (var i=0; i < references.length; i++) {
		var citation = references[i][1];
		var p=document.createElement('p');
		p.id = references[i][0]
		p.innerHTML = citation;
		ref_list.appendChild(p);
	}
}



function setup_cytoscape_vis(div_id, style, data) {
	$(loadCy = function(){
		options = {
			showOverlay: false,
			layout: {"name": "arbor", "liveUpdate": true, "nodeMass":function(data) {
				if(data.sub_type == 'FOCUS') {
					return 10;
				}
				else {
					return 1;
				}
			}},
		    minZoom: 0.5,
		    maxZoom: 2,
		    style: style,
		
		    elements: {
		     	nodes: data['nodes'],
		     	edges: data['edges'],
		    },
		
		    ready: function(){
		      	cy = this;
		    }
		  };
	
		$('#' + div_id).cytoscape(options);
	});
}

function setup_slider(div_id, min, max, current, slide_f) {
	var slider = $("#" + div_id).noUiSlider({
		range: [min, max]
		,start: current
		,step: 1
		,handles: 1
		,connect: "lower"
		,slide: slide_f
	});
	
	var spacing =  100 / (max - min);
    for (var i = min-1; i < max ; i=i+1) {
    	var value = i+1;
    	if(value >= 10) {
    		var left = ((spacing * (i-min+1))-1)
        	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
    	}
    	else {
    		var left = ((spacing * (i-min+1))-.5)
			$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').css('display', 'inline-block').css('position', 'absolute').css('top', '15px').appendTo(slider);
    	}
	}
	return slider;
}



function highlightSearchTerms(searchText, highlightableArea, treatAsPhrase, warnOnFailure, highlightStartTag, highlightEndTag) {
  // if the treatAsPhrase parameter is true, then we should search for 
  // the entire phrase that was entered; otherwise, we will split the
  // search string so that each word is searched for and highlighted
  // individually
  if (treatAsPhrase) {
    searchArray = [searchText];
  } else {
    searchArray = searchText.split(" ");
  }
  
  if (highlightableArea == null) {
  	if (!document.body || typeof(document.body.innerHTML) == "undefined") {
    	if (warnOnFailure) {
      		alert("Sorry, for some reason the text of this page is unavailable. Searching will not work.");
   	 	}
    	return false;
  	}
  	highlightableArea=document.body;
  }
  
  var bodyText = highlightableArea.innerHTML;
  for (var i = 0; i < searchArray.length; i++) {
    bodyText = simpleHighlight(bodyText, searchArray[i], highlightStartTag, highlightEndTag);
  }
  
  highlightableArea.innerHTML = bodyText;

  return true;
}
function simpleHighlight(bodyText, searchTerm, highlightStartTag, highlightEndTag) {
	  // the highlightStartTag and highlightEndTag parameters are optional
  if ((!highlightStartTag) || (!highlightEndTag)) {
    highlightStartTag = "<font style='color:blue; background-color:yellow;'>";
    highlightEndTag = "</font>";
  }
  
	re = new RegExp(searchTerm, "gi");

	func = function(match) {
        return [highlightStartTag, match, highlightEndTag].join("");
    };

	bodyText = bodyText.replace(re, func);

	return bodyText;
}



