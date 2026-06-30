// Functional Networks section on the Locus Summary Page (LSP).
//
// Two independent components:
//   1. Shared Annotations -- replicates the GO "Shared Annotations" network that
//      already appears on the GO details tab (see go_details.js). The cytoscape
//      style/layout below are copied from go_details.js so the LSP rendering
//      matches the GO tab exactly.
//   2. GO-CAMs -- embeds the GO Consortium <go-gocam-viewer> web component
//      (https://geneontology.github.io/web-components/), driven by the GO API
//      from a model id. When a gene has more than one model a pull-down selects
//      between them.
//
// Display logic (per spec): show the section if either component has data; hide
// the whole section only when the gene has neither.

var fn_graph_style = cytoscape.stylesheet()
    .selector('node')
    .css({
        'content': 'data(name)',
        'font-family': 'helvetica',
        'font-size': 14,
        'text-outline-width': 3,
        'text-outline-color': '#888',
        'text-valign': 'center',
        'color': '#fff',
        'width': 30,
        'height': 30,
        'border-color': '#fff'
    })
    .selector('edge')
    .css({
        'width': 1.5,
        // Curved, light, semi-transparent edges so the dense web recedes
        // behind the nodes/labels instead of reading as a hairball.
        'curve-style': 'bezier',
        'line-color': '#c8c8c8',
        'opacity': 0.5
    })
    .selector("node[category='FOCUS']")
    .css({
        'background-color': "#fade71",
        'text-outline-color': '#fff',
        'text-outline-width': 4,
        'color': '#888'
    })
    .selector("node[type='GO']")
    .css({
        'shape': 'rectangle',
        'text-outline-color': '#fff',
        // Stronger white halo so the long GO term labels stay legible where
        // they cross edges in the center of the graph.
        'text-outline-width': 4,
        'color': '#888',
        'background-color': "#7FBF7B"
    });

var fn_layout = {
    "name": "arbor",
    "liveUpdate": true,
    "ungrabifyWhileSimulating": true,
    // Stronger repulsion (arbor default is 400) spreads the nodes apart so the
    // shared-annotation network is less of a clumped hairball.
    "repulsion": 1200,
    "nodeMass": function(data) {
        if (data.sub_type == 'FOCUS') {
            return 10;
        }
        else {
            return 1;
        }
    }
};

function fn_slider_filter(new_cutoff) {
    return "node[gene_count >= " + new_cutoff + "], edge";
}

function fn_render_gocams(models) {
    var $select = $("#fn_gocam_select");
    var $viewer = $("#fn_gocam_viewer");
    var $link = $("#fn_gocam_link");

    var show_model = function(model) {
        // <go-gocam-viewer> zoom-to-fits the graph on its first render, but it
        // does not re-fit when gocam-id changes in place -- so switching to a
        // larger model via the dropdown leaves the viewport zoomed/panned for
        // the previous (smaller) model. Replace the element with a fresh one
        // carrying the new gocam-id so every model gets the same first-render
        // fit (matching the AmiGO display).
        var $fresh = $("<go-gocam-viewer>")
            .attr({
                "id": "fn_gocam_viewer",
                "show-legend": "true",
                "gocam-id": model.model_id
            })
            .css({ "display": "block", "width": "100%" });
        $viewer.replaceWith($fresh);
        $viewer = $fresh;
        $link.attr("href", model.gocam_url);
    };

    if (models.length > 1) {
        $select.empty();
        for (var i = 0; i < models.length; i++) {
            $select.append($("<option>").val(i).text(models[i].title));
        }
        $select.off("change").on("change", function() {
            show_model(models[parseInt($(this).val(), 10)]);
        });
        $("#fn_gocam_select_wrap").show();
    }
    else {
        $("#fn_gocam_select_wrap").hide();
    }

    show_model(models[0]);
}

$(document).ready(function() {
    var locusId = bootstrappedData.locusId;
    var displayName = bootstrappedData.displayName;
    var locusLink = bootstrappedData.locusLink;

    var shared_done = false;
    var gocam_done = false;
    var has_shared = false;
    var has_gocam = false;

    var finalize = function() {
        if (!shared_done || !gocam_done) {
            return;
        }
        if (has_shared || has_gocam) {
            $("#functional_networks").show();
        }
    };

    // 1. Shared Annotations network -- same data source and rendering as the GO tab.
    $.getJSON('/redirect_backend?param=locus/' + locusId + '/go_graph', function(data) {
        if (data && data['nodes'] && data['nodes'].length > 1) {
            has_shared = true;

            // Show the section and the graph container BEFORE building the
            // cytoscape vis. create_cytoscape_vis() measures #cy's width, sizes
            // the legend canvas, and reserves the clearance below the graph
            // (height + offset + legendOffset) that keeps the slider from
            // overlapping the on-canvas legend. Those reads only work when the
            // container is visible -- if the graph is built while these divs are
            // still display:none, the slider ends up drawn on top of the legend.
            $("#functional_networks").show();
            $("#fn_shared_annotations").show();

            var analyze_genes = [];
            for (var i = 0; i < data["nodes"].length; i++) {
                if (data["nodes"][i]["data"]["type"] === 'BIOENTITY') {
                    analyze_genes.push(data["nodes"][i]["data"]["dbentity_id"].toString());
                }
            }
            create_analyze_button_with_list(
                "cy_shared_go_gene_analyze",
                analyze_genes,
                "<a href='" + locusLink + "' class='gene_name'>" + displayName + "</a> Shared GO Annotations",
                true
            );

            var graph = create_cytoscape_vis("cy", fn_layout, fn_graph_style, data, null, false, "go");
            // Default the slider one notch above the usual floor so fewer edges
            // show initially; users can drag it down to reveal the full network.
            var fn_default_cutoff = Math.min(data['max_cutoff'], Math.max(3, data['min_cutoff']) + 1);
            create_slider("slider", graph, data['min_cutoff'], data['max_cutoff'], fn_slider_filter, data['max_cutoff'] + 1, fn_default_cutoff);
            create_cy_download_button(graph, "cy_download", displayName + '_go_graph');
        }
        else {
            $("#fn_shared_annotations").hide();
        }
        shared_done = true;
        finalize();
    }).fail(function() {
        shared_done = true;
        finalize();
    });

    // 2. GO-CAMs -- embedded GO web component, driven by the model id(s) for this locus.
    $.getJSON('/redirect_backend?param=locus/' + locusId + '/go_cams', function(models) {
        if (models && models.length > 0) {
            has_gocam = true;
            // Show the container before rendering so the viewer connects at its
            // full width (same reason as the Shared Annotations graph above).
            $("#functional_networks").show();
            $("#fn_gocams").show();
            fn_render_gocams(models);
        }
        else {
            $("#fn_gocams").hide();
        }
        gocam_done = true;
        finalize();
    }).fail(function() {
        gocam_done = true;
        finalize();
    });
});
