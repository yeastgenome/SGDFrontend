
if(regulation_overview['target_count'] + regulation_overview['regulator_count'] > 0){
    google.load("visualization", "1", {packages:["corechart"]});
    google.setOnLoadCallback(drawChart);
    function drawChart() {
        var data_table = google.visualization.arrayToDataTable([['Category', 'Genes', { role: 'style' }, { role: 'annotation' }],
                                                                ['Targets', regulation_overview['target_count'], '#AF8DC3', regulation_overview['target_count']],
                                                                ['Regulators', regulation_overview['regulator_count'], '#7FBF7B', regulation_overview['regulator_count']]]);

        var graph_options = {
            'title': 'Transcriptional Targets and Regulators for ' + display_name + ' (includes high-throughput predictions)',
            'legend': {'position': 'none'},
            'hAxis': {title: 'Genes', minValue: 0},
            'dataOpacity':1,
            'backgroundColor': 'transparent'
        };
        if(Math.max(regulation_overview['target_count'], regulation_overview['regulator_count']) == 1) {
            options['hAxis']['gridlines'] = {count:"2"}
        }

        var chart = new google.visualization.BarChart(document.getElementById('summary_diagram'));

        // The select handler. Call the chart's getSelection() method
        function barSelectHandler() {
            var selectedItem = chart.getSelection()[0];
            if (selectedItem) {
                if(selectedItem.row == 1) {
                    window.location.hash = "";
                    window.location.hash = "regulators";
                }
                else {
                    window.location.hash = "";
                    window.location.hash = "targets";
                }
            }
        }

        // Listen for the 'select' event, and call my function selectHandler() when
        // the user selects something on the chart.
        google.visualization.events.addListener(chart, 'select', barSelectHandler);

        chart.draw(data_table, graph_options);
    }
}
else {
  	document.getElementById("summary_message").style.display = "block";
  	document.getElementById("summary_wrapper").style.display = "none";
}