// Complex "New Summary" experimental tab (redmine 6635).
//
// Reworks the two dense diagrams from the Summary tab into scannable views,
// using only the existing /complex/{id}/summary payload embedded as `complex`:
//   - Complex Diagram  -> grouped composition (one chip per subunit type with
//                         a xN stoichiometry badge) + "Expanded copies" toggle
//                         that falls back to the original interaction graph.
//   - Shared Annotations -> ranked relationship tables (shared GO terms, related
//                         complexes) + "Explore network" toggle that falls back
//                         to the original network graph.
// Helper fns create_complex_table/complex_subunit_data_to_table/set_up_header/
// create_table/create_analyze_button_with_list/hide_section come from
// local.js + evidence.js (loaded on the page).

$(document).ready(function() {

    // The summary-tab payload is already embedded in the page as `complex`
    // (complex_js), so read it directly instead of re-fetching over the network.
    var data = complex;

    // --- Subunits table (unchanged from Summary) ---
    var analyze_genes = [];
    create_complex_table(data, analyze_genes);
    create_analyze_button_with_list(
        "complex_subunit_gene_analyze",
        analyze_genes,
        "<a href='/complex/" + complex['complex_accession'] + "' class='gene_name'>" + complex['complex_accession'] + "</a> Complex Subunits",
        true
    );

    // --- Complex Diagram: grouped composition (default) ---
    render_composition(data);

    var expandedRendered = false;
    $("input[name='composition_view']").change(function() {
        if ($(this).val() === "expanded") {
            $("#j-complex-composition").hide();
            $("#j-complex").show();
            if (!expandedRendered) {
                expandedRendered = true;
                if (data["graph"] && data["graph"]["nodes"].length > 1) {
                    var colors = {
                        'protein': '#1f77b4',
                        'small molecule': '#7d0df3',
                        'subcomplex': '#E6AB03',
                        'other subunit': '#d62728'
                    };
                    views.network.render(data["graph"], colors, "j-complex");
                } else {
                    $("#j-complex").html("<p>No interaction diagram available.</p>");
                }
            }
        } else {
            $("#j-complex").hide();
            $("#j-complex-composition").show();
        }
    });

    // --- Gene Ontology: full annotation tables (one per aspect), replacing the
    // former bullet lists. Mirrors the Gene Ontology tab (complex_go.js). ---
    if (data["process"] && data["process"].length > 0) {
        var complex_bp_go_table = create_go_table("complex_bp", data["process"]);
        create_download_button("complex_bp_go_table_download", complex_bp_go_table, complex['complex_accession'] + "_complex_bp_go");
    }
    if (data["function"] && data["function"].length > 0) {
        var complex_mf_go_table = create_go_table("complex_mf", data["function"]);
        create_download_button("complex_mf_go_table_download", complex_mf_go_table, complex['complex_accession'] + "_complex_mf_go");
    }
    if (data["component"] && data["component"].length > 0) {
        var complex_cc_go_table = create_go_table("complex_cc", data["component"]);
        create_download_button("complex_cc_go_table_download", complex_cc_go_table, complex['complex_accession'] + "_complex_cc_go");
    }

    // --- Shared Biology: two subsections, both shown (Network, then Ranked list) ---
    if (data["network_graph"] && data["network_graph"]["edges"].length > 0) {
        // Network subsection
        var colors = {
            'FOCUS': 'black',
            'GO': '#2ca02c',
            'subunit': '#1f77b4',
            'complex': '#E6AB03'
        };
        // The Graph component defaults to Object.keys(filters)[0] and renders the
        // radios in this order, so Subunits is the preferred default (cleanest
        // view), then GO Terms, then the dense "All" hairball last. Some complexes
        // share no subunits with any other complex (all sharing is via GO terms);
        // for those the Subunits view would be empty and "All" is identical to
        // GO Terms, so drop both options and offer only GO Terms. Complexes with
        // shared subunits keep all three.
        var subunitsFilter = function(d) {
            return ['FOCUS', 'subunit', 'complex'].includes(d.category);
        };
        var goTermsFilter = function(d) {
            return ['FOCUS', 'GO', 'complex'].includes(d.category);
        };
        var allFilter = function(d) { return true; };
        var hasSharedSubunits = data["network_graph"]["nodes"].some(function(n) {
            return n.category === 'subunit';
        });
        var filters = hasSharedSubunits ? {
            ' Subunits': subunitsFilter,
            ' GO Terms': goTermsFilter,
            ' All': allFilter
        } : {
            ' GO Terms': goTermsFilter
        };
        views.network.render(data["network_graph"], colors, "j-complex-network", filters, true);

        // Ranked list subsection
        render_shared_list(data);
    } else {
        hide_section("network");
    }

    // --- GO-CAMs subsection (unchanged from Summary) ---
    $.getJSON('/redirect_backend?param=complex/' + complex['complex_accession'] + '/go_cams', function(models) {
        if (models && models.length > 0) {
            $("#gocams_subsection").show();
            render_gocams(models);
        }
    });

});

