/**
 * Created by kpaskov on 6/11/14.
 */

google.load("visualization", "1", {packages:["corechart"]});
function create_expression_chart(all_data) {
    if(all_data != null) {
        var datatable2 = [['Low-Expression', 'High-Expression']];

        var extreme = 0;
        for (var key in all_data) {
            var value = parseFloat(key);
            if(value < 0) {
                for(var i=0; i < all_data[key]; i++) {
                    datatable2.push([value, null]);
                }
            }
            else {
                for(var i=0; i < all_data[key]; i++) {
                    datatable2.push([null, value]);
                }
            }

            if(Math.abs(value) > extreme) {
                extreme = Math.abs(value);
            }
        }

        var chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart'));
        chart.draw(google.visualization.arrayToDataTable(datatable2), {
                                    legend: { position: 'none' },
                                    hAxis: {title: 'log2 ratio', viewWindow: {min: -extreme, max: extreme}},
                                    vAxis: {title: 'Number of conditions', logScale: true},
                                    height: 300,
                                    colors: ['#ffce9d', '#ff9d3b', '#eb7500'],
                                    histogram: {bucketSize: 1},
                                    isStacked: true
                                });

//        // The select handler. Call the chart's getSelection() method
//        function leftSelectHandler() {
//            var selectedItem = left_chart.getSelection();
//            window.location = datatable_left_links[selectedItem[0].row];
//        }
//        function rightSelectHandler() {
//            var selectedItem = right_chart.getSelection();
//            window.location = datatable_right_links[selectedItem[0].row];
//        }
//
//        // Listen for the 'select' event, and call my function selectHandler() when
//        // the user selects something on the chart.
//        google.visualization.events.addListener(left_chart, 'select', leftSelectHandler);
//        google.visualization.events.addListener(right_chart, 'select', rightSelectHandler);
    }
}