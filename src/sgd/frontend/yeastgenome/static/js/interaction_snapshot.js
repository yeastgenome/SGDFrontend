
google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawChart);

function drawChart() {
    var interaction_type_data = [['Interaction Type', '# of Annotations']];
    for (var key in overview_json['interaction_type']) {
        interaction_type_data.push([key, overview_json['interaction_type'][key]]);
    }
    var interaction_type_data_table = google.visualization.arrayToDataTable(interaction_type_data);

    var interaction_type_graph_options = {
        'title': 'Interaction Type',
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:0,top:20,width:"80%",height:"80%"},
    };

    var interaction_type_chart = new google.visualization.PieChart(document.getElementById('interaction_type_diagram'));
    interaction_type_chart.draw(interaction_type_data_table, interaction_type_graph_options);

    var annotation_type_data = [['Annotation Type', '# of Annotations']];
    for (var key in overview_json['annotation_type']) {
        annotation_type_data.push([key, overview_json['annotation_type'][key]]);
    }
    var annotation_type_data_table = google.visualization.arrayToDataTable(annotation_type_data);

    var annotation_type_graph_options = {
        'title': 'Annotation Type',
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:0,top:20,width:"80%",height:"80%"},
    };

    var annotation_type_chart = new google.visualization.PieChart(document.getElementById('annotation_type_diagram'));
    annotation_type_chart.draw(annotation_type_data_table, annotation_type_graph_options);

    var modification_data = [['Modification', '# of Annotations']];
    for (var key in overview_json['modification']) {
        var slice_size;
        if(key == 'No Modification') {
            slice_size = overview_json['modification'][key] - overview_json['interaction_type']['Genetic'];
        }
        else {
            slice_size = overview_json['modification'][key]
        }
        modification_data.push([key, slice_size]);
    }
    var modification_data_table = google.visualization.arrayToDataTable(modification_data);

    var modification_graph_options = {
        'title': 'Modification',
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:0,top:20,width:"80%",height:"80%"},
    };

    var modification_chart = new google.visualization.PieChart(document.getElementById('modification_diagram'));
    modification_chart.draw(modification_data_table, modification_graph_options);

    var annotation_histogram_data = [['# of Annotations', '# of Genes']];
    for (var key in overview_json['annotation_histogram']) {
        annotation_histogram_data.push([key, overview_json['annotation_histogram'][key]]);
    }
    var annotation_histogram_data_table = google.visualization.arrayToDataTable(annotation_histogram_data);

    var annotation_histogram_graph_options = {
        'title': '# of Annotations per Gene',
        'hAxis': {title: '# of Annotations'},
        'vAxis': {title: '# of Genes'},
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:40,top:20,width:"100%",height:"66%"},
    };

    var annotation_histogram_chart = new google.visualization.ColumnChart(document.getElementById('annotation_histogram_diagram'));
    annotation_histogram_chart.draw(annotation_histogram_data_table, annotation_histogram_graph_options);

    var interactor_histogram_data = [['# of Interactors', '# of Genes']];
    for (var key in overview_json['interaction_histogram']) {
        interactor_histogram_data.push([key, overview_json['interaction_histogram'][key]]);
    }
    var interactor_histogram_data_table = google.visualization.arrayToDataTable(interactor_histogram_data);

    var interactor_histogram_graph_options = {
        'title': '# of Interactors per Gene',
        'hAxis': {title: '# of Interactors'},
        'vAxis': {title: '# of Genes'},
        'pieSliceText': 'label',
        'legend': {'position': 'none'},
        'backgroundColor': 'transparent',
        'chartArea': {left:40,top:20,width:"100%",height:"66%"},
    };

    var interactor_histogram_chart = new google.visualization.ColumnChart(document.getElementById('interactor_histogram_diagram'));
    interactor_histogram_chart.draw(interactor_histogram_data_table, interactor_histogram_graph_options);
}

//Hack because footer overlaps - need to fix this.
add_footer_space("download");