// ---------------------------------------------------------------------------
// Complex Diagram -> grouped composition
// ---------------------------------------------------------------------------
function render_composition(data) {
    var colors = {
        'protein': '#1f77b4',
        'small molecule': '#7d0df3',
        'subcomplex': '#E6AB03',
        'other subunit': '#d62728'
    };

    // Category per subunit type, taken from the interaction graph nodes.
    var catByName = {};
    if (data["graph"] && data["graph"]["nodes"]) {
        var gnodes = data["graph"]["nodes"];
        for (var i = 0; i < gnodes.length; i++) {
            catByName[gnodes[i]["name"]] = gnodes[i]["category"];
        }
    }

    var subunits = data["subunit"] || [];
    var types = subunits.length;
    var copies = 0;
    for (var i = 0; i < subunits.length; i++) {
        copies += (subunits[i]["stoichiometry"] || 1);
    }

    var html = '<div class="composition-caption"><strong>' + types +
        '</strong> subunit type' + (types === 1 ? '' : 's') + ' · <strong>' + copies +
        '</strong> stated component copies</div>';

    html += '<div class="composition-legend">Type:';
    html += '<span class="dot" style="background:' + colors['protein'] + '"></span>protein';
    html += '<span class="dot" style="background:' + colors['small molecule'] + '"></span>small molecule';
    html += '<span class="dot" style="background:' + colors['subcomplex'] + '"></span>subcomplex';
    html += '<span class="dot" style="background:' + colors['other subunit'] + '"></span>other</div>';

    html += '<div class="composition-grid">';
    for (var i = 0; i < subunits.length; i++) {
        var s = subunits[i];
        var cat = catByName[s["display_name"]] || category_from_link(s["link"]);
        var color = colors[cat] || colors['other subunit'];
        var stoich = s["stoichiometry"] || 1;
        var badge = stoich > 1 ? '<span class="stoich">×' + stoich + '</span>' : '';
        html += '<span class="composition-chip" data-subunit="' + escape_html(s["display_name"]) +
            '" style="border-left-color:' + color + '" title="' + escape_html(s["description"] || '') + '">';
        html += '<a href="' + s["link"] + '">' + escape_html(s["display_name"]) + '</a>' + badge;
        html += '</span>';
    }
    html += '</div>';

    $("#j-complex-composition").html(html);

    // Click a chip (outside its link) -> highlight the matching Subunits row.
    $("#j-complex-composition .composition-chip").click(function(ev) {
        if (ev.target.tagName === 'A') { return; }
        var name = $(this).data("subunit");
        $("#j-complex-composition .composition-chip").removeClass("chip-selected");
        $(this).addClass("chip-selected");
        highlight_subunit_row(name);
    });
}

function category_from_link(link) {
    link = link || '';
    if (link.indexOf('/locus/') > -1) { return 'protein'; }
    if (link.indexOf('/complex/') > -1) { return 'subcomplex'; }
    if (link.indexOf('CHEBI') > -1 || link.indexOf('/chemical/') > -1) { return 'small molecule'; }
    return 'other subunit';
}

function highlight_subunit_row(name) {
    var $rows = $("#complex_table tbody tr");
    $rows.removeClass("row-highlight");
    var found = null;
    $rows.each(function() {
        if ($(this).find("td").first().text().trim() === name) { found = this; }
    });
    if (found) {
        $(found).addClass("row-highlight");
        found.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function() { $(found).removeClass("row-highlight"); }, 2500);
    }
}

