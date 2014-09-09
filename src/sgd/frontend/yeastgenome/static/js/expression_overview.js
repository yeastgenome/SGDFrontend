/**
 * Created by kpaskov on 6/11/14.
 */

function make_expression_ready_handler(chart, use_log, min_value, max_value) {
    function ready_handler() {
        //Fix tooltips
        function tooltipHandler(e) {
                    var gs = $('#two_channel_expression_chart > div > div > svg > g');
                    $(gs[2]).show();
                    var tooltips = $('#two_channel_expression_chart > div > div > svg > g > g > g > text');
                    for(var i=0; i < tooltips.length; i++) {
                        var tooltip = tooltips[i];
                        if(tooltip.innerHTML == 'Items:') {
                            $(tooltips[i]).html('Conditions: ');
                            $(tooltips[i+1]).attr('x', parseInt($(tooltips[i]).attr('x'))+70);
                            $(tooltips[i+1]).html('' + Math.round(Math.pow(10, $(tooltips[i+1]).html())));
                        }
                    }
                }

       if(use_log) {
            google.visualization.events.addListener(chart, 'onmouseover', tooltipHandler);
       }

       $("text:contains('-5.5')").html(min_value.toFixed(1));
       $("text:contains('5.5')").html(max_value.toFixed(1));
    }
    return ready_handler;
}

function create_expression_chart(all_data, min_value, max_value) {
    if(all_data != null) {
        var capped_min = Math.max(-5.5, min_value);
        var capped_max = Math.min(5, max_value);
        var header_row = [];
        var colors = [];
        var indexes = [];
        if(capped_min == -5.5) {
            header_row.push('Low-Extreme');
            colors.push('#13e07a');
        }
        indexes.push(header_row.length-1);
        if(capped_min < 0) {
            header_row.push('Low');
            colors.push('#0d9853');
        }
        indexes.push(header_row.length-1);
        if(capped_max >= 0) {
            header_row.push('High');
            colors.push('#980D0D');
        }
        indexes.push(header_row.length-1);
        if(capped_max == 5) {
            header_row.push('High-Extreme');
            colors.push('#e01313');
        }
        indexes.push(header_row.length-1);

        var datatable2 = [header_row];

        for (var key in all_data) {
            var value = parseFloat(key);
            if(value == -5.5) {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[0]] = value;
                    datatable2.push(new_row);
                }
            }
            else if(value < 0) {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[1]] = value;
                    datatable2.push(new_row);
                }
            }
            else if(value == 5) {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[3]] = value;
                    datatable2.push(new_row);
                }
            }
            else {
                for(var i=0; i < all_data[key]; i++) {
                    var new_row = Array.apply(null, new Array(header_row.length));
                    new_row[indexes[2]] = value;
                    datatable2.push(new_row);
                }
            }
        }

        function draw_chart(use_log) {
            var options = {
                                        legend: { position: 'none' },
                                        hAxis: {title: 'log2 ratio', viewWindow: {min: -5.5, max: 5.5}},
                                        vAxis: {title: 'Number of conditions', logScale: use_log},
                                        height: 300,
                                        colors: colors,
                                        histogram: {bucketSize:.5, hideBucketItems:true},
                                        isStacked: true,
                                        titlePosition: 'none'

                                    };
            var chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart'));
            google.visualization.events.addListener(chart, 'ready', make_expression_ready_handler(chart, use_log, min_value, max_value));
            chart.draw(google.visualization.arrayToDataTable(datatable2), options);

            // The select handler. Call the chart's getSelection() method
            function selectHandler() {
                $('#expression_table_filter > label > input:first').removeClass('flash');
                var gs = $('#two_channel_expression_chart > div > div > svg > g');
                $(gs[2]).hide();
                var min_range = .5*chart.getSelection()[0].row + Math.max(capped_min, -5.5);
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
        }
        draw_chart(true);

        $('#y-axis-switch').click(function() {
            draw_chart($('#y-axis-switch').is(':checked'));
        });
    }
}