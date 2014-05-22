google.load("visualization", "1", {packages:["corechart"]});
function drawChart() {
    if(target_count + regulator_count > 0){
        var data_table = google.visualization.arrayToDataTable([['Category', 'Genes', { role: 'style' }, { role: 'annotation' }],
                                                                ['Targets', target_count, '#AF8DC3', target_count],
                                                                ['Regulators', regulator_count, '#7FBF7B', regulator_count]]);

        var graph_options = {
            'title': 'Transcriptional Targets and Regulators for ' + display_name,
            'legend': {'position': 'none'},
            'hAxis': {title: 'Genes', minValue:0, maxValue:5, gridlines:{count:6}},
            'dataOpacity':1,
            'backgroundColor': 'transparent'
        };

        var chart = new google.visualization.BarChart(document.getElementById('summary_diagram'));

        // The select handler. Call the chart's getSelection() method
        function barSelectHandler() {
            var selectedItem = chart.getSelection()[0];
            if (selectedItem) {
                if(selectedItem.row == 1) {
                    window.location.hash = "";
                    window.location.hash = "regulators_regulation";
                }
                else {
                    window.location.hash = "";
                    window.location.hash = "targets_regulation";
                }
            }
        }

        // Listen for the 'select' event, and call my function selectHandler() when
        // the user selects something on the chart.
        google.visualization.events.addListener(chart, 'select', barSelectHandler);

        chart.draw(data_table, graph_options);

    }
    else {
        document.getElementById("summary_message").style.display = "block";
        document.getElementById("summary_wrapper").style.display = "none";
    }
}
google.setOnLoadCallback(drawChart);