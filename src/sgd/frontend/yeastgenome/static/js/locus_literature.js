// "All Curated Literature" section on the Locus Summary Page: a yearly
// count bar chart plus the 10 most recent references, mirroring the
// chemical page's Reference Usage section (chemical2.js) with two
// deliberate differences: the list never expands beyond 10 (it can be
// very long), and "See all [count]" links out to the Literature tab
// instead of toggling inline.
//
// literature_details can exceed 1 MB for famous genes, so like the
// Analyze buttons (locus_summary_analyze.js) nothing is fetched up
// front: the payload loads when the section scrolls into view.

(function () {

    var locus = bootstrappedData.locusData;
    var TOP = 10;
    var HINT = 'Hover a bar for the yearly count';

    var el = document.getElementById('lsp-reftrend');
    var section = document.getElementById('literature');
    if (!el || !section) return;

    var loaded = false;

    function load() {
        if (loaded) return;
        loaded = true;
        $.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/literature_details', render)
            .fail(function () {
                el.innerHTML = '<p>Literature data is unavailable right now.</p>';
            });
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function escapeAttr(s) {
        return escapeHtml(s).replace(/"/g, '&quot;');
    }

    function render(data) {
        // distinct curated references across every literature_details
        // category, so the total matches the Literature tab's
        // literature_overview total_count
        var seen = {};
        var refs = [];
        Object.keys(data).forEach(function (topic) {
            (Array.isArray(data[topic]) ? data[topic] : []).forEach(function (r) {
                var key = r['pubmed_id'] || r['link'] || r['display_name'];
                if (!key || seen[key]) return;
                seen[key] = true;
                var m = /\((\d{4})\)/.exec(r['display_name'] || '');
                refs.push({
                    year: r['year'] || (m ? parseInt(m[1], 10) : null),
                    display_name: r['display_name'] || '',
                    citation: r['citation'] || r['display_name'] || '',
                    link: r['link'] || null,
                    pmid: r['pubmed_id'] || null
                });
            });
        });

        if (refs.length === 0) {
            el.innerHTML = '<p>No literature data available.</p>';
            return;
        }

        var byYear = {};
        refs.forEach(function (r) {
            if (r.year) byYear[r.year] = (byYear[r.year] || 0) + 1;
        });
        var years = Object.keys(byYear).map(Number).sort(function (a, b) { return a - b; });

        var head = '';
        if (years.length) {
            var minY = years[0], maxY = years[years.length - 1];
            var maxCount = 0;
            years.forEach(function (y) { if (byYear[y] > maxCount) maxCount = byYear[y]; });

            // Only label the first/last year and multiples of 5 so 4-digit
            // labels stay readable; every bar reports year/count on hover.
            var cols = '';
            for (var yr = minY; yr <= maxY; yr++) {
                var c = byYear[yr] || 0;
                var h = maxCount ? Math.round(100 * c / maxCount) : 0;
                var showLabel = (yr === minY || yr === maxY || yr % 5 === 0);
                cols += '<div class="lsp-reftrend-col" data-year="' + yr + '" data-count="' + c +
                    '" title="' + yr + ': ' + c + ' reference' + (c === 1 ? '' : 's') + '">' +
                    '<div class="lsp-reftrend-barwrap"><div class="lsp-reftrend-bar" style="height:' + h + '%"></div></div>' +
                    '<div class="lsp-reftrend-year' + (showLabel ? '' : ' is-blank') + '">' +
                    (showLabel ? yr : '&nbsp;') + '</div>' +
                    '</div>';
            }
            head = '<div class="lsp-reftrend-summary"><b>' + refs.length + '</b> reference' +
                (refs.length === 1 ? '' : 's') + ', ' + minY + '&ndash;' + maxY + '</div>' +
                '<div class="lsp-reftrend-readout" aria-live="polite">' + HINT + '</div>' +
                '<div class="lsp-reftrend-chart">' + cols + '</div>';
        }

        // newest first; the list is permanently capped at TOP
        refs.sort(function (a, b) {
            return (b.year || 0) - (a.year || 0) ||
                (a.citation || '').localeCompare(b.citation || '');
        });
        var shown = refs.slice(0, TOP);
        var items = shown.map(function (r) {
            // hyperlink only the author/year part (display_name, e.g.
            // "Hartwell LH, et al. (1973)"); the title/journal remainder is
            // plain text and may carry formatting tags (e.g. <i>gene</i>),
            // so render as HTML like the other reference lists
            var rest = r.display_name && r.citation.indexOf(r.display_name) === 0 ?
                r.citation.slice(r.display_name.length) : r.citation;
            var label = (r.link && r.display_name) ?
                '<a href="' + escapeAttr(r.link) + '">' + escapeHtml(r.display_name) + '</a>' + rest :
                (r.link ? '<a href="' + escapeAttr(r.link) + '">' + r.citation + '</a>' : r.citation);
            var pmid = r.pmid ?
                ' <span class="lsp-ref-pmid">PMID: <a href="https://pubmed.ncbi.nlm.nih.gov/' +
                encodeURIComponent(r.pmid) + '" target="_blank">' + escapeHtml(String(r.pmid)) +
                '</a></span>' : '';
            return '<li class="lsp-ref-item">' + label + pmid + '</li>';
        });

        var litTabUrl = '/locus/' + locus['sgdid'] + '/literature';
        var note = '';
        if (refs.length > TOP) {
            note = '<p class="lsp-ref-note">Showing the ' + TOP + ' most recent of ' + refs.length +
                ' references. <a href="' + litTabUrl + '">See all ' + refs.length + '</a></p>';
        }

        el.innerHTML = head + note + '<ol class="lsp-ref-list-ol">' + items.join('') + '</ol>';

        $(el).off('.reftrend')
            .on('mouseenter.reftrend focusin.reftrend', '.lsp-reftrend-col', function () {
                var y = this.getAttribute('data-year');
                var c = this.getAttribute('data-count');
                $(el).find('.lsp-reftrend-readout')
                    .text(y + ': ' + c + ' reference' + (c === '1' ? '' : 's'));
            })
            .on('mouseleave.reftrend focusout.reftrend', '.lsp-reftrend-chart', function () {
                $(el).find('.lsp-reftrend-readout').text(HINT);
            });
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    observer.disconnect();
                    load();
                }
            });
        }, { rootMargin: '300px' });
        observer.observe(section);
    } else {
        load();
    }

})();
