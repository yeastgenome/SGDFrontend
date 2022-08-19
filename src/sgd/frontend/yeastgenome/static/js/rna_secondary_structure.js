function show_secondary_structure(URS_ID) {

    var search = '{"urs": "' + URS_ID + '"}'
    var html = '<r2dt-web ' + search + ' />'
    
    var win = window.open('', 'popUpWindow', "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=600,height=600,top="+(screen.height-600)+",left="+(screen.width-500));
    win.document.body.innerHTML = "<html>" + html + "</html>";
}
