'use strict';

;( function ( document, window, index ) {
    var inputs = document.querySelectorAll( '.inputfile' );
    Array.prototype.forEach.call( inputs, function( input ){
	var label	 = input.nextElementSibling,
	    labelVal = label.innerHTML;

	input.addEventListener( 'change', function( e ) {
	    var fileName = '';
	    if( this.files && this.files.length > 1 )
		fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
	    else
		fileName = e.target.value.split( '\\' ).pop();
	    
	    if( fileName )
		label.querySelector( 'span' ).innerHTML = fileName;
	    else
		label.innerHTML = labelVal;

	    var bar = $('.bar');
	    var percent = $('.percent');
	    var status = $('#status');
	    
	    $('form').ajaxForm({
		beforeSend: function() {
		    status.empty();
		    var percentVal = '0%';
		    //		    bar.width(percentVal);
		    
//		    percent.html(percentVal);
		},
		uploadProgress: function(event, position, total, percentComplete) {
		    var percentVal = percentComplete + '%';
		    //		    bar.width(percentVal);
		    label.querySelector( 'span' ).innerHTML = percentVal;
//		    percent.html(percentVal);
		},
		complete: function(xhr) {
		    label.querySelector( 'span' ).innerHTML = xhr.responseText;
//		    status.html(xhr.responseText);
		}
	    });

	    $('form').submit();
	    
	});

	// Firefox bug fix
	input.addEventListener( 'focus', function(){ input.classList.add( 'has-focus' ); });
	input.addEventListener( 'blur', function(){ input.classList.remove( 'has-focus' ); });
    });
}( document, window, 0 ));
