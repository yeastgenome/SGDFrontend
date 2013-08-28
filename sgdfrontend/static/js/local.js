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
	
	post_to_url(download_link, {"display_name":list_name, "reference_ids": reference_ids});
}

function download_table(table, download_link, table_name) {
	var data = table._('tr', {"filter": "applied"});
	
	var table_headers = table.fnSettings().aoColumns;
	var headers = [];
	for(var i=0,len=table_headers.length; i<len; i++) {
		headers.push(table_headers[i].nTh.innerHTML);
	}
	post_to_url(download_link, {"display_name":table_name, 'headers': JSON.stringify(headers), 'data': JSON.stringify(data)});
}

function paginate_list(list_id, num_per_page) {
	var ref_list = document.getElementById(list_id);
	var num_children = ref_list.children.length;

	if(num_children > num_per_page) {
		for (var i=0; i < ref_list.children.length; i++) {
			if(i > num_per_page) {
				ref_list.children[i].className = "hide";
			}
		}
		
		//Create pagination buttons
		var div = document.createElement('div');
		div.className = "pagination";
		var ul = document.createElement('ul');
		
		var a_prev = document.createElement('a');
		a_prev.href = '#';
		a_prev.innerHTML = "Prev";
		var prev_arrow = document.createElement('li');
		prev_arrow.appendChild(a_prev);
		ul.appendChild(prev_arrow);
		
		
		var num_pages = Math.ceil(1.0*num_children/num_per_page);
		for (var i=0; i < num_pages; i++) {
			var a = document.createElement('a');
			a.href = '#';
			a.innerHTML = i+1;
			var li = document.createElement("li");
			li.appendChild(a);
			ul.appendChild(li)
		}
		var a_next = document.createElement('a');
		a_next.href = '#';
		a_next.innerHTML = "Next";
		var next_arrow = document.createElement('li');
		next_arrow.appendChild(a_next);
		ul.appendChild(next_arrow);
		
		div.appendChild(ul);
		ref_list.parentElement.appendChild(div);
	}
	
}


function set_up_references(references, ref_list_id) {
  	//Set up references
	var ref_list = document.getElementById(ref_list_id);
	for (var i=0; i < references.length; i++) {
		var reference = references[i];

		var li=document.createElement('li');
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
		    }, 
		  };
	
		$('#' + div_id).cytoscape(options);
	});
}