// ---------------------------------------------------------------------------
// Shared Annotations -> ranked relationship tables
// ---------------------------------------------------------------------------
function render_shared_list(data) {
    var ng = data["network_graph"];
    var nodes = ng["nodes"];
    var edges = ng["edges"];

    var byId = {};
    for (var i = 0; i < nodes.length; i++) { byId[nodes[i]["id"]] = nodes[i]; }

    var focusId = null;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i]["category"] === "FOCUS") { focusId = nodes[i]["id"]; break; }
    }

    // undirected adjacency
    var adj = {};
    function add_adj(a, b) { (adj[a] = adj[a] || {})[b] = true; }
    for (var i = 0; i < edges.length; i++) {
        add_adj(edges[i]["source"], edges[i]["target"]);
        add_adj(edges[i]["target"], edges[i]["source"]);
    }
    function neighbors_of_cat(id, cat) {
        var out = [];
        var m = adj[id] || {};
        for (var k in m) { if (byId[k] && byId[k]["category"] === cat) { out.push(k); } }
        return out;
    }

    // Evidence code(s) + aspect per GO term, from this complex's own annotations.
    var evByGo = {}, aspectByGo = {};
    function collect_go(list, aspect) {
        (list || []).forEach(function(it) {
            if (it.go && it.go.display_name) {
                var nm = it.go.display_name;
                aspectByGo[nm] = aspect;
                if (it.experiment && it.experiment.display_name) {
                    (evByGo[nm] = evByGo[nm] || {})[it.experiment.display_name] = true;
                }
            }
        });
    }
    collect_go(data["function"], "Molecular Function");
    collect_go(data["process"], "Biological Process");
    collect_go(data["component"], "Cellular Component");

    // Shared GO terms: this complex's GO nodes, ranked by # other complexes sharing.
    var goRows = [];
    var focusGo = focusId != null ? neighbors_of_cat(focusId, "GO") : [];
    focusGo.forEach(function(goId) {
        var node = byId[goId];
        var complexes = neighbors_of_cat(goId, "complex");
        var ev = Object.keys(evByGo[node.name] || {}).join(", ");
        goRows.push({ name: node.name, href: node.href, aspect: aspectByGo[node.name] || "", count: complexes.length, ev: ev });
    });
    goRows.sort(function(a, b) { return b.count - a.count; });

    // Related complexes: ranked by shared GO terms + shared subunits with focus.
    var focusGoSet = {}; focusGo.forEach(function(g) { focusGoSet[g] = true; });
    var focusSub = focusId != null ? neighbors_of_cat(focusId, "subunit") : [];
    var focusSubSet = {}; focusSub.forEach(function(s) { focusSubSet[s] = true; });
    var cxRows = [];
    nodes.forEach(function(n) {
        if (n.category !== "complex") { return; }
        var goN = neighbors_of_cat(n.id, "GO").filter(function(g) { return focusGoSet[g]; });
        var subN = neighbors_of_cat(n.id, "subunit").filter(function(s) { return focusSubSet[s]; });
        var total = goN.length + subN.length;
        if (total > 0) {
            cxRows.push({ name: n.name, href: n.href, sharedGo: goN.length, sharedSub: subN.length, total: total });
        }
    });
    cxRows.sort(function(a, b) { return (b.total - a.total) || (b.sharedGo - a.sharedGo); });

    // Render both as DataTables (sortable/searchable/paginated), consistent with
    // the Subunits table. Numeric columns sort on the raw number and display a
    // dash for zero via mRender.
    var html = '';
    html += '<h3 class="shared-subhead">Shared GO terms <small>(' + goRows.length + ')</small></h3>';
    html += '<table class="table table-striped table-bordered table-condensed" id="shared_go_table"><thead><tr>' +
        '<th>GO term</th><th>Aspect</th><th>Shared with (complexes)</th><th>Evidence</th></tr></thead></table>';
    html += '<h3 class="shared-subhead">Related complexes <small>(' + cxRows.length + ')</small></h3>';
    html += '<table class="table table-striped table-bordered table-condensed" id="shared_complex_table"><thead><tr>' +
        '<th>Complex</th><th>Shared GO terms</th><th>Shared subunits</th></tr></thead></table>';
    $("#j-shared-list").html(html);

    // Plain integer cells (no mRender) so numeric columns auto-detect and sort
    // numerically -- matching the proven-working Subunits / GO-tab DataTables.
    create_table("shared_go_table", {
        "bPaginate": false,
        "aaSorting": [[2, "desc"]],
        "aoColumns": [ null, null, null, null ],
        "aaData": goRows.map(function(r) {
            return [ make_link(r.href, r.name), escape_html(r.aspect), r.count, (r.ev ? escape_html(r.ev) : "") ];
        })
    });

    create_table("shared_complex_table", {
        "bPaginate": true,
        "iDisplayLength": 10,
        "aaSorting": [[1, "desc"], [2, "desc"]],
        "aoColumns": [ null, null, null ],
        "aaData": cxRows.map(function(r) {
            return [ make_link(r.href, r.name), r.sharedGo, r.sharedSub ];
        })
    });
}

