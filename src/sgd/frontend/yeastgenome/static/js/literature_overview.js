
function draw_literature_overview() {
    if(literature_overview != null) {
        var literature_data = google.visualization.arrayToDataTable(literature_overview);
        var literature_options = {
            'legend': {'position': 'none'},
            'title': 'Literature for ' + display_name,
            'vAxis': {title: '# of References', minValue:0, maxValue:5, gridlines:{count:5}},
            'hAxis': {title: 'Literature Type'},
            'dataOpacity':.75,
            'colors': ["#ffcc33"],
            'chartArea': {left:50,top:50,width:"80%",height:"50%"},
            'backgroundColor': 'transparent',
            'height':300
        };
        var literature_chart = new google.visualization.ColumnChart(document.getElementById('literature_chart'));

        // The select handler. Call the chart's getSelection() method
        function selectHandler() {
            var selectedItem = literature_chart.getSelection()[0];
            if (selectedItem) {
                //var value = strain_data.getValue(selectedItem.row, selectedItem.column);
                var literature_type = literature_overview[selectedItem.row+1][0].toLowerCase();
                if(window.location.pathname.indexOf('overview') > -1) {
                    window.location = '/locus/' + display_name + '/literature#' + literature_type
                }
                else {
                    window.location.hash = "";
                    window.location.hash = literature_type;
                }
            }
        }

        // Listen for the 'select' event, and call my function selectHandler() when
        // the user selects something on the chart.
        google.visualization.events.addListener(literature_chart, 'select', selectHandler);

        literature_chart.draw(literature_data, literature_options);
    }
}