/* Pathway page: load GO Term Finder enrichment for the pathway's genes
   client-side (it's a slow external call) and render it into the GO Enrichment
   section. Reads the pathway id from the embedded `pathway` blob. */
$(document).ready(function () {
    if (typeof pathway === 'undefined' || !pathway || !pathway.biocyc_id) { return; }
    var target = document.getElementById('go_enrichment_target');
    if (!target) { return; }

    function escapeHtml(s) { return $('<div>').text(s == null ? '' : s).html(); }

    // p-values span many orders of magnitude (e.g. 4.8e-16 to 8e-3), so show
    // them in scientific notation with a 2-decimal mantissa.
    function formatPvalue(v) {
        var n = Number(v);
        return isNaN(n) ? String(v) : n.toExponential(2);
    }

    // Render a term's annotated genes as comma-separated Locus links. Falls
    // back to the plain match count if the gene list is unavailable.
    function renderGenes(row) {
        var genes = row.genes;
        if (!genes || !genes.length) { return escapeHtml(String(row.match_count)); }
        return genes.map(function (g) {
            return '<a href="' + escapeHtml(g.link) + '">' +
                escapeHtml(g.display_name) + '</a>';
        }).join(', ');
    }

    $.getJSON('/redirect_backend?param=pathway/' + encodeURIComponent(pathway.biocyc_id) + '/go_enrichment', function (data) {
        if (!data || !data.length) {
            $(target).html('<p>No significant GO enrichment found for the genes in this pathway.</p>');
            return;
        }
        var html = '<table class="go-enrichment-table"><thead><tr>' +
            '<th>GO Term (Biological Process)</th><th>Genes</th><th>p-value</th>' +
            '</tr></thead><tbody>';
        data.forEach(function (row) {
            var go = row.go || {};
            html += '<tr>' +
                '<td><a href="' + escapeHtml(go.link) + '">' + escapeHtml(go.display_name) + '</a></td>' +
                '<td class="go-genes">' + renderGenes(row) + '</td>' +
                '<td class="go-pvalue">' + escapeHtml(formatPvalue(row.pvalue)) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        target.innerHTML = html;
    }).fail(function () {
        $(target).html('<p>GO enrichment is temporarily unavailable.</p>');
    });

    // GO-CAMs: pathway models involving the genes in this pathway. A gene can
    // appear in more than one model, so the backend aggregates + dedupes across
    // the pathway's genes and flags this pathway's own model as the default.
    function renderGocams(models) {
        var $select = $('#pw_gocam_select');
        var $viewer = $('#pw_gocam_viewer');
        var $link = $('#pw_gocam_link');
        var $title = $('#pw_gocam_title');

        var showModel = function (model) {
            // <go-gocam-viewer> zoom-to-fits only on first render and won't
            // re-fit when gocam-id changes in place, so replace the element with
            // a fresh one per selection (matches the gene/complex pages).
            var $fresh = $('<go-gocam-viewer>')
                .attr({ 'id': 'pw_gocam_viewer', 'show-legend': 'true', 'gocam-id': model.model_id })
                .css({ 'display': 'block', 'width': '100%' });
            $viewer.replaceWith($fresh);
            $viewer = $fresh;
            $title.text(model.title);
            $link.attr('href', model.gocam_url);
        };

        // Default to this pathway's own model (flagged by the backend), else the first.
        var defaultIndex = 0;
        for (var i = 0; i < models.length; i++) {
            if (models[i].default) { defaultIndex = i; break; }
        }

        if (models.length > 1) {
            $select.empty();
            for (var j = 0; j < models.length; j++) {
                $select.append($('<option>').val(j).text(models[j].title));
            }
            $select.off('change').on('change', function () {
                showModel(models[parseInt($(this).val(), 10)]);
            });
            $select.val(defaultIndex);
            $('#pw_gocam_select_wrap').show();
        } else {
            $('#pw_gocam_select_wrap').hide();
        }

        showModel(models[defaultIndex]);
    }

    if (document.getElementById('pw_gocams')) {
        $.getJSON('/redirect_backend?param=pathway/' + encodeURIComponent(pathway.biocyc_id) + '/go_cams', function (models) {
            if (models && models.length) {
                $('#pw_gocam_loading').hide();
                $('#pw_gocams').show();
                renderGocams(models);
            } else {
                $('#pw_gocam_loading').html('No GO-CAMs found for the genes in this pathway.');
            }
        }).fail(function () {
            $('#pw_gocam_loading').html('GO-CAMs are temporarily unavailable.');
        });
    }

    // Pathway network: pathway -> genes -> GO -> phenotype, drawn with the
    // shared cytoscape helper. GO/phenotype nodes carry a gene_count so the
    // slider can thin them; the genes and pathway node always stay visible.
    function pwNetworkStyle() {
        return cytoscape.stylesheet()
            .selector('node').css({
                'content': 'data(name)', 'font-family': 'helvetica', 'font-size': 14,
                'text-outline-width': 3, 'text-outline-color': '#888', 'text-valign': 'center',
                'color': '#fff', 'width': 30, 'height': 30,
                'background-color': '#9aa0a6', 'border-color': '#fff'
            })
            .selector('edge').css({
                'width': 1.5, 'curve-style': 'bezier', 'line-color': '#c8c8c8', 'opacity': 0.5
            })
            .selector("node[category='FOCUS']").css({
                'background-color': '#fade71', 'shape': 'roundrectangle',
                'text-outline-color': '#fff', 'text-outline-width': 4, 'color': '#888'
            })
            .selector("node[type='GO']").css({
                'shape': 'rectangle', 'background-color': '#7FBF7B',
                'text-outline-color': '#fff', 'text-outline-width': 4, 'color': '#888'
            })
            .selector("node[type='PHENOTYPE']").css({
                'shape': 'rectangle', 'background-color': '#C591F5',
                'text-outline-color': '#fff', 'text-outline-width': 4, 'color': '#888'
            });
    }

    var pwNetworkLayout = {
        'name': 'arbor', 'liveUpdate': true, 'ungrabifyWhileSimulating': true,
        'repulsion': 1200,
        'nodeMass': function (data) { return data.category === 'FOCUS' ? 10 : 1; }
    };

    // Keep genes + the pathway node always; filter GO/phenotype by gene_count.
    function pwNetworkSliderFilter(cutoff) {
        return "node[type='GENE'], node[category='FOCUS'], node[gene_count >= " + cutoff + "], edge";
    }

    if (document.getElementById('pw_network_cy')) {
        $.getJSON('/redirect_backend?param=pathway/' + encodeURIComponent(pathway.biocyc_id) + '/network_graph', function (data) {
            if (data && data.nodes && data.nodes.length > 1) {
                $('#pw_network_loading').hide();
                $('#pw_network_wrap').show();
                var graph = create_cytoscape_vis('pw_network_cy', pwNetworkLayout, pwNetworkStyle(), data, null, false, 'go');
                // Start the slider so only GO/phenotype terms shared by >= 2 genes
                // show initially (cleaner); users can drag to 1 for the full set.
                var defaultCutoff = Math.min(data.max_cutoff, Math.max(data.min_cutoff, 2));
                create_slider('pw_network_slider', graph, data.min_cutoff, data.max_cutoff, pwNetworkSliderFilter, data.max_cutoff + 1, defaultCutoff);
            } else {
                $('#pw_network_loading').html('No network data available for this pathway.');
            }
        }).fail(function () {
            $('#pw_network_loading').html('Network is temporarily unavailable.');
        });
    }
});
