
google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawChart);

function drawChart() {
    var experiment_type_data = [['Experiment Type', '# of Annotations']];
    for (var key in overview_json['experiment']) {
        experiment_type_data.push([key, overview_json['experiment'][key]]);
    }
    var experiment_type_graph_options = {
        'title': 'Experiment Type',
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:0,top:20,width:"80%",height:"80%"},
    };
    new google.visualization.PieChart(document.getElementById('experiment_type_diagram')).draw(google.visualization.arrayToDataTable(experiment_type_data), experiment_type_graph_options);

    var mutant_type_data = [['Mutant Type', '# of Annotations']];
    for (var key in overview_json['mutant_type']) {
        mutant_type_data.push([key, overview_json['mutant_type'][key]]);
    }
    var mutant_type_graph_options = {
        'title': 'Mutant Type',
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:0,top:20,width:"80%",height:"80%"},
    };
    new google.visualization.PieChart(document.getElementById('mutant_type_diagram')).draw(google.visualization.arrayToDataTable(mutant_type_data), mutant_type_graph_options);

    var strain_data = [['Strain', '# of Annotations']];
    for (var key in overview_json['strain']) {
        var slice_size = overview_json['strain'][key]
        strain_data.push([key, slice_size]);
    }
    var strain_graph_options = {
        'title': 'Strain',
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:0,top:20,width:"80%",height:"80%"},
    };
    new google.visualization.PieChart(document.getElementById('strain_diagram')).draw(google.visualization.arrayToDataTable(strain_data), strain_graph_options);

    var over_time_data = [['Year', '# of Annotations']];
    for (var i=2007; i < 2015; i++) {
        over_time_data.push([i.toString(), overview_json['over_time'][i]]);
    }
    var over_time_graph_options = {
        'title': '# of Annotations',
        'hAxis': {title: 'Year'},
        'vAxis': {title: '# of Annotations'},
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:80,top:20,width:"100%",height:"66%"},
    };
    var over_time_chart = new google.visualization.ColumnChart(document.getElementById('over_time_diagram')).draw(google.visualization.arrayToDataTable(over_time_data), over_time_graph_options);

    var phenotype_histogram_data = [['# of Annotations', '# of Genes']];
    for (var key in overview_json['phenotype_histogram']) {
        phenotype_histogram_data.push([key, overview_json['phenotype_histogram'][key]]);
    }
    var phenotype_histogram_graph_options = {
        'title': '# of Genes per Phenotype',
        'hAxis': {title: '# of Annotations'},
        'vAxis': {title: '# of Phenotypes'},
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:60,top:20,width:"100%",height:"66%"},
    };
    var phenotype_histogram_chart = new google.visualization.ColumnChart(document.getElementById('phenotype_histogram_diagram')).draw(google.visualization.arrayToDataTable(phenotype_histogram_data), phenotype_histogram_graph_options);

    var gene_histogram_data = [['# of Annotations', '# of Genes']];
    for (var key in overview_json['gene_histogram']) {
        gene_histogram_data.push([key, overview_json['gene_histogram'][key]]);
    }
    var gene_histogram_graph_options = {
        'title': '# of Phenotypes per Gene',
        'hAxis': {title: '# of Annotations'},
        'vAxis': {title: '# of Genes'},
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:60,top:20,width:"100%",height:"66%"},
    };
    var gene_histogram_chart = new google.visualization.ColumnChart(document.getElementById('gene_histogram_diagram')).draw(google.visualization.arrayToDataTable(gene_histogram_data), gene_histogram_graph_options);
}

//Hack because footer overlaps - need to fix this.
add_footer_space("download");