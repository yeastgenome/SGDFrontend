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

function analyze(list_name, bioents) {
	var path = "/analyze";
	var form = add_params_to_form({"display_name":list_name, "locus": bioents})
	form.setAttribute("method", 'get');
    form.setAttribute("action", path);
	form.submit();
}

function name_from_link(name_with_link) {
	name_with_link = name_with_link.substring(0, name_with_link.lastIndexOf('"'))
	var name = name_with_link.substring(name_with_link.lastIndexOf('/')+1, name_with_link.length);
	return name;
}

function add_analyze_tabletool(list_name, table_index, name_with_link_index) {
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
			analyze(list_name, bioents);
		}
	} );
}

function table_tool_option(save_name, use_analyze, list_name, table_index, name_with_link_index) {
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
		add_analyze_tabletool(list_name, table_index, name_with_link_index);
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
		var citation = references[i];
		var p=document.createElement('p');
		p.innerHTML = citation;
		ref_list.appendChild(p);
	}
}




function setup_interaction_cytoscape_vis(graph_link) {
	// id of Cytoscape Web container div
		var div_id = "cytoscapeweb";
                                
		// visual style we will use
		var visual_style = {
			nodes: {
				color: {
					discreteMapper: {
						attrName: "sub_type",
						entries: [
							{attrValue: 'FOCUS', value: "#fade71" }]
					}
				},
				labelHorizontalAnchor: "center"
			},
		};
                
		// initialization options
		var options = {
		swfPath: "../static/js/CytoscapeWeb",
		flashInstallerPath: "/swf/playerProductInstall"
	};
                
	// init and draw
	var vis = new org.cytoscapeweb.Visualization(div_id, options);
		
	var cutoff = 3;
	// callback when Cytoscape Web has finished drawing
    vis.ready(function() {
                
		// add a listener for when nodes and edges are clicked
		vis.addListener("click", "nodes", function(event) {
			handle_click(event);
		})
		.addListener("click", "edges", function(event) {
			handle_click(event);
		});
                    
		function handle_click(event) {
			var target = event.target;   
			var link = target.data['link']
			window.location.href = link          
		}
		handle_slide(vis, cutoff);
	});
	//Grab the network data via AJAX
	$.getJSON(graph_link, function(data) {
		if(data['max_evidence_cutoff'] == 0) {
			document.getElementById(div_id).parentNode.style.display = 'none';
		}
		else {
			cutoff = Math.min(3, data['max_evidence_cutoff']);
			vis.draw({ network: data, visualStyle: visual_style});
			setup_slider(vis, data['min_evidence_cutoff'], data['max_evidence_cutoff']);
		}
	});     
	return vis;     
}

function handle_slide(vis, value) {
	vis.filter(function(item) {
		return item.data.evidence >= value;
	});
	vis.layout('ForceDirected');
}

function setup_slider(vis, min_evidence_cutoff, max_evidence_cutoff) {
	$('#slider-range-min').slider({
		range: "max",
		value: Math.min(3, max_evidence_cutoff),
		min: min_evidence_cutoff,
		max: Math.min(10, max_evidence_cutoff),
		step: 1,
		slide: function( event, ui ) {
				handle_slide(vis, ui.value);
			},
		change: function( event, ui ) {
				handle_slide(vis, ui.value);
			}
	});
	
			
	var $slider =  $('#slider-range-min');	
	var max =  $slider.slider("option", "max") - $slider.slider("option", "min") + 1;    
 	var spacing =  100 / (max -1);
    $slider.find('.ui-slider-tick-mark').remove();
    for (var i = 0; i < max ; i=i+1) {
    	var value = (i+min_evidence_cutoff);
    	if(value >= 10) {
    		var left = ((spacing * i)-1)
        	$('<span class="ui-slider-tick-mark muted">10+</span>').css('left', left + '%').appendTo($slider);
    	}
    	else {
    		var left = ((spacing * i)-.5)
			$('<span class="ui-slider-tick-mark muted">' +value+ '</span>').css('left', left + '%').appendTo($slider);
    	}
	}
}

