function open_close(li) {

}

function set_up_full_ontology(ontology_list_id, data) {
	var list = document.getElementById(ontology_list_id);
	for (var i=0; i < data['elements'].length; i++) {
		var li = document.createElement('li');

        var icon_a = document.createElement('a');
        icon_a.onclick = function() {
            icon_a.innerHTML = "<i class='icon-minus'></i>";
        };
        icon_a.innerHTML = "<i class='icon-plus'></i>";

        var link_a = document.createElement('a');
        link_a.innerText = data['elements'][i]['display_name'];
        link_a.href = data['elements'][i]['link'];

        li.appendChild(icon_a);
        li.appendChild(link_a);

		li.id = data['elements'][i]['id'];
		list.appendChild(li);
	}
	for (var child_id in data['child_to_parent']) {
		var parent_id = data['child_to_parent'][child_id];
		
		var parent = document.getElementById(parent_id);
		var ul = null;
		if(parent.children.length <= 2) {
			ul = document.createElement('ul');
			parent.appendChild(ul);
		}
		else {
			ul = parent.children[2];
		}
		var child = document.getElementById(child_id);
		list.removeChild(child);

        ul.appendChild(child);
    }

}
