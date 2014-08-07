
$(document).ready(function() {

  	$.getJSON(expression_details_link, function(data) {
  	    var expression_table = create_expression_table(data);
        create_download_button("datasetcolumn_table_download", expression_table, download_table_link, download_table_filename);
        create_analyze_button("datasetcolumn_table_analyze", expression_table, analyze_link, analyze_filename, true);
        create_histogram_chart(data);
  	});

});

function create_expression_table(data) {
    var options = {
        'bPaginate': true,
        'aaSorting': [[2, "asc"]],
        'aoColumns': [
            {"bSearchable":false, "bVisible":false}, //Evidence ID
            {"bSearchable":false, "bVisible":false}, //Analyze ID
            null, //Gene
            {"bSearchable":false, "bVisible":false}, //Gene Systematic Name
            {"bSearchable":false, "bVisible":false}, //Condition
            {"bSearchable":false, "bVisible":false}, //Dataset
            null //Value
        ]
    };
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var genes = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(expression_data_to_table(data[i]));
            genes[data[i]['locus']['id']] = true;
        }

        set_up_header('datasetcolumn_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');

        options["oLanguage"] = {"sEmptyTable": "No expression data for " + display_name};
        options["aaData"] = datatable;
    }

    return create_table("datasetcolumn_table", options);
}

/**
 * Created by kpaskov on 6/11/14.
 */

google.load("visualization", "1", {packages:["corechart"]});
function create_histogram_chart(all_data) {
    if(all_data != null) {
        var datatable2 = [['Name', 'Number']];

        for(var i=0; i < all_data.length; i++) {
            datatable2.push([all_data[i]['locus']['display_name'], parseFloat(all_data[i]['value'])]);
        }

        var chart = new google.visualization.Histogram(document.getElementById('two_channel_expression_chart'));
        chart.draw(google.visualization.arrayToDataTable(datatable2), {
                                    legend: { position: 'none' },
                                    hAxis: {title: 'log2 ratio'},
                                    vAxis: {title: 'Number of Genes'},
                                    height: 300,
                                    colors: ['#ff9d3b'],
                                    isStacked: true
                                });
    }
}