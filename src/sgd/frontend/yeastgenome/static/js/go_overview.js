
function draw_go_overview() {
    if(go_overview != null) {
        if(go_overview['go_aspect'].length > 1) {
            var aspect_data = google.visualization.arrayToDataTable(go_overview['go_aspect']);
            var aspect_options = {
                'legend': {'position': 'none'},
                'title': 'Aspect of gene ontology terms',
                'vAxis': {title: '# of Annotations', minValue:0, maxValue:5, gridlines:{count:6}},
                'hAxis': {title: 'Aspect'},
                'dataOpacity':.75,
                'colors': ["#4daf4a"],
                'chartArea': {left:50,top:50,width:"80%",height:"50%"},
                'backgroundColor': 'transparent',
                'height':300
            };
            var aspect_chart = new google.visualization.ColumnChart(document.getElementById('aspect_chart'));

            // The select handler. Call the chart's getSelection() method
            function selectHandler() {
                var selectedItem = aspect_chart.getSelection()[0];
                if (selectedItem) {
                    if(window.location.pathname.indexOf('overview') > -1) {
                        window.location = '/locus/' + display_name + '/go#manual'
                    }
                    else {
                        window.location.hash = "";
                        window.location.hash = 'manual'
                    }
                }
            }

            // Listen for the 'select' event, and call my function selectHandler() when
            // the user selects something on the chart.
            google.visualization.events.addListener(strain_chart, 'select', selectHandler);

            aspect_chart.draw(aspect_data, aspect_options);
        }

        if(go_overview['go_aspect'].length == 1 && go_aspect['go_slim_count'].length == 1) {
            $("#summary_wrapper").hide()
        }

        if('go_slim_counts' in go_overview) {
            var dataTable = google.visualization.arrayToDataTable(go_overview['go_slim_counts']);

            var options = {
                  title: 'Gene Ontology Slim',
                  pieSliceText: 'none',
                  colors: ['#2f6a2d', '#41933e', '#58b755', '#81c97f', '#aadaa8']
            };

            var slim = new google.visualization.PieChart(document.getElementById('go_slim_chart'));

            // The select handler. Call the chart's getSelection() method
                function slimSelectHandler() {
                    var selectedItem = slim.getSelection()[0];
                    if (selectedItem) {
                        if(window.location.pathname.indexOf('overview') > -1) {
                            window.location = '/locus/' + display_name + '/go#manual'
                        }
                        else {
                            var phenotype_table = $($.fn.dataTable.fnTables(true)).dataTable();
                            phenotype_table.fnFilter( observable );
                            window.location.hash = "";
                            window.location.hash = 'manual'
                        }
                    }
                }
            google.visualization.events.addListener(slim, 'select', slimSelectHandler);

            slim.draw(dataTable, options);
        }
    }
}