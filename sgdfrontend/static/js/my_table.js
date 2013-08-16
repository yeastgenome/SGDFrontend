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

function create_pagination_button(id, name) {
		var li = document.createElement('li');
		var a = document.createElement('a');
		a.innerHTML = name;
		li.id = id;
		li.appendChild(a);
		return li;
	}

function create_pagination_buttons(per_page, total_rows, button_ul_id) {
	var button_ul = document.getElementById(button_ul_id);
	var num_pages = Math.floor(1.0*total_rows/per_page)+1
		
	button_ul.innerHTML = '';
	var back = create_pagination_button('back', '&laquo;');
	back.className = 'arrow unavailable';
	button_ul.appendChild(back);
	
	for(var i=0; i < num_pages; i++) {
		button_ul.appendChild(create_pagination_button(i+1, i+1));
		if(num_pages > 7 && i==num_pages-2) {
			var middle = create_pagination_button('middle', '&hellip;');
			middle.className = 'arrow unavailable';
			button_ul.appendChild(middle);
		}
	}
	var forward = create_pagination_button('forward', '&raquo;');
	forward.className = 'arrow unavailable';
	button_ul.appendChild(forward);
}

function get_current_page_no(button_ul_id) {
	return $('#' + button_ul_id + ' .current').text() - 1;
}

function select_pagination_button(button_id, selector_id, button_ul_id, table_id) {
	var button_ul = document.getElementById(button_ul_id);
	var page_no = get_current_page_no(button_ul_id);
	if(page_no >= 0) {
		alert(button_ul.childNodes[page_no]);
		button_ul.childNodes[page_no].className.replace('current', '');
	}
	button_ul.childNodes[button_id].className += 'current';
	
	var selector = document.getElementById(selector_id);
	var per_page = selector.options[selector.selectedIndex].text;
	//paginate(per_page, page_no, table_id)
}

function adjust_visibility_of_pagination_buttons(button_ul_id) {
	var button_ul = document.getElementById(button_ul_id);
	var num_pages = button_ul.childNodes.length - 3;
	if(num_pages > 7) {
		var page_no = get_current_page_no(button_ul_id) + 1;
		var min_entry;
		var max_entry;
		if(page_no > num_pages - 5) {
			min_entry = num_pages - 6;
			max_entry = num_pages;
			$('#' + button_ul_id + ' #middle').hide();
		}
		else {
			min_entry = Math.max(Math.min(page_no-2, num_pages-4), 1);
			max_entry = Math.max(Math.min(page_no+3, 98), 6);
			$('#' + button_ul_id + ' #middle').show();
		}
		for(var i=0; i < num_pages; i++) {
			if(i >= min_entry && i < max_entry) {
				$('#' + button_ul_id + ' #' + i).show();
			}
			else {
				$('#' + button_ul_id + ' #' + i).hide();
			}
		}
	}
	else {
		$('#' + button_ul_id + ' #middle').hide();
	}
}

function set_up_pagination_selector(selector_id, button_ul_id, table_id) {
	var table = document.getElementById(table_id);
	var selector = document.getElementById(selector_id);
	
	selector.onchange = function() {
		var per_page = selector.options[selector.selectedIndex].text;
		var total_rows = table.rows.length-1;
		create_pagination_buttons(per_page, total_rows, button_ul_id);
		select_pagination_button(1, selector_id, button_ul_id, table_id)
		adjust_visibility_of_pagination_buttons(button_ul_id);
		paginate(per_page, get_current_page_no(button_ul_id), table_id);
	};
}

function set_up_pagination_buttons(selector_id, button_ul_id, table_id) {
	var button_ul = document.getElementById(button_ul_id);
	var num_pages = button_ul.childNodes.length - 3;
	for(var i=0; i < num_pages; i++) {
		if(button_ul.childNodes[i].id == 'back') {
			
		}
		else if(button_ul.childNodes[i].id == 'forward') {
			
		}
		else if(button_ul.childNodes[i].id == 'middle') {
			
		}
		else {
			button_ul.childNodes[i].childNodes[0].onclick = function() {
				select_pagination_button(button_ul.childNodes[i].id, selector_id, button_ul_id, table_id);
			}	
		}
	}
}

function set_up_pagination(selector_id, button_ul_id, table_id) {
	var selector = document.getElementById(selector_id);
	var button_ul = document.getElementById(button_ul_id);
	var table = document.getElementById(table_id);
	
	
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
		if(num_pages < 8) {
			for(var i=0; i < num_pages; i++) {
				button_ul.appendChild(set_up_pagination_button(i+1, i+1, i==0, update_pagination, update_clicked_button));
			}
		}
		else {
			for(var i=0; i < 3; i++) {
				button_ul.appendChild(set_up_pagination_button(i+1, i+1, i==0, update_pagination, update_clicked_button));
			}
			button_ul.appendChild(set_up_pagination_button('middle', '&hellip;', false, update_pagination, update_clicked_button));
			for(var i=num_pages-3; i < num_pages; i++) {
				button_ul.appendChild(set_up_pagination_button(i+1, i+1, i==0, update_pagination, update_clicked_button));
			}
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
