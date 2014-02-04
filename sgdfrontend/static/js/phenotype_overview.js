google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawChart);
function drawChart() {

    if(overview_data['mutant_types'].length > 0) {
        var labels = overview_data['experiment_types'];
        labels.unshift('Mutant Type');
        var all_data = [labels];
        //Prepare Data
        var max = 0;
        for(var j=0; j < overview_data['mutant_types'].length; j++) {
            var mutant = overview_data['mutant_types'][j];
            var new_row = overview_data['mutant_to_count'][mutant];
            new_row.unshift(mutant);
            all_data.push(new_row);
            for(var k=1; k < overview_data['mutant_to_count'][mutant].length; k++) {
                max = Math.max(max, overview_data['mutant_to_count'][mutant][k])
            }
        };

        var label = 'Annotations'
        var data = google.visualization.arrayToDataTable(all_data);
        var options = {
            'legend': {'position': 'top', title: 'Experiment Type'},
            'title': label + ' by mutant type and experiment type',
            'vAxis': {title: 'Mutant Type'},
            'hAxis': {title: '# of ' + label, minValue: 0},
            'chartArea': {left:110,top:50,width:"60%",height:"60%"},
            'dataOpacity':.75,
            'colors': ["#7FBF7B", "#AF8DC3", "#1F78B4"],
            'backgroundColor': 'transparent',
            'height':300
        };
        if(max == 1) {
            options['hAxis']['gridlines'] = {count:"2"}
        }

        var chart = new google.visualization.BarChart(document.getElementById('mutant_experiment_chart'));

        // The select handler. Call the chart's getSelection() method
        function barSelectHandler() {
            var selectedItem = chart.getSelection()[0];
            if (selectedItem) {
                var mutant_type = overview_data['mutant_types'][selectedItem.row];
                var experiment_type = overview_data['experiment_types'][selectedItem.column]
                var phenotype_table = $($.fn.dataTable.fnTables(true)).dataTable();
                phenotype_table.fnFilter( mutant_type + ' ' + experiment_type );
                window.location.hash = "";
                window.location.hash = "phenotype";
            }
        }

        // Listen for the 'select' event, and call my function selectHandler() when
        // the user selects something on the chart.
        google.visualization.events.addListener(chart, 'select', barSelectHandler);

        chart.draw(data, options);
    }

    if(overview_data['strain_list'].length > 0) {
        //Strain Chart
        var strain_all_data = [['Strain', label]];
        //Prepare Data
        var max = 0;
        for(var j=0; j < overview_data['strain_list'].length; j++) {
            var strain = overview_data['strain_list'][j];
            var new_row = [strain, parseInt(overview_data['strain_to_count'][strain])];
            strain_all_data.push(new_row);
            max = Math.max(max, overview_data['strain_to_count'][strain]);
        };

        var strain_data = google.visualization.arrayToDataTable(strain_all_data);
        var strain_options = {
            'legend': {'position': 'none'},
            'title': label + ' in different strain backgrounds',
            'vAxis': {title: '# of ' + label, minValue: 0},
            'hAxis': {title: 'Strain'},
            'dataOpacity':.75,
            'colors': ["#1F78B4"],
            'chartArea': {left:50,top:50,width:"80%",height:"50%"},
            'backgroundColor': 'transparent',
            'height':300
        };
        if(max == 1) {
            strain_options['vAxis']['gridlines'] = {count:"3"}
        }

        var strain_chart = new google.visualization.ColumnChart(document.getElementById('strain_chart'));

        // The select handler. Call the chart's getSelection() method
        function selectHandler() {
            var selectedItem = strain_chart.getSelection()[0];
            if (selectedItem) {
                //var value = strain_data.getValue(selectedItem.row, selectedItem.column);
                var strain = overview_data['strain_list'][selectedItem.row];
                var phenotype_table = $($.fn.dataTable.fnTables(true)).dataTable();
                phenotype_table.fnFilter( strain );
                window.location.hash = "";
                window.location.hash = "phenotype";
            }
        }

        // Listen for the 'select' event, and call my function selectHandler() when
        // the user selects something on the chart.
        google.visualization.events.addListener(strain_chart, 'select', selectHandler);

        strain_chart.draw(strain_data, strain_options);
    }

    if(overview_data['mutant_types'].length == 0 && overview_data['strain_list'].length == 0) {
        $("#summary_wrapper").hide()
    }
}