google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawChart);
function drawChart() {
    var labels = overview_data['experiment_types'];
    labels.unshift('Mutant Type');
    var all_data = [labels];
    //Prepare Data
    for(var j=0; j < overview_data['mutant_types'].length; j++) {
        var mutant = overview_data['mutant_types'][j];
        var new_row = overview_data['mutant_to_count'][mutant];
        new_row.unshift(mutant);
        all_data.push(new_row);
    };

    var title;
    var hAxis;
    if(class_type == 'PHENOTYPE') {
        title = 'Genes by mutant type and experiment type';
        hAxis = '# of Genes';
    }
    else if(class_type == 'LOCUS') {
        title = 'Phenotypes by mutant type and experiment type';
        hAxis = '# of Phenotypes';
    }
    var data = google.visualization.arrayToDataTable(all_data);
    var options = {
        'legend': {'position': 'top', title: 'Experiment Type'},
        'title': title,
        'vAxis': {title: 'Mutant Type'},
        'hAxis': {title: hAxis},
        'chartArea': {left:110,top:50,width:"60%",height:"75%"},
        'dataOpacity':.75,
        'colors': ["#7FBF7B", "#AF8DC3", "#1F78B4"],
        'backgroundColor': 'transparent'
    };

    var chart = new google.visualization.BarChart(document.getElementById('mutant_experiment_chart'));
    chart.draw(data, options);

    //Strain Chart
    var strain_all_data = [['Strain', 'Phenotypes']];
    //Prepare Data
    for(var j=0; j < overview_data['strain_list'].length; j++) {
        var strain = overview_data['strain_list'][j];
        var new_row = [strain, overview_data['strain_to_count'][strain]];
        strain_all_data.push(new_row);
    };

    var strain_data = google.visualization.arrayToDataTable(strain_all_data);
    var strain_options = {
        'legend': {'position': 'none'},
        'title': 'Phenotypes in different strain backgrounds',
        'vAxis': {title: hAxis},
        'hAxis': {title: 'Strain'},
        'dataOpacity':.75,
        'colors': ["#1F78B4"],
        'chartArea': {left:50,top:50,width:"80%",height:"50%"},
        'backgroundColor': 'transparent'
    };

    var strain_chart = new google.visualization.ColumnChart(document.getElementById('strain_chart'));
    strain_chart.draw(strain_data, strain_options);
}