function setup_go_cytoscape_vis(graph_link) {
		// id of Cytoscape Web container div
		var div_id = "cytoscapeweb";
		
		// initialization options
		var options = {
			swfPath: "../static/js/CytoscapeWeb",
			flashInstallerPath: "/swf/playerProductInstall"
		};
                
		// init and draw
		var vis = new org.cytoscapeweb.Visualization(div_id, options);
		
		vis["customColor"] = function (data) {
			if(data['highlight']) {
				return "#fade71";
			}
			if(data['bio_type'] == 'LOCUS') {
				return '#5CB3FF';
			}
			else if(data['bio_type'] == 'PHENOTYPE') {
				return '#81F781';
			}
			if(data['sub_type'] != null) {
				if(data['sub_type'] == 'cellular component') {
					return '#E2A9F3';
				}
				else if(data['sub_type'] == 'molecular function') {
					return '#81F781';
				}
				else if(data['sub_type'] == 'biological process') {
					return '#F7819F';
				}
			}

			return 'white'
   		};
                                
		// visual style we will use
		var visual_style = {
			nodes: {
				shape: {
					discreteMapper: {
						attrName: "bio_type",
						entries: [
							{attrValue: 'LOCUS', value: 'ELLIPSE',
							attrValue: 'GO', value: 'RECTANGLE',
							attrValue: 'PHENOTYPE', value: 'RECTANGLE',
							attrValue: 'REFERENCE', value: 'DIAMOND'}
						]
					}
				},
				size: { 
					defaultValue: 12, 
                    continuousMapper: { attrName: "weight", 
                                        minValue: 12, 
                                        maxValue: 100 } 
                },
                color: {
					customMapper: {functionName: "customColor"}
				},
				labelHorizontalAnchor: "center"
			},
		};
		
		// callback when Cytoscape Web has finished drawing
    	vis.ready(function() {
			// add a listener for when nodes and edges are clicked
			vis.addListener("click", "nodes", function(event) {
				handle_click(event);
			})
			.addListener("click", "edges", function(event) {
				handle_click(event);
			});
                    
			function handle_click(event) {
				var target = event.target;   
				var link = target.data['link']
				window.location.href = link          
			}
        	//setup checkboxes
        	var $checkboxes = $('input:checkbox[name=categories]');
			$checkboxes.click(function() {
				handle_check();	
			});
				
			function handle_check() {
				var f_checked = $('#f_check').is(':checked');
				var p_checked = $('#p_check').is(':checked');
				var c_checked = $('#c_check').is(':checked');

    			vis.filter('nodes', function(item) {
					return item.data.highlight || item.data.bio_type != 'GO' || 
					(f_checked && item.data.sub_type == 'molecular function') ||
					(p_checked && item.data.sub_type == 'biological process') ||
					(c_checked && item.data.sub_type == 'cellular component');
				});
				vis.layout('ForceDirected');
			}
			handle_check();
		});
		
		//Grab the network data via AJAX
		$.getJSON(graph_link, function(data) {
			vis.draw({ network: data, visualStyle: visual_style});
			if(data['disable_cellular']) {
				$('#c_check').attr('disabled', true);
			}
		});    
	return vis;      
}

