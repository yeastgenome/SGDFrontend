function put_json_in_table(json, table_id) {
	var table = document.getElementById(table_id);
	var tbody = document.createElement('tbody');
	
	for(var i = 0; i < json.length; i++){
		tbody.appendChild(create_row(json[i]));
	}

	table.appendChild(tbody);
}

function create_row(json) {
	var tr = document.createElement('tr');
	for(var i = 0; i < json.length; i++){
		var td = document.createElement('td');
		td.innerHTML = json[i];
		tr.appendChild(td);
	}
	return tr;
}

function hide_row(row_index, table_id) {
	var table = document.getElementById(table_id);
	table.rows[row_index].className += ' hide';
}

function show_row(row_index, table_id) {
	var table = document.getElementById(table_id);
	table.rows[row_index].className = '';
}

function hide_column(column_index, table_id) {
	var table = document.getElementById(table_id);
	
	for(var i=0; i < table.rows.length; i++) {
		table.rows[i].cells[column_index].className += 'hide';
	}
}

function paginate(per_page, page_no, table_id) {
	var table = document.getElementById(table_id);
	var min_index = 1+per_page*page_no;
	var max_index = 1+per_page*(page_no+1);
	for(var i=1; i < table.rows.length; i++) {
		if(i >= min_index && i < max_index) {
			table.rows[i].className = '';
		}
		else {
			table.rows[i].className = 'hide';
		}
		
	}
}

function set_up_pagination_button(id, name, is_current, f, update_f) {
	var li = document.createElement('li');
	var a = document.createElement('a');
	a.innerHTML = name;
	li.id = id;
	a.onclick = function() {
		li.className = 'clicked';
		update_f();
		f();
	};
	if(is_current) {
		li.className += 'current';
	}
	li.appendChild(a);
	return li;
}

function set_up_pagination(selector_id, button_ul_id, table_id) {
	var selector = document.getElementById(selector_id);
	var button_ul = document.getElementById(button_ul_id);
	var table = document.getElementById(table_id);
	
	function update_pagination() {
		var per_page = selector.options[selector.selectedIndex].text;
		var page_no = $('#' + button_ul_id + ' .current').text() - 1;
		paginate(per_page, page_no, table_id);
	}
	
	function update_clicked_button() {
		var currently_selected = $('#' + button_ul_id + ' .current').text();
		var to_be_selected = $('#' + button_ul_id + ' .clicked').attr('id');
		if(to_be_selected == 'back') {
			to_be_selected = parseInt(currently_selected) - 1;
		}
		if(to_be_selected == 'forward') {
			to_be_selected = parseInt(currently_selected) + 1;	
		}
		to_be_selected = Math.min(Math.max(to_be_selected, 1), button_ul.childNodes.length-2);
		
		for(var i=0; i < button_ul.childNodes.length; i++) {
			if(i==to_be_selected) {
				button_ul.childNodes[i].className = 'current';
			}
			else {
				button_ul.childNodes[i].className = '';
			}
		}
		
		if(to_be_selected == 1) {
			button_ul.childNodes[0].className = 'arrow unavailable';
		}
		if(to_be_selected == button_ul.childNodes.length-2) {
			button_ul.childNodes[button_ul.childNodes.length-1].className = 'arrow unavailable';
		}
	}
	
	function update_pagination_buttons() {
		var per_page = selector.options[selector.selectedIndex].text;
		var total_rows = table.rows.length-1;
		var num_pages = Math.floor(1.0*total_rows/per_page)+1
		
		button_ul.innerHTML = '';
		button_ul.appendChild(set_up_pagination_button('back', '&laquo;', false, update_pagination, update_clicked_button));
		for(var i=0; i < num_pages; i++) {
			button_ul.appendChild(set_up_pagination_button(i+1, i+1, i==0, update_pagination, update_clicked_button));
		}
		button_ul.appendChild(set_up_pagination_button('forward', '&raquo;', false, update_pagination, update_clicked_button));
	}
	
	selector.onchange = function() {
		update_pagination_buttons();
		update_pagination();
	};
	
	update_pagination_buttons();
	update_pagination();
}
