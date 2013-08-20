
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

function set_up_count(num_rows, header_id) {
	document.getElementById(header_id).innerHTML = '(' + num_rows + ')';
}

function set_up_references(references, ref_list_id) {
  	//Set up references
	ref_list = document.getElementById(ref_list_id);
	for (var i=0; i < references.length; i++) {
		var reference = references[i];

		var p=document.createElement('p');
		p.id = references[i]['id']
		
		var a = document.createElement('a');
		var linkText = document.createTextNode(reference['display_name']);
		a.appendChild(linkText);
		a.href = reference['link'];
		p.appendChild(a);
		
		var span = document.createElement('span');
		var citation = reference['citation'];
		span.innerHTML = citation.substring(citation.indexOf(')')+1, citation.length) + ' ';
		p.appendChild(span);
		
		var pmid = document.createElement('small');
		pmid.innerHTML = 'PMID:' + reference['pubmed_id'];
		p.appendChild(pmid);
		
		ref_list.appendChild(p);
	}
}

function set_up_resources(data) {
	resource_list = document.getElementById("resource_list");
	for (var i=0; i < data.length; i++) {
		var a = document.createElement('a');
		var linkText = document.createTextNode(data[i]['display_name']);
		a.appendChild(linkText);
		a.href = data[i]['link'];
		a.target = '_blank';
		resource_list.appendChild(a);
		
		var r = data[i];
		var span=document.createElement('span');
		span.innerHTML = ' | ';
		resource_list.appendChild(span);
	}
}

function create_link(display_name, link) {
	return '<a href="' + link + '">' + display_name + '</a>'
}

function setup_cytoscape_vis(div_id, style, data) {
	$(loadCy = function(){
		options = {
			showOverlay: false,
			layout: {
						"name": "arbor", 
						"liveUpdate": true,
						"ungrabifyWhileSimulating": true, 
						"nodeMass":function(data) {
							if(data.sub_type == 'FOCUS') {
								return 10;
							}
							else {
								return 1;
							}
						}
					},
		    minZoom: 0.5,
		    maxZoom: 2,
		    style: style,
		
		    elements: {
		     	nodes: data['nodes'],
		     	edges: data['edges'],
		    },
		
		    ready: function(){
		      	cy = this;
		      	cy.one("layoutstop", function() {
		      		document.getElementById("save_graph_png").href = cy.png().replace("image/png", "image/octet-stream");
		   		});
		      	
		    }, 
		  };
	
		$('#' + div_id).cytoscape(options);
	});
}

function setup_cytoscape_downloads(cy, png_button_id, png_url, txt_button_id, txt_url) {
	$('#' + png_button_id).click(function() {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", png_url + '/network', true);
		xhr.overrideMimeType('text/plain; charset=x-user-defined')
		xhr.setRequestHeader("Content-Type", "image/png");
		xhr.send(cy.png());
	});
	
	$('#' + txt_button_id).click(function() {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", txt_url, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
		xhr.send('');
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