function setup_ontology_cytoscape_vis(graph_link) {
		// id of Cytoscape Web container div
		var div_id = "cytoscapeweb";
                                
		// visual style we will use
		var visual_style = {
			nodes: {
				borderWidth: 0,
				//{
				//	discreteMapper: {
				//		attrName: "sub_type",
				//		entries: [
				//			{attrValue: 'NO_GENES', value: 0 },
				//		]
				//	}
				//},
				color: {
					discreteMapper: {
						attrName: "sub_type",
						entries: [
							{attrValue: 'FOCUS', value: "#fade71" },
							{attrValue: 'CELLULAR COMPONENT', value: '#E2A9F3'},
							{attrValue: 'MOLECULAR FUNCTION', value: '#81F781'},
							{attrValue: 'BIOLOGICAL PROCESS', value: '#5CB3FF'},
							{attrValue: 'NORMAL', value: '#5CB3FF'},
							{attrValue: 'NO_GENES', value: 'white'},
						]
					}
				},
				shape: {
					discreteMapper: {
						attrName: "bio_type",
						entries: [
							{attrValue: 'GENE', value: 'ELLIPSE',
							attrValue: 'GO', value: 'RECTANGLE',
							attrValue: 'PHENOTYPE', value:'RECTANGLE'}
						]
					}
				},
				size: { defaultValue: 12, 
                    continuousMapper: { attrName: "direct_gene_count", 
                                        minValue: 12, 
                                        maxValue: 100 } },
				labelHorizontalAnchor: "center"
			},
			edges: {
				width: 2,
			}
		};
                
		// initialization options
		var options = {
			swfPath: "../static/js/CytoscapeWeb",
			flashInstallerPath: "/swf/playerProductInstall"
		};
                
		// init and draw
		var vis = new org.cytoscapeweb.Visualization(div_id, options);
		
		// callback when Cytoscape Web has finished drawing
    	vis.ready(function() {
			// add a listener for when nodes are clicked
			vis.addListener("click", "nodes", function(event) {
				handle_click(event);
			});
                    
			function handle_click(event) {
				var target = event.target;   
				var link = target.data['link']
				window.location.href = link          
			}
			
			//setup checkboxes
        	var $checkboxes = $('input:checkbox[name=categories]');
			$checkboxes.click(function() {
				handle_check();	
			});
				
			function handle_check() {
				var ancestors = $('#ancestor_check').is(':checked');
				var children = $('#child_check').is(':checked');
				var no_genes = true;//$('#no_genes').is(':checked');

    			vis.filter('nodes', function(item) {
					return item.data.sub_type == 'FOCUS' || ((ancestors && !item.data.child) ||
					(children && item.data.child)) && (no_genes || item.data.direct_gene_count > 0);
				});
				//if(ancestors && !children) {
					var layout = {
    					name:    "Tree",
    					options: { orientation: "topToBottom", depthSpace: 50, breadthSpace: 50, subtreeSpace: 50 }
					};
					vis.layout(layout)
				//}
				//else {
				//	vis.layout('ForceDirected');
				//}
				
			}
			handle_check();
			
			//setup radio buttons
        	var $radios = $('input:radio[name=layout]');
			$radios.click(function() {
				handle_layout_change();	
			});
				
			function handle_layout_change() {
				var tree = $('#tree_layout').is(':checked');
				var fd = $('#fd_layout').is(':checked');
    			if(tree) {
					var layout = {
    					name:    "Tree",
    					options: { orientation: "topToBottom", depthSpace: 50, breadthSpace: 20, subtreeSpace: 50 }
					};
					vis.layout(layout);
				}
				else {
					vis.layout('ForceDirected');
				}
			}
			
			
		});
		
		
		
		//Grab the network data via AJAX
		$.getJSON(graph_link, function(data) {
			$('#tree_layout').prop('checked',true)
			vis.draw({ network: data, visualStyle: visual_style});
			if(!data['has_children']) {
				$('#child_check').prop('checked',false)
				$('#child_check').attr('disabled', true);
			}
		}); 
	return vis;         
}

function setup_phenotype_cytoscape_vis(graph_link) {
		// id of Cytoscape Web container div
		var div_id = "cytoscapeweb";
                                
		// visual style we will use
		var visual_style = {
			nodes: {
				color: {
					discreteMapper: {
						attrName: "sub_type",
						entries: [
							{attrValue: 'FOCUS', value: "#fade71" },
							{attrValue: 'CELLULAR COMPONENT', value: '#E2A9F3'},
							{attrValue: 'MOLECULAR FUNCTION', value: '#81F781'},
							{attrValue: 'BIOLOGICAL PROCESS', value: '#5CB3FF'},
							{attrValue: 'BIOCONCEPT', value: '#5CB3FF'}
						]
					}
				},
				shape: {
					discreteMapper: {
						attrName: "bio_type",
						entries: [
							{attrValue: 'GENE', value: 'ELLIPSE',
							attrValue: 'GO', value: 'RECTANGLE'}
						]
					}
				},
				labelHorizontalAnchor: "center"
			},
		};
                
		// initialization options
		var options = {
			swfPath: "../static/js/CytoscapeWeb",
			flashInstallerPath: "/swf/playerProductInstall"
		};
                
		// init and draw
		var vis = new org.cytoscapeweb.Visualization(div_id, options);
		
		// callback when Cytoscape Web has finished drawing
    	vis.ready(function() {
			// add a listener for when nodes and edges are clicked
			vis.addListener("click", "nodes", function(event) {
				handle_click(event);
			})
			.addListener("click", "edges", function(event) {
				handle_click(event);
			});
                    
			function handle_click(event) {
				var target = event.target;   
				var link = target.data['link']
				window.location.href = link          
			}
		});
		
		//Grab the network data via AJAX
		$.getJSON(graph_link, function(data) {
			vis.draw({ network: data, visualStyle: visual_style});
		});     
	return vis;     
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



