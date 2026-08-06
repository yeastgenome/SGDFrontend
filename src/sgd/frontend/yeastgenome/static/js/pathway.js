/* Pathway page: load GO Term Finder enrichment for the pathway's genes
   client-side (it's a slow external call) and render it into the GO Enrichment
   section. Reads the pathway id from the embedded `pathway` blob. */
$(document).ready(function () {
    if (typeof pathway === 'undefined' || !pathway || !pathway.biocyc_id) { return; }
    var target = document.getElementById('go_enrichment_target');
    if (!target) { return; }

    function escapeHtml(s) { return $('<div>').text(s == null ? '' : s).html(); }

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
                '<td>' + escapeHtml(String(row.match_count)) + '</td>' +
                '<td class="go-pvalue">' + escapeHtml(String(row.pvalue)) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        target.innerHTML = html;
    }).fail(function () {
        $(target).html('<p>GO enrichment is temporarily unavailable.</p>');
    });
});
