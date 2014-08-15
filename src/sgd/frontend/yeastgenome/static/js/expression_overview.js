/**
 * Created by kpaskov on 6/11/14.
 */

google.load("visualization", "1", {packages:["corechart"]});
function create_expression_chart(all_data, min_value, max_value) {
    if(all_data != null) {
        var datatable2 = [['Low-Extreme', 'Low', 'High', 'High-Extreme']];

        var min_extreme = 0;
        for (var key in all_data) {
            var value = parseFloat(key);
            if(value == -5.5) {
                for(var i=0; i < all_data[key]; i++) {
                    datatable2.push([value, null, null, null]);
                }
            }
            else if(value < 0) {
                for(var i=0; i < all_data[key]; i++) {
                    datatable2.push([null, value, null, null]);
                }
            }
            else if(value == 5) {
                for(var i=0; i < all_data[key]; i++) {
                    datatable2.push([null, null, null, value]);
                }
            }
            else {
                for(var i=0; i < all_data[key]; i++) {
                    datatable2.push([null, null, value, null]);
                }
            }

            if(value < min_extreme) {
                min_extreme = value;
            }
        }

        min_extreme = Math.ceil(min_extreme);

        function draw_chart(use_log) {
            function tooltipHandler(e) {
                    var gs = $('#two_channel_expression_chart > div > div > svg > g');
                    $(gs[2]).show();
                    var tooltips = $('#two_channel_expression_chart > div > div > svg > g > g > g > text');
                    for(var i=0; i < tooltips.length; i++) {
                        var tooltip = $(tooltips[i]);
                        if(tooltip.html() == 'Items:') {
                            $(tooltips[i+1]).html(Math.round(Math.pow(10, $(tooltips[i+1]).html())));
                        }
                    }
                }

            var chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart'));
            chart.draw(google.visualization.arrayToDataTable(datatable2), {
                                        legend: { position: 'none' },
                                        hAxis: {title: 'log2 ratio', viewWindow: {min: -5.5, max: 5.5}},
                                        vAxis: {title: 'Number of conditions', logScale: use_log},
                                        height: 300,
                                        colors: ['#13e07a', '#0d9853', '#980D0D', '#e01313'],
                                        histogram: {bucketSize:.5},
                                        isStacked: true,
                                        titlePosition: 'none'
                                    });

            // The select handler. Call the chart's getSelection() method
            function selectHandler() {
                $('#expression_table_filter > label > input:first').removeClass('flash');
                var gs = $('#two_channel_expression_chart > div > div > svg > g');
                $(gs[2]).hide();
                var min_range = chart.getSelection()[0].row/2 + min_extreme -.5;
                var max_range = min_range + .5;
                if(min_range == -5.5) {
                    min_range = '*';
                }
                else {
                    min_range = min_range.toFixed(1);
                }
                if(max_range == 5.5) {
                    max_range = '*';
                }
                else {
                    max_range = max_range.toFixed(1);
                }
                chart.setSelection([]);
                var dataset_table = $($.fn.dataTable.fnTables(true)).dataTable();
                dataset_table.fnFilter( 'log2ratio=' + min_range + ':' + max_range );
                try {
                    $('#navbar_annotations > a:first').click();
                }
                catch(err) {

                }
                $('#expression_table_filter > label > input:first').addClass('flash');
            }

            // Listen for the 'select' event, and call my function selectHandler() when
            // the user selects something on the chart.
            google.visualization.events.addListener(chart, 'select', selectHandler);

            //Fix tooltips
            if(use_log) {
                google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
            }

            var labels = $('#two_channel_expression_chart > div > div > svg > g > g > g > text');
            for(var i=0; i < labels.length; i++) {
                var label = $(labels[i]);
                if(label.html() == '-5.5') {
                    label.html(min_value.toFixed(1));
                }
                else if(label.html() == '5.5') {
                    label.html(max_value.toFixed(1));
                }
            }
        }
        draw_chart(true);

        $('#y-axis-switch').click(function() {
            draw_chart($('#y-axis-switch').is(':checked'));
        });
    }
}