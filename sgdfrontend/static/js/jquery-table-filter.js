//PLUGIN INFO: https://github.com/efeamadasun/jquery-table-filter

(function($){

	$.fn.table_filter = function (options) {

		//set default plugin values
		var settings = $.extend({

			'filter_inverse': false,
			'enable_space': false,
			'table': '',
			'cell_selector': 'td',
			'no_result': '',
			'no_result_selector': ''

		}, options);

		//return element, to maintain chainability
		return this.each(function () {
			var $this = $(this);

			$this.bind("keyup", function () { 

				//set filter text, and filterable table rows
				var txt = $this.val().toLowerCase().trim();
				var obj = $(settings.table).find("tr:not(:has('th'))");

				$.each(obj, function () {
					//decide whether to show matched rows or not using "filter_inverse" value
					var show_tr = (settings.filter_inverse) ? true : false;
					var inner_obj = $(this).find(settings.cell_selector);
					var change = 0; 

					$.each(inner_obj, function () {
						var td_txt = $.trim($(this).text()).toLowerCase();

						//if space is enabled as a delimiter, split the TD text value 
						//and check the individual values against the filter text.
						if(settings.enable_space){

							var td_array = txt.split(" ");
							$.each(td_array, function (i) {
								var td_value = td_array[i];

								if(td_txt.indexOf(td_value) != -1){
									change++;
								}
							});

						}
						else{

							if(td_txt.indexOf(txt) != -1){
								change++;
							} 

						}

					});

					show_tr = (change > 0) ? !show_tr : show_tr;
					if(show_tr){
						$(this).show();
					}
					else{
						$(this).hide();
					}

				});

				//display all rows if filter text is empty
				if($.trim(txt) == ""){
					$(settings.table).find("tr").show();
				}

				//show "No Results" div if not matching rows were found
				var num_rows = $(settings.table).find("tr:not(:has('th')):visible").size();
				if(num_rows == 0 && settings.no_result != "" && settings.no_result_selector != ""){
					$(settings.no_result_selector).text(settings.no_result).show();
				}
				else{
					$(settings.no_result_selector).text("").hide();
				}

			});

		});

	};

})(jQuery);