
if(target_count + regulator_count > 0){
    google.load("visualization", "1", {packages:["corechart"]});
    google.setOnLoadCallback(drawChart);
    function drawChart() {
        var data_table = google.visualization.arrayToDataTable([['Category', 'Genes', { role: 'style' }, { role: 'annotation' }],
                                                                ['Targets', target_count, '#AF8DC3', target_count],
                                                                ['Regulators', regulator_count, '#7FBF7B', regulator_count]]);

        var graph_options = {
            'title': 'Transcriptional Targets and Regulators for ' + display_name,
            'legend': {'position': 'none'},
            'hAxis': {title: 'Genes'},
            'dataOpacity':1,
            'backgroundColor': 'transparent'
        };

        var chart = new google.visualization.BarChart(document.getElementById('summary_diagram'));
        chart.draw(data_table, graph_options);
    }
}
else {
  	document.getElementById("summary_message").style.display = "block";
  	document.getElementById("summary_wrapper").style.display = "none";
}