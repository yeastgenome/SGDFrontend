
$(document).ready(function() {

    var data = (typeof recent_allele_data !== 'undefined' && recent_allele_data) ? recent_allele_data : [];

    if (typeof recent_allele_dates !== 'undefined' && recent_allele_dates) {
        $("#recent_allele_dates").html(recent_allele_dates.start + ' to ' + recent_allele_dates.end);
    }

    var datatable = [];
    for (var i = 0; i < data.length; i++) {
        datatable.push(allele_data_to_table(data[i]));
    }

    set_up_header('recent_allele_table', datatable.length, 'allele', 'alleles', null);

    var options = {};
    options["bPaginate"] = true;
    options["aaSorting"] = [[0, "asc"]];
    options["aoColumns"] = [
        null,   // 0 Allele
        null,   // 1 Type
        null    // 2 Description
    ];
    options["oLanguage"] = {"sEmptyTable": "No alleles added recently."};
    options["aaData"] = datatable;

    create_table("recent_allele_table", options);
    $("#recent_allele_table_buttons").hide();
});

// Allele pages resolve by SGDID with the 'SGD:' prefix (e.g.
// /allele/SGD:S000382563); the backend's raw link (/allele/S000382563) 404s,
// so build the link from the sgdid and add the prefix.
function allele_link(allele) {
    var sgdid = allele['sgdid'];
    if (sgdid) {
        var id = sgdid.indexOf('SGD:') === 0 ? sgdid : 'SGD:' + sgdid;
        return '/allele/' + id;
    }
    return allele['link'] || '';
}

function allele_data_to_table(allele) {
    var name = allele['display_name'] || '';
    var link = allele_link(allele);
    var name_cell = link ? '<a href="' + link + '">' + name + '</a>' : name;
    var type_cell = allele['allele_type'] || '';
    var desc_cell = allele['description'] || '';
    return [name_cell, type_cell, desc_cell];
}
