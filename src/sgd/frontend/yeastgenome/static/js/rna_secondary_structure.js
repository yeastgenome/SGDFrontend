function show_secondary_structure(URS_ID) {

    //var search = "{\"urs\": \"" + URS_ID + "\"}"
    // var html = "<r2dt-web search='" + search + "' />"

    // html = "<r2dt-web search='{\"urs\": \"URS00000064B1\"}' />"

    var html = '<r2dt-web search="{&#34;urs&#34;:&#34;' + URS_ID + '&#34;}">'
	
    console.log(html)
    
    var win = window.open('', 'popUpWindow', "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=800,top="+(screen.height-600)+",left="+(screen.width-500));
    win.document.body.innerHTML = "<html><head><title>R2DT</title></head><body>" + html + "<script type='text/javascript' src='https://rnacentral.github.io/r2dt-web/dist/r2dt-web.js'></script></body></html>";

}
