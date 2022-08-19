function show_secondary_structure(URS_ID) {

    var search = '{"urs": "' + URS_ID + '"}'
    var html = '<r2dt-web ' + search + ' />'

    console.log(html)
    
    var win = window.open('', 'popUpWindow', "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=800,top="+(screen.height-600)+",left="+(screen.width-500));
    win.document.body.innerHTML = "<html>" + html + "</html>";
}
