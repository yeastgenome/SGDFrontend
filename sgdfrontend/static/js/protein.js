google.load("visualization", "1", {packages:["corechart"]});

$(document).ready(function() {

    $.getJSON(protein_domains_link, function(data) {
        var domain_table = create_domain_table(data);
        if(domain_table != null) {
            create_download_button("domains_table_download", domain_table, download_table_link, domains_table_filename);
            draw_domain_chart("domain_chart", data);
        }
	});

    //Hack because footer overlaps - need to fix this.
	add_footer_space("resources");
});

function create_domain_table(data) {
    var domain_table = null;
    if(data != null && data.length > 0) {
	    var datatable = [];

        for (var i=0; i < data.length; i++) {
            datatable.push(domain_data_to_table(data[i]));
        }

        $("#domains_header").html(data.length);

        set_up_range_sort();

        var options = {};
        options["bPaginate"] = false;
        options["aaSorting"] = [[2, "asc"]];
        options["aoColumns"] = [{"bSearchable":false, "bVisible":false}, {"bSearchable":false, "bVisible":false}, { "sType": "range" }, { "sType": "html" }, null, null]
        options["aaData"] = datatable;

        domain_table = create_table("domains_table", options);
	}
	return domain_table;
}

function draw_domain_chart(chart_id, data) {
    var container = document.getElementById(chart_id);

    var chart = new google.visualization.Timeline(container);

    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Domain' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'number', id: 'Start' });
    dataTable.addColumn({ type: 'number', id: 'End' });

    var data_array = [];
    for (var i=0; i < data.length; i++) {
        data_array.push([data[i]['domain']['display_name'], data[i]['domain']['display_name'], data[i]['start'], data[i]['end']]);
    }
    dataTable.addRows(data_array);

    var options = {
        'height': 47*data.length,
        'timeline': {'showRowLabels': false},
    };
    chart.draw(dataTable, options);
}