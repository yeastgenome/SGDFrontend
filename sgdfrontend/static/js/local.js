

function basic_datatable_options(header_id, save_name, wrapper_id, message_id) {
	TableTools.DEFAULTS.sSwfPath = "../static/js/copy_csv_xls_pdf.swf";
	var options = {
		"bPaginate":false,
		"sPaginationType": "bootstrap",
		"fnInitComplete": function() {
			this.fnAdjustColumnSizing(true);
			var num_rows = this.fnSettings().fnRecordsTotal();
			document.getElementById(header_id).innerHTML = '(' + num_rows + ')';
			if(num_rows == 0) {
    			 document.getElementById(message_id).style.display = 'block';
    			 document.getElementById(wrapper_id).style.display = 'none';
			}
		},	
		"sDom": '<"clear">lfrtipT',
        "oTableTools": {
        	"aButtons": [
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
			],
		}
	};
	return options;
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
							attrValue: 'GO', value: 'RECTANGLE'}
						]
					}
				},
				size: { defaultValue: 12, 
                    continuousMapper: { attrName: "direct_gene_count", 
                                        minValue: 12, 
                                        maxValue: 100 } },
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
					return item.data.sub_type == 'FOCUS' || (f_checked && item.data.f_include) ||
					(p_checked && item.data.p_include) ||
					(c_checked && item.data.c_include);
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



