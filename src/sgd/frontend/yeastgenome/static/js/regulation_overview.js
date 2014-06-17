google.load("visualization", "1", {packages:["corechart"]});
function drawChart() {
    if(regulation_overview != null) {
        if(regulation_overview['target_count'] + regulation_overview['regulator_count'] > 0){
            var data_table = google.visualization.arrayToDataTable([['Category', 'Genes', { role: 'style' }, { role: 'annotation' }],
                                                                    ['Targets', regulation_overview['target_count'], '#f96968', regulation_overview['target_count']],
                                                                    ['Regulators', regulation_overview['regulator_count'], '#fdcbca', regulation_overview['regulator_count']]]);


            var chart = new google.visualization.BarChart(document.getElementById('summary_diagram'));

            // The select handler. Call the chart's getSelection() method
            function barSelectHandler() {
                var selectedItem = chart.getSelection()[0];
                if (selectedItem) {
                    if(selectedItem.row == 1) {
                        if(window.location.pathname.indexOf('regulation') > -1) {
                            window.location.hash = "";
                            window.location.hash = 'regulators'
                        }
                        else {
                            window.location = '/locus/' + display_name + '/regulation#regulators'
                        }
                    }
                    else {
                        if(window.location.pathname.indexOf('regulation') > -1) {
                            window.location.hash = "";
                            window.location.hash = 'targets'
                        }
                        else {
                            window.location = '/locus/' + display_name + '/regulation#targets'
                        }
                    }
                }
            }

            // Listen for the 'select' event, and call my function selectHandler() when
            // the user selects something on the chart.
            google.visualization.events.addListener(chart, 'select', barSelectHandler);

            chart.draw(data_table, {
                'title': 'Transcriptional Targets and Regulators for ' + display_name + ' (includes high-throughput predictions)',
                'legend': {'position': 'none'},
                'hAxis': {title: 'Genes', minValue:0, maxValue:5, gridlines:{count:6}},
                'dataOpacity':1,
                'backgroundColor': 'transparent'
            });
        }
        else {
            document.getElementById("#regulation_summary_message").style.display = "block";
            document.getElementById("#regulation_summary_wrapper").style.display = "none";
        }
    }
}
google.setOnLoadCallback(drawChart);