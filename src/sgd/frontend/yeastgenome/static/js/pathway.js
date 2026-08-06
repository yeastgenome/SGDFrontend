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
            return '<a href="' + escapeHtml(g.link) + '" class="gene_name">' +
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
});
