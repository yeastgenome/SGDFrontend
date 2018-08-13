
$(document).ready(function() {

    $.getJSON('/backend/complex/' + complex['complex_accession'], function(data) {

        var complex_table = create_complex_table(data);

        if(data != null && data["graph"]["nodes"].length > 1) {
            var _categoryColors = {
                'protein': '#1f77b4',
                'small molecule': '#1A9E77',
                'sub-complex': '#E6AB03',
                'small molecule': '#17becf',
                'other subunit': '#ffbb78'
            };
            views.network.render(data["graph"], _categoryColors, "j-complex");
        } else {                                                                                                   
            hide_section("diagram");                                                                              
        } 
        
        if (data != null && data["network_graph"]["nodes"].length > 1) {
            var _categoryColors = {
                'protein': '#1f77b4',
                'small molecule': '#1A9E77',
                'sub-complex': '#E6AB03',
                'small molecule': '#17becf',
                'other subunit': '#ffbb78'
            };
            views.network.render(data["network_graph"], _categoryColors, "j-complex-network");            
        } else {
            hide_section("network");
        }
    });

});

function create_complex_table(data) {
    var evidence = data['subunit'];
    var datatable = [];
    var subunits = {};
    for (var i = 0; i < evidence.length; i++) {
        datatable.push(complex_subunit_data_to_table(evidence[i]));
        subunits[evidence[i]["display_name"]] = true;
    }

    set_up_header(
        "complex_table",
        datatable.length,
        "entry",
        "entries",
        Object.keys(subunits).length,
        "subunit",
        "subunits"
    );

    var options = {};
    options["bPaginate"] = false;
    options["bDestroy"] = true;
    options["aoColumns"] = [
        null,
        null,
        null
    ];
    options["aaData"] = datatable;
    options["oLanguage"] = {
        sEmptyTable: "No subunits for this complex???."
    };

  return create_table("complex_table", options);
}
