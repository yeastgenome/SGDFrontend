/**
 * Created by kpaskov on 6/11/14.
 */

function create_expression_chart() {
    if(expression_overview != null) {
        var all_data = expression_overview['all_values'];
        var low_data = expression_overview['low_values'];
        var high_data = expression_overview['high_values'];
        low_data.sort(function(a, b) {return b['value'] - a['value']});
        high_data.sort(function(a, b) {return b['value'] - a['value']});
        var datatable2 = [['Low', 'Medium', 'High']];
        var datatable_left = [['Name', 'Number']];
        var datatable_left_links = [];
        var datatable_right = [['Name', 'Number']];
        var datatable_right_links = [];

        for (var key in all_data) {
            for(var i=0; i < all_data[key]; i++) {
                if(key >= expression_overview['high_cutoff']) {
                    datatable2.push([null, null, parseFloat(key)]);
                }
                else if(key <= expression_overview['low_cutoff']) {
                    datatable2.push([parseFloat(key), null, null]);
                }
                else {
                    datatable2.push([null, parseFloat(key), null]);
                }
            }
        }

        for (var i=0; i < low_data.length; i++) {
            datatable_left.push([low_data[i]['condition'], low_data[i]['value']]);
            datatable_left_links.push(low_data[i]['dataset']['link']);
        }
        for (var i=0; i < high_data.length; i++) {
            datatable_right.push([high_data[i]['condition'], high_data[i]['value']]);
            datatable_right_links.push(high_data[i]['dataset']['link']);
        }

        var left_chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart_left'));
        left_chart.draw(google.visualization.arrayToDataTable(datatable_left), {
                                    title: 'Low-Expression Experiments',
                                    legend: { position: 'none' },
                                    hAxis: {title: 'log2 ratio'},
                                    vAxis: {title: 'Number of experiments'},
                                    height: 300,
                                    colors: ['#ffce9d']
                                });

        var right_chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart_right'));
        right_chart.draw(google.visualization.arrayToDataTable(datatable_right), {
                                    title: 'High-Expression Experiments',
                                    legend: { position: 'none' },
                                    hAxis: {title: 'log2 ratio'},
                                    histogram: { lastBucketPercentile: 20 },
                                    vAxis: {title: 'Number of experiments'},
                                    height: 300,
                                    colors: ['#eb7500']
                                });

        var chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart'));
        chart.draw(google.visualization.arrayToDataTable(datatable2), {
                                    title: 'All Experiments',
                                    legend: { position: 'none' },
                                    hAxis: {title: 'log2 ratio'},
                                    vAxis: {title: 'Number of experiments'},
                                    height: 300,
                                    colors: ['#ffce9d', '#ff9d3b', '#eb7500'],
                                    isStacked: true
                                });

        // The select handler. Call the chart's getSelection() method
        function leftSelectHandler() {
            var selectedItem = left_chart.getSelection();
            window.location = datatable_left_links[selectedItem[0].row];
        }
        function rightSelectHandler() {
            var selectedItem = right_chart.getSelection();
            window.location = datatable_right_links[selectedItem[0].row];
        }

    // Listen for the 'select' event, and call my function selectHandler() when
    // the user selects something on the chart.
    google.visualization.events.addListener(left_chart, 'select', leftSelectHandler);
    google.visualization.events.addListener(right_chart, 'select', rightSelectHandler);
    }
}