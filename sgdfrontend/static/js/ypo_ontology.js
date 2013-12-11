function set_up_full_ontology(ontology_list_id, data) { 
	var list = document.getElementById(ontology_list_id);
	for (var i=0; i < data['elements'].length; i++) {
		var li = document.createElement('li');
		li.innerHTML = '<a href=' + data['elements'][i]['link'] + '>' + data['elements'][i]['display_name'] + '</a>'
		li.id = data['elements'][i]['id'];
		list.appendChild(li);
	}
	for (var key in data['child_to_parent']) {
		var child_id = key;
		var parent_id = data['child_to_parent'][child_id];
		
		var parent = document.getElementById(parent_id);
		var ul = null;
		if(parent.childNodes.length == 1) {
			ul = document.createElement('ul');
			parent.appendChild(ul);
		}
		else {
			ul = parent.childNodes[1];
		}
		var child = document.getElementById(child_id);
		list.removeChild(child);
		ul.appendChild(child);
		
	}
}
