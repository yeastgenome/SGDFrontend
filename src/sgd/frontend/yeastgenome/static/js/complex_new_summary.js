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

    // --- Shared Annotations: ranked list (default) + network on demand ---
    if (data["network_graph"] && data["network_graph"]["edges"].length > 0) {
        render_shared_list(data);

        var networkRendered = false;
        $("input[name='shared_view']").change(function() {
            if ($(this).val() === "network") {
                $("#j-shared-list").hide();
                $("#j-complex-network-wrap").show();
                if (!networkRendered) {
                    networkRendered = true;
                    var colors = {
                        'FOCUS': 'black',
                        'GO': '#2ca02c',
                        'subunit': '#1f77b4',
                        'complex': '#E6AB03'
                    };
                    var filters = {
                        ' All': function(d) { return true; },
                        ' GO Terms': function(d) {
                            return ['FOCUS', 'GO', 'complex'].includes(d.category);
                        },
                        ' Subunits': function(d) {
                            return ['FOCUS', 'subunit', 'complex'].includes(d.category);
                        }
                    };
                    views.network.render(data["network_graph"], colors, "j-complex-network", filters, true);
                }
            } else {
                $("#j-complex-network-wrap").hide();
                $("#j-shared-list").show();
            }
        });
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

    var html = "";
    html += '<h3 class="shared-subhead">Shared GO terms <small>(' + goRows.length + ')</small></h3>';
    html += build_rank_table(["GO term", "Aspect", "Shared with", "Evidence"], goRows.map(function(r) {
        return [
            make_link(r.href, r.name),
            escape_html(r.aspect),
            '<span class="rank-count">' + r.count + '</span> complex' + (r.count === 1 ? '' : 'es'),
            r.ev ? escape_html(r.ev) : '&mdash;'
        ];
    }));

    html += '<h3 class="shared-subhead">Related complexes <small>(' + cxRows.length + ')</small></h3>';
    html += build_rank_table(["Complex", "Shared GO terms", "Shared subunits"], cxRows.map(function(r) {
        return [
            make_link(r.href, r.name),
            '<span class="rank-count">' + r.sharedGo + '</span>',
            r.sharedSub > 0 ? '<span class="rank-count">' + r.sharedSub + '</span>' : '&mdash;'
        ];
    }));

    $("#j-shared-list").html(html);
}

function build_rank_table(headers, rows) {
    var h = '<table class="shared-rank"><thead><tr>';
    headers.forEach(function(x) { h += '<th>' + x + '</th>'; });
    h += '</tr></thead><tbody>';
    if (rows.length === 0) {
        h += '<tr><td class="rank-empty" colspan="' + headers.length + '">None</td></tr>';
    }
    rows.forEach(function(cells) {
        h += '<tr>';
        cells.forEach(function(c) { h += '<td>' + c + '</td>'; });
        h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
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