function make_link(href, text) {
    return '<a href="' + href + '">' + escape_html(text) + '</a>';
}

function escape_html(s) {
    return (s == null ? '' : String(s))
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Reused verbatim from complex.js (subunit table + GO-CAM viewer)
// ---------------------------------------------------------------------------
function create_complex_table(data, analyze_genes) {
    var evidence = data['subunit'];
    var datatable = [];
    var subunits = {};
    for (var i = 0; i < evidence.length; i++) {
        datatable.push(complex_subunit_data_to_table(evidence[i]));
        subunits[evidence[i]["display_name"]] = true;
	if (evidence[i]["link"].includes("/locus/") && evidence[i]["dbentity_id"] != null) {
	    analyze_genes.push(evidence[i]["dbentity_id"].toString());
	}
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
    options["bPaginate"] = true;
    options["iDisplayLength"] = 10;
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

function render_gocams(models) {
    var $viewer = $("#gocam_viewer");
    var $link = $("#gocam_link");
    var $select = $("#gocam_select");
    var $title = $("#gocam_title");

    var show_model = function(model) {
        var $fresh = $("<go-gocam-viewer>")
            .attr({
                "id": "gocam_viewer",
                "show-legend": "true",
                "gocam-id": model.model_id
            })
            .css({ "display": "block", "width": "100%" });
        $viewer.replaceWith($fresh);
        $viewer = $fresh;
        $title.text(model.title);
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
        $("#gocam_select_wrap").show();
    }
    else {
        $("#gocam_select_wrap").hide();
    }

    show_model(models[0]);
}

// ---------------------------------------------------------------------------
// Full GO annotation table (one aspect). Mirrors create_go_table() in
// complex_go.js so the New Summary tab shows the same tables as the Gene
// Ontology tab. The empty-set branch targets #<prefix>_go/_subsection ids that
// only exist on the GO tab, but it is unreachable here because callers guard on
// a non-empty data array.
// ---------------------------------------------------------------------------
function create_go_table(prefix, data) {
    var options = {};
    options["aoColumns"] = [
        {"bSearchable":false, "bVisible":false,"aTargets":[0],"mData":0},  // evidence_id
        {"bSearchable":false, "bVisible":false,"aTargets":[1],"mData":1},  // analyze_id
        {"bSearchable":false, "bVisible":false,"aTargets":[2],"mData":2},  // complex name
        {"bSearchable":false, "bVisible":false,"aTargets":[3],"mData":3},  // complex accession
        {"aTargets":[4],"mData":4},                                        // qualifier
        {"bSearchable":false, "bVisible":false,"aTargets":[5],"mData":5},  // gene ontology term id
        {"aTargets":[6],"mData":6},                                        // gene ontology term
        {"bSearchable":false, "bVisible":false,"aTargets":[7],"mData":7},  // aspect
        {"aTargets":[8],"mData":8},                                        // annotation_extension
        {"aTargets":[9],"mData":9},                                        // evidence
        {"bSearchable":false, "bVisible":false, "aTargets":[10],"mData":9}, // annotation type
        {"aTargets":[11],"mData":11},                                      // source
        {"aTargets":[12],"mData":12},                                      // assigned on
        {"aTargets":[13],"mData":13}                                       // reference
    ];
    options["bPaginate"] = true;
    options["aaSorting"] = [[5, "asc"]];
    if("Error" in data) {
        options["oLanguage"] = {"sEmptyTable": data["Error"]};
        options["aaData"] = [];
    }
    else {
        var datatable = [];
        var gos = {};
        for (var i=0; i < data.length; i++) {
            datatable.push(go_data_to_table(data[i], i));
            gos[data[i]['go']['id']] = true;
        }
        set_up_header(prefix + '_go_table', datatable.length, 'entry', 'entries', Object.keys(gos).length, 'Gene Ontology term', 'Gene Ontology terms');

        options["oLanguage"] = {"sEmptyTable": ''};
        options["aaData"] = datatable;

        if(Object.keys(gos).length == 0) {
            $("#" + prefix + "_go").hide();
            $("#" + prefix + "_subsection").hide();
        }
    }
    $("#" + prefix + "_go_table_analyze").hide();
    return create_table(prefix + "_go_table", options);
}
