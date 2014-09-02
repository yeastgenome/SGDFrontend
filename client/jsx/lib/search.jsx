/** @jsx React.DOM */

// 
// This js is for SGD search pages
// Shuai Weng, October 2011
//
var $ = require("jquery");
require("jquery-ui");

SUGGEST_URL='/cgi-bin/search/searchSuggest.fpl'; 

SEARCH_URL='/cgi-bin/search/instantSearch.fpl?query='; 
        
var fields = ['gene_name',
	      'headline',
	      'name_description',
	      'paragraph',
	      'note',
	      'phenotype',
	      'go_process',
	      'go_function',
	      'go_component',
	      'biological_pathway',
	      'author_name',
	      'colleague',
	      'paper_title',
	      'external_id'];



module.exports = function initialize_sgd_search(){
    	
     $('#txt_search').autocomplete({ source: SUGGEST_URL, 
		                     select: function(event, ui) { 
		                             $(this).val(ui.item.value);
					     $('#searchform').submit()
				     } 
     });
     
     $('#txt_search-mobile').autocomplete({ source: SUGGEST_URL, 
		                     select: function(event, ui) { 
		                             $(this).val(ui.item.value);
					     $('#searchform-mobile').submit()
				     } 
     });

     $('#big_txt_search').autocomplete({ source: SUGGEST_URL,
		                         select: function(event, ui) {
		                                 $(this).val(ui.item.value);
		                                 $('#big_searchform').submit()
			                 }

		    
     });   

	//    $('#txt_search').autocomplete({ source: SUGGEST_URL });

        // $('#big_txt_search').autocomplete({ source: SUGGEST_URL });

     $('#big_txt_search').keyup(function() {
      
          // Get the current query in the search box
      
          var query = $(this).val();

          // If there are more than 2 character, perform a suggest lookup
 
          if (query.length > 2) {
        
             $.getJSON(SEARCH_URL + query, null, searchCallback);

	     $('#full_result').hide();

          } 
          else {
        
	      $('#full_result').hide();

          }

     });

     $.each(fields, function(index, value) {

            $('#'+value+'_gene_tbl').hide();

     });




$.fn.insertAtCaret = function (myValue) {

	return this.each(function(){
			//IE support
			if (document.selection) {
					this.focus();
					sel = document.selection.createRange();
					sel.text = myValue;
					this.focus();
			}
			//MOZILLA / NETSCAPE support
			else if (this.selectionStart || this.selectionStart == '0') {
					var startPos = this.selectionStart;
					var endPos = this.selectionEnd;
					var scrollTop = this.scrollTop;
					this.value = this.value.substring(0, startPos)+ myValue+ this.value.substring(endPos,this.value.length);
					this.focus();
					this.selectionStart = startPos + myValue.length;
					this.selectionEnd = startPos + myValue.length;
					this.scrollTop = scrollTop;
			} else {
					this.value += myValue;
					this.focus();
			}
	});
};




}


function change_category_content (field, query, quote, start) {

    $.each(fields, function(index, value) {    

	$('#'+value).css("color", "black"); 

    });

    $('#'+field).css("color", "#980D0D");

    $('#txt_category').html('Please wait! It may take a while to retrieve a big chunk of data...');

    if (quote == 1) {

	query = '"' + query + '"';

    }

    if (start) {

	htmlobj=$.ajax({url:SEARCH_URL + query + "&field=" + field + "&start=" + start + "&plain=1",async:false});

    }
    else {

	htmlobj=$.ajax({url:SEARCH_URL + query + "&field=" + field + "&plain=1",async:false});
	
    }

    $('#txt_category').html(htmlobj.responseText);

    $('#'+field+'_gene_tbl').hide();

}

function show_hide (button, label, gene_table, category_table) {

     if ($('#' + button).val().match('gene')) {

	 $('#' + button).val(label + ' detail');

	 $('#' + category_table).hide();

	 $('#' + gene_table).show();

     }
     else {

	 $('#' + button).val(label + ' as gene list');

	 $('#' + gene_table).hide();

	 $('#' + category_table).show();

     }
	    
}


function suggestCallback(data, textStatus) {

    // See if there are any suggestions

    var query = data[0];

    var ss = document.getElementById('txt_search');

	ss.innerHTML = '';

    if (data.length > 0) {

        // Show the data in the suggestions list

        var suggest = $('#txt_search').empty().show(); 

        for (var i = 0; i < data.length; i++) { 

	     suggest += '<div onmouseover="javascript:suggestOver(this);" ';
	     suggest += 'onmouseout="javascript:suggestOut(this);" ';
	     suggest += 'onclick="javascript:setSearch(this.innerHTML);" ';
	     suggest += 'class="suggest_link">' + data[i] + '</div>';

             var thisSuggest = suggest.replace('[object Object]', '');

	     ss.innerHTML = thisSuggest;

        }
      
    } 
    else {

	$('#txt_search').hide();

    }

//    // Search based on the top query
    
//    $.getJSON(SEARCH_URL + query, null, searchCallback);


}

function searchCallback(data, textStatus) {

    if (data.length > 0) {

	$('#txt_subtitle').html(data[0]);
	
	$('#txt_list').html(data[1]);

	$('#txt_category').html(data[2]);

	$.each(fields, function(index, value) {

            $('#'+value+'_gene_tbl').hide();
	   
	});

    }
    else {

	$('#txt_subtitle').html('No Results');

	$('#txt_list').html('No Results');

	$('#txt_category').html('No Results');

    }

}

function searchCallback2(data, textStatus) {

    var results = $('#txt_result').empty().show();

    if (data.length > 0) {

	html = "<center><h3>" + data[0] + "</h3></center>\n" +
	       "<table id='txt_summary'><tr><th>" + data[1] + "</h3>" + 
	       "<td id='txt_category'>" + data[2] + "</td></tr></table>";

	results.append(html);

    } 
    else {

	 $('#txt_result').hide();		    
    
    }


}


function connect_to_external_site(externalUrl, parameters) {

    var divToBeWorkedOn = "#ajaxPlaceHolder";

    $.ajax({ 

	    type: "POST",
	    url:  externalUrl,
	    data: parameters,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(msg) {    
                $(divToBeWorkedOn).html(msg.d);
            },
            error: function(e){
                $(divToBeWorkedOn).html("Unavailable");              
            }

    });

}

//Mouse over function
function suggestOver(div_value) {

    div_value.className = 'suggest_link_over';

}

//Mouse out function
function suggestOut(div_value) {
	
    div_value.className = 'suggest_link';

}


//Click function
/*
function setSearch(value) {			  
	
    document.getElementById('txt_search').value = value;
	
    document.getElementById('txt_suggest').innerHTML = '';

}

*/







