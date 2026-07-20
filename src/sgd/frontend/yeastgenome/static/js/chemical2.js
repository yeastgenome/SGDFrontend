// Redesigned chemical page (Tier 1). Reuses the same backend chemical data as
// chemical.js but adds: deduped synonyms, a phenotype summary bar + facet
// filters + numeric concentration column + .tsv/.json/API downloads, an
// interactive Cytoscape "Shared Chemicals" network with a table toggle, and a
// richer Resources list.

var _chem2_facet_rows = [];
var _chem2_facet_state = {};
var _chem2_refs = {}; // dedup key -> { year }
var _chem2_network_dt = null; // Shared Chemicals DataTable (built hidden; resized on show)

$(document).ready(function () {
    fillDefinition();
    fillSynonyms();
    fillResources();
    fetchProperties();
    fetchRelatedGenes();

    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/phenotype_details', function (data) {
        buildFacetRows(data);
        registerFacetFilter();
        var table = create_phenotype_table(data);
        buildSummary(data);
        buildFacets(data, table);
        create_analyze_button('phenotype_table_analyze', table,
            "<a href='" + chemical['link'] + "' class='gene_name'>" + chemical['display_name'] + "</a> Genes", true);
        create_download_button('phenotype_table_download', table, chemical['display_name'] + '_phenotype_annotations');
        setupExtraDownloads(data);
        loadGoEnrichment(data);
        collectRefs(data);
        renderRefTrend();
    });

    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/go_details', function (data) {
        var go_table = create_go_table(data);
        create_analyze_button('go_table_analyze', go_table,
            "<a href='" + chemical['link'] + "' class='gene_name'>" + chemical['display_name'] + "</a> Genes", true);
        create_download_button('go_table_download', go_table, chemical['display_name'] + '_go_annotations');
        if (data && data.length) { collectRefs(data); renderRefTrend(); }
    });

    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/proteinabundance_details', function (data) {
        // The Protein Abundance section is only rendered when the chemical has
        // abundance data at page load. If the element is absent, building a
        // DataTable on it throws in fnSearchHighlighting, so skip.
        if (!document.getElementById('protein_abundance_table')) return;
        var t = create_protein_abundance_table(data);
        create_download_button('protein_abundance_table_download', t, chemical['display_name'] + '_protein_abundance');
    });

    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/network_graph', function (data) {
        if (data != null && data['nodes'] && data['nodes'].length > 1) {
            buildNetwork(data);
        } else {
            hide_section('network');
        }
    });
});

// ---- helpers -------------------------------------------------------------
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
}
// ---- Overview ------------------------------------------------------------
// ChEBI definitions contain simple inline markup (e.g. <em>, <sub>). Render
// only a whitelist of inline tags and drop everything else (incl. attributes),
// so the markup shows correctly without an HTML-injection risk.
function sanitizeInlineHtml(html) {
    var allowed = /^(EM|I|B|STRONG|SMALL|SUB|SUP|BR)$/;
    var root = document.createElement('div');
    root.innerHTML = html;
    (function clean(node) {
        var kids = Array.prototype.slice.call(node.childNodes);
        kids.forEach(function (child) {
            if (child.nodeType === 1) {
                if (!allowed.test(child.tagName)) {
                    node.replaceChild(document.createTextNode(child.textContent), child);
                } else {
                    while (child.attributes.length) {
                        child.removeAttribute(child.attributes[0].name);
                    }
                    clean(child);
                }
            }
        });
    })(root);
    return root.innerHTML;
}

function fillDefinition() {
    var el = document.getElementById('chem2-definition');
    if (!el || !chemical['definition']) return;
    el.innerHTML = sanitizeInlineHtml(chemical['definition']);
}

function fillSynonyms() {
    var el = document.getElementById('chem2-synonyms');
    if (!el || !chemical['synonyms']) return;
    var seen = {};
    var names = [];
    for (var i = 0; i < chemical['synonyms'].length; i++) {
        var name = chemical['synonyms'][i]['display_name'];
        if (name == null) continue;
        var key = name.toLowerCase();
        if (seen[key]) continue;
        seen[key] = true;
        names.push(name);
    }
    el.innerHTML = names.map(escapeHtml).join('; ');
}

// ---- Key properties (from backend /properties, which pulls PubChem/ChEBI) --
function fetchProperties() {
    var el = document.getElementById('chem2-properties');
    if (!el) return;
    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/properties', function (p) {
        renderProperties(p);
    }).fail(function () {
        el.innerHTML = '';
    });
}

function propRow(label, valueHtml) {
    return '<tr><th>' + label + '</th><td>' + valueHtml + '</td></tr>';
}

// Render a molecular formula with subscripted digits, e.g. C6H14O6 -> C<sub>6</sub>...
// Escapes first, so it is injection-safe.
function formatFormula(formula) {
    return escapeHtml(formula).replace(/(\d+)/g, '<sub>$1</sub>');
}

function copyableValue(text) {
    return '<span class="chem2-mono">' + escapeHtml(text) + '</span>' +
        ' <button type="button" class="chem2-copy" data-copy="' + escapeAttr(text) + '">' +
        '<i class="fa fa-clipboard"></i> Copy</button>';
}

function renderProperties(p) {
    var el = document.getElementById('chem2-properties');
    if (!el || !p) { if (el) el.innerHTML = ''; return; }
    // Key properties: shown by default (human-useful facts + identifiers).
    var rows = '';
    if (p.formula) rows += propRow('Formula', formatFormula(p.formula));
    if (p.molecular_weight) rows += propRow('Molecular weight', escapeHtml(p.molecular_weight) + ' g/mol');
    if (p.pubchem_cid) {
        rows += propRow('PubChem CID',
            '<a href="https://pubchem.ncbi.nlm.nih.gov/compound/' + encodeURIComponent(p.pubchem_cid) + '" target="_blank">' + escapeHtml(p.pubchem_cid) + '</a>');
    }
    // ChEBI ID is already shown in the overview facts list at the top of the page,
    // so it is intentionally omitted here to avoid duplicating the identifier.

    // Technical identifiers: structure strings only ~1% of users need; collapsed
    // by default to keep the overview clean, expandable for cheminformatics use.
    var techRows = '';
    if (p.inchikey) techRows += propRow('InChIKey', copyableValue(p.inchikey));
    if (p.smiles) techRows += propRow('SMILES', copyableValue(p.smiles));
    if (p.inchi) techRows += propRow('InChI', copyableValue(p.inchi));

    if (!rows && !techRows) { el.innerHTML = ''; return; }

    var html = '<h4 class="chem2-properties-title">Key properties</h4>';
    if (rows) html += '<table class="chem2-properties-table">' + rows + '</table>';
    if (p.sdf_url) {
        html += '<div class="chem2-properties-actions">' +
            '<a class="small button secondary" href="' + p.sdf_url + '" target="_blank"><i class="fa fa-download"></i> Download (.sdf)</a>' +
            '</div>';
    }
    if (techRows) {
        html += '<details class="chem2-tech-ids">' +
            '<summary>Technical identifiers</summary>' +
            '<table class="chem2-properties-table">' + techRows + '</table>' +
            '</details>';
    }
    html += '<p class="chem2-properties-note">Properties from PubChem / ChEBI.</p>';
    el.innerHTML = html;

    $(el).off('click', '.chem2-copy').on('click', '.chem2-copy', function () {
        var text = this.getAttribute('data-copy');
        var btn = this;
        var done = function () {
            btn.innerHTML = '<i class="fa fa-check"></i> Copied';
            setTimeout(function () { btn.innerHTML = '<i class="fa fa-clipboard"></i> Copy'; }, 1200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else {
            fallbackCopy(text);
            done();
        }
    });
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
}

function fillResources() {
    var el = document.getElementById('chem2-resources');
    if (!el) return;
    var chebi = chemical['chebi_id'] || '';
    var name = chemical['display_name'] || '';
    var links = [];
    if (chebi) {
        links.push('<a href="https://www.ebi.ac.uk/chebi/searchId.do?chebiId=' + encodeURIComponent(chebi) + '" target="_blank">ChEBI</a>');
        links.push('<a href="https://pubchem.ncbi.nlm.nih.gov/#query=' + encodeURIComponent(chebi) + '" target="_blank">PubChem</a>');
        links.push('<a href="https://www.rhea-db.org/rhea?query=' + encodeURIComponent(chebi) + '" target="_blank">RHEA</a>');
    }
    if (name) {
        links.push('<a href="https://hmdb.ca/unearth/q?query=' + encodeURIComponent(name) + '&searcher=metabolites" target="_blank">HMDB</a>');
        links.push('<a href="https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(name) + '" target="_blank">Wikipedia</a>');
    }
    if (chemical['pharmGKB_link_url']) {
        links.push('<a href="' + chemical['pharmGKB_link_url'] + '" target="_blank">PharmGKB</a>');
    }
    el.innerHTML = links.join(' &nbsp;|&nbsp; ');
}

// ---- Phenotype table (adds numeric Conc. column at index 10) --------------
function extractConc(ev) {
    var props = ev['properties'] || [];
    var focal = null, any = null;
    for (var j = 0; j < props.length; j++) {
        var p = props[j];
        if (p['class_type'] !== 'CHEMICAL' || p['concentration'] == null) continue;
        if (any === null) any = p['concentration'];
        if (p['bioitem'] && p['bioitem']['display_name'] === chemical['display_name']) {
            focal = p['concentration'];
            break;
        }
    }
    var c = focal !== null ? focal : any;
    return (c !== null && c !== undefined) ? c : '';
}

function create_phenotype_table(data) {
    var datatable = [];
    var phenotypes = {};
    for (var i = 0; i < data.length; i++) {
        var row = phenotype_data_to_table(data[i], i);
        row.splice(10, 0, extractConc(data[i])); // insert Conc. after Chemical
        datatable.push(row);
        phenotypes[data[i]['phenotype']['id']] = true;
    }

    set_up_header('phenotype_table', datatable.length, 'entry', 'entries',
        Object.keys(phenotypes).length, 'phenotype', 'phenotypes');

    var options = {};
    options['bPaginate'] = true;
    options['aaSorting'] = [[4, 'asc']];
    options['aoColumns'] = [
        { 'bSearchable': false, 'bVisible': false }, // 0 evidence id
        { 'bSearchable': false, 'bVisible': false }, // 1 locus id
        null,                                        // 2 gene
        { 'bSearchable': false, 'bVisible': false }, // 3 systematic name
        null,                                        // 4 phenotype
        null,                                        // 5 experiment type
        { 'bSearchable': false, 'bVisible': false }, // 6 experiment category
        null,                                        // 7 mutant information
        null,                                        // 8 strain
        null,                                        // 9 chemical
        { 'sType': 'numeric' },                      // 10 conc (numeric)
        { 'sWidth': '250px' },                       // 11 details
        null                                         // 12 reference
    ];
    options['oLanguage'] = { 'sEmptyTable': 'No phenotype data for ' + chemical['display_name'] };
    options['aaData'] = datatable;

    return create_table('phenotype_table', options);
}

// ---- Summary bar (shared helper in local.js) -----------------------------
function buildSummary(data) {
    build_phenotype_summary('phenotype_summary', data, false);
}

// ---- Facet filters -------------------------------------------------------
function buildFacetRows(data) {
    _chem2_facet_rows = data.map(function (e) {
        return {
            gene: e['locus']['display_name'],
            phenotype: e['phenotype']['display_name'],
            category: e['experiment'] ? e['experiment']['category'] : '',
            strain: e['strain'] ? e['strain']['display_name'] : ''
        };
    });
}

function registerFacetFilter() {
    if (window._chem2_filter_registered) return;
    window._chem2_filter_registered = true;
    $.fn.dataTableExt.afnFiltering.push(function (oSettings, aData, iDataIndex) {
        if (oSettings.nTable.id !== 'phenotype_table') return true;
        var r = _chem2_facet_rows[iDataIndex];
        if (!r) return true;
        for (var k in _chem2_facet_state) {
            if (_chem2_facet_state[k] && r[k] !== _chem2_facet_state[k]) return false;
        }
        return true;
    });
}

var _chem2_facet_dims = [
    { key: 'gene', label: 'Gene' },
    { key: 'phenotype', label: 'Phenotype' },
    { key: 'category', label: 'Experiment Type' },
    { key: 'strain', label: 'Strain' }
];

// Count values of dimension `dimKey` over rows matching every ACTIVE filter
// EXCEPT dimKey's own — so the counts reflect the current filter intersection
// (they add up to the visible rows), but you can still switch within a
// dimension. Standard faceted-search behavior.
function facetCounts(dimKey) {
    var counts = {};
    for (var i = 0; i < _chem2_facet_rows.length; i++) {
        var r = _chem2_facet_rows[i];
        var match = true;
        for (var k in _chem2_facet_state) {
            if (k === dimKey) continue;
            if (_chem2_facet_state[k] && r[k] !== _chem2_facet_state[k]) { match = false; break; }
        }
        if (!match) continue;
        var v = r[dimKey] || '';
        if (v === '') continue;
        counts[v] = (counts[v] || 0) + 1;
    }
    return counts;
}

// (Re)populate one dropdown's <option>s from the current filter state, keeping
// its selection (and showing the selected value even if the intersection now
// zeroes it, so the user can still see and clear it).
function renderFacetOptions(select) {
    var dimKey = select.getAttribute('data-facet');
    var selected = _chem2_facet_state[dimKey] || '';
    var counts = facetCounts(dimKey);
    var opts = Object.keys(counts).sort(function (a, b) {
        return counts[b] - counts[a] || a.localeCompare(b);
    });
    if (selected && counts[selected] === undefined) { opts.unshift(selected); counts[selected] = 0; }
    var html = '<option value="">All</option>';
    opts.forEach(function (o) {
        html += '<option value="' + escapeAttr(o) + '">' + escapeHtml(o) + ' (' + counts[o] + ')</option>';
    });
    select.innerHTML = html;
    select.value = selected;
}

function refreshFacetCounts(container) {
    var selects = container.querySelectorAll('select[data-facet]');
    for (var i = 0; i < selects.length; i++) renderFacetOptions(selects[i]);
}

function buildFacets(data, table) {
    var container = document.getElementById('phenotype_facets');
    if (!container) return;
    var html = '';
    _chem2_facet_dims.forEach(function (d) {
        html += '<label class="chem2-facet"><span>' + d.label + '</span>' +
            '<select data-facet="' + d.key + '"></select></label>';
    });
    html += '<a class="chem2-facet-clear" href="#">Clear filters</a>';
    container.innerHTML = html;
    refreshFacetCounts(container);

    $(container).on('change', 'select', function () {
        _chem2_facet_state[this.getAttribute('data-facet')] = this.value;
        table.fnDraw();
        refreshFacetCounts(container); // recount the other facets for the new filter set
    });
    $(container).on('click', '.chem2-facet-clear', function (e) {
        e.preventDefault();
        _chem2_facet_state = {};
        table.fnDraw();
        refreshFacetCounts(container);
    });
}

// ---- Downloads (.tsv / .json) + API link ---------------------------------
function phenoExportRows(data) {
    return data.map(function (e) {
        return {
            gene: e['locus']['display_name'],
            gene_systematic_name: e['locus']['format_name'],
            phenotype: e['phenotype']['display_name'],
            experiment_type: e['experiment'] ? e['experiment']['display_name'] : '',
            experiment_category: e['experiment'] ? e['experiment']['category'] : '',
            mutant_type: e['mutant_type'],
            strain: e['strain'] ? e['strain']['display_name'] : '',
            chemical: chemical['display_name'],
            concentration: extractConc(e),
            details: (e['note'] || '').replace(/\s+/g, ' ').trim(),
            reference: e['reference'] ? e['reference']['display_name'] : '',
            pubmed_id: (e['reference'] && e['reference']['pubmed_id']) ? e['reference']['pubmed_id'] : ''
        };
    });
}

function toTSV(rows) {
    if (!rows.length) return '';
    var cols = Object.keys(rows[0]);
    var clean = function (v) { return String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' '); };
    var lines = [cols.join('\t')];
    rows.forEach(function (r) { lines.push(cols.map(function (c) { return clean(r[c]); }).join('\t')); });
    return lines.join('\n');
}

function triggerDownload(text, mime, filename) {
    var blob = new Blob([text], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function setupExtraDownloads(data) {
    var base = chemical['display_name'] + '_phenotype_annotations';
    var rows = phenoExportRows(data);
    // Append the extra download/API buttons into the existing Download/Analyze
    // button bar so they all sit on one row.
    var bar = document.getElementById('phenotype_table_buttons');
    if (!bar) return;
    var ul = document.createElement('ul');
    ul.className = 'button-group radius';
    ul.innerHTML =
        '<li><a id="phenotype_download_tsv" class="small button secondary"><i class="fa fa-download"></i> Download (.tsv)</a></li>' +
        '<li><a id="phenotype_download_json" class="small button secondary"><i class="fa fa-download"></i> Download (.json)</a></li>' +
        '<li><a id="phenotype_api_link" class="small button secondary" target="_blank"><i class="fa fa-code"></i> API (JSON)</a></li>';
    bar.appendChild(ul);
    document.getElementById('phenotype_download_tsv').onclick = function () { triggerDownload(toTSV(rows), 'text/tab-separated-values', base + '.tsv'); };
    document.getElementById('phenotype_download_json').onclick = function () { triggerDownload(JSON.stringify(rows, null, 2), 'application/json', base + '.json'); };
    document.getElementById('phenotype_api_link').href = '/redirect_backend?param=chemical/' + chemical['id'] + '/phenotype_details';
}

// ---- GO process enrichment of the phenotype genes ------------------------
// Enrichment can return dozens of terms. Show only the most significant ones by
// default (a cleaner, less overwhelming table) with a toggle to reveal the rest.
// The header count and the download always reflect the full set of terms.
var CHEM2_ENRICH_TOP = 10;
var _chem2_enrichment = { data: [], geneCount: 0, showAll: false };

function loadGoEnrichment(phenoData) {
    var uniqGenes = {};
    for (var i = 0; i < phenoData.length; i++) {
        uniqGenes[phenoData[i]['locus']['display_name']] = true;
    }
    var geneCount = Object.keys(uniqGenes).length;
    showEnrichmentLoading();
    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/go_enrichment', function (data) {
        // Sort most-significant first so "top 10" is the 10 smallest p-values.
        _chem2_enrichment.data = (data || []).slice().sort(function (a, b) {
            return parseFloat(a['pvalue']) - parseFloat(b['pvalue']);
        });
        _chem2_enrichment.geneCount = geneCount;
        _chem2_enrichment.showAll = false;
        drawGoEnrichment();
    }).fail(function () {
        set_up_enrichment_table([], geneCount);
    });
}

// The GO Term Finder call can take a while; label the existing table loader so
// the wait reads as intentional work. create_table removes #enrichment_table_loader
// by id once the table is built, so no explicit teardown is needed here.
function showEnrichmentLoading() {
    var loader = document.getElementById('enrichment_table_loader');
    if (!loader) return;
    loader.className = 'sgd-loader-container chem2-enrichment-loader';
    loader.innerHTML = '<div class="sgd-loader"></div>' +
        '<div class="chem2-enrichment-loading-text">Calculating GO process enrichment&hellip;</div>';
}

function drawGoEnrichment() {
    var all = _chem2_enrichment.data;
    var geneCount = _chem2_enrichment.geneCount;
    var capped = all.length > CHEM2_ENRICH_TOP && !_chem2_enrichment.showAll;
    var shownRaw = capped ? all.slice(0, CHEM2_ENRICH_TOP) : all;
    // Format the displayed p-value to 2 significant figures. The shared table's
    // own mRender doesn't take effect in the bundled DataTables build, so format
    // the value we hand it; sci-notation sorting still parses it, and the
    // download below keeps the full-precision raw p-values.
    var shown = shownRaw.map(function (e) {
        var n = parseFloat(e['pvalue']);
        return {
            go: e['go'],
            match_count: e['match_count'],
            pvalue: isNaN(n) ? e['pvalue'] : n.toExponential(2)
        };
    });

    set_up_enrichment_table(shown, geneCount);
    // set_up_enrichment_table headers the count off the rows it was given; restate
    // it against the true total so the label isn't misleading when capped.
    set_up_header('enrichment_table', all.length, 'entry', 'entries', geneCount, 'gene', 'genes');
    setupEnrichmentDownload(all);
    renderEnrichmentToggle(all.length, capped);
}

// Download every enriched term (plain text, raw p-value) regardless of how many
// are currently shown. Rebinds cleanly on each redraw.
function setupEnrichmentDownload(all) {
    $('#enrichment_table_download').off('click');
    var headers = ['GO Term', 'Number of genes', 'P-Value'];
    var rows = all.map(function (e) {
        return [(e['go'] && e['go']['display_name']) || '', e['match_count'], e['pvalue']];
    });
    create_download_button_no_table('enrichment_table_download', headers, rows,
        chemical['display_name'] + '_go_process_enrichment');
}

function renderEnrichmentToggle(total, capped) {
    $('#chem2-enrichment-toggle').remove();
    if (total <= CHEM2_ENRICH_TOP) return;
    var wrap = $('#enrichment_table').closest('.dataTables_wrapper');
    if (!wrap.length) return;
    var msg, link;
    if (capped) {
        msg = 'Showing the top ' + CHEM2_ENRICH_TOP + ' of ' + total + ' most significant terms.';
        link = 'Show all ' + total + ' terms';
    } else {
        msg = 'Showing all ' + total + ' terms.';
        link = 'Show top ' + CHEM2_ENRICH_TOP;
    }
    $('<div id="chem2-enrichment-toggle" class="chem2-enrichment-toggle"></div>')
        .html('<span>' + msg + '</span> <a href="#" class="chem2-enrichment-toggle-link">' + link + '</a>')
        .insertBefore(wrap);
}

$(document).on('click', '.chem2-enrichment-toggle-link', function (e) {
    e.preventDefault();
    _chem2_enrichment.showAll = !_chem2_enrichment.showAll;
    drawGoEnrichment();
});

// ---- Related genes (description text-match) -------------------------------
function fetchRelatedGenes() {
    if (!document.getElementById('related_genes_table')) return;
    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/related_genes', function (data) {
        renderRelatedGenes(data || []);
    }).fail(function () {
        hide_section('related_genes');
    });
}

function renderRelatedGenes(genes) {
    if (!document.getElementById('related_genes_table')) return;
    if (!genes.length) { hide_section('related_genes'); return; }

    set_up_header('related_genes', genes.length, 'gene', 'genes');
    var datatable = genes.map(function (g) {
        var name = g['display_name'] || g['systematic_name'] || '';
        var link = g['link'] ? '<a href="' + g['link'] + '">' + escapeHtml(name) + '</a>' : escapeHtml(name);
        return [link, escapeHtml(g['description'] || '')];
    });

    var options = {};
    options['bPaginate'] = true;
    options['iDisplayLength'] = 10;
    options['aaSorting'] = [[0, 'asc']];
    options['aoColumns'] = [{ 'sWidth': '120px' }, null];
    options['oLanguage'] = { 'sEmptyTable': 'No related genes for ' + chemical['display_name'] };
    options['aaData'] = datatable;
    create_table('related_genes_table', options);
}

// ---- Reference usage trend -----------------------------------------------
// Accumulate distinct references (deduped across phenotype + GO annotations)
// with their publication year parsed from the display name, e.g. "... (2002)".
function collectRefs(data) {
    for (var i = 0; i < data.length; i++) {
        var r = data[i]['reference'];
        if (!r) continue;
        var key = r['pubmed_id'] || r['link'] || r['display_name'];
        if (!key || _chem2_refs[key]) continue;
        var m = /\((\d{4})\)/.exec(r['display_name'] || '');
        _chem2_refs[key] = { year: m ? parseInt(m[1], 10) : null };
    }
}

var REFTREND_HINT = 'Hover a bar for the yearly count; click to search SGD references for that year';

// Strip a trailing charge / IUPAC qualifier in parentheses from a ChEBI display
// name, e.g. "2-oxoglutarate(2-)" -> "2-oxoglutarate", so it matches in the
// full-text reference search.
function cleanChemName(name) {
    return String(name || '').replace(/\s*\([^)]*\)\s*$/, '').trim() || String(name || '');
}

function renderRefTrend() {
    var el = document.getElementById('chem2-reftrend');
    if (!el) return;
    var total = 0, byYear = {};
    for (var k in _chem2_refs) {
        total++;
        var y = _chem2_refs[k].year;
        if (y) byYear[y] = (byYear[y] || 0) + 1;
    }
    if (total === 0) { hide_section('reference_usage'); return; }

    var years = Object.keys(byYear).map(Number).sort(function (a, b) { return a - b; });
    if (years.length === 0) {
        el.innerHTML = '<div class="chem2-reftrend-summary"><b>' + total + '</b> reference' + (total === 1 ? '' : 's') + '</div>';
        return;
    }
    var minY = years[0], maxY = years[years.length - 1];
    var maxCount = 0;
    for (var y2 in byYear) { if (byYear[y2] > maxCount) maxCount = byYear[y2]; }

    // Compact line: total, span, and (only when there's a real concentration) the
    // busiest ~3-year window, e.g. "most active around 2006-2007".
    var peak = peakWindowLabel(byYear, minY, maxY, total);

    // Only label the first/last year and multiples of 5, so 4-digit labels stay
    // readable across a multi-decade span; every bar still reports its exact year
    // and count on hover (title + the live readout above the chart).
    var cols = '';
    for (var yr = minY; yr <= maxY; yr++) {
        var c = byYear[yr] || 0;
        var h = maxCount ? Math.round(100 * c / maxCount) : 0;
        var showLabel = (yr === minY || yr === maxY || yr % 5 === 0);
        var clickable = c > 0;
        cols += '<div class="chem2-reftrend-col' + (clickable ? ' is-clickable' : '') +
            '" data-year="' + yr + '" data-count="' + c + '"' +
            (clickable ? ' role="link" tabindex="0"' : '') +
            ' title="' + yr + ': ' + c + ' reference' + (c === 1 ? '' : 's') +
            (clickable ? ' — click to search SGD references' : '') + '">' +
            '<div class="chem2-reftrend-barwrap"><div class="chem2-reftrend-bar" style="height:' + h + '%"></div></div>' +
            '<div class="chem2-reftrend-year' + (showLabel ? '' : ' is-blank') + '">' +
            (showLabel ? yr : '&nbsp;') + '</div>' +
            '</div>';
    }
    // Histogram is CSS bars (percentage heights), so it lays out correctly even
    // when collapsed inside <details> — no redraw-on-expand needed.
    el.innerHTML = '<div class="chem2-reftrend-summary"><b>' + total + '</b> reference' + (total === 1 ? '' : 's') +
        ', ' + minY + '&ndash;' + maxY + peak + '</div>' +
        '<details class="chem2-reftrend-details"><summary>Show timeline</summary>' +
        '<div class="chem2-reftrend-readout" aria-live="polite">' + REFTREND_HINT + '</div>' +
        '<div class="chem2-reftrend-chart">' + cols + '</div></details>';

    // Live readout: hovering a bar shows e.g. "1994: 4 references" above the chart.
    $(el).off('.reftrend')
        .on('mouseenter.reftrend focusin.reftrend', '.chem2-reftrend-col', function () {
            var y = this.getAttribute('data-year');
            var c = this.getAttribute('data-count');
            $(el).find('.chem2-reftrend-readout')
                .text(y + ': ' + c + ' reference' + (c === '1' ? '' : 's') +
                    (c !== '0' ? ' — click to search SGD references' : ''));
        })
        .on('mouseleave.reftrend focusout.reftrend', '.chem2-reftrend-chart', function () {
            $(el).find('.chem2-reftrend-readout').text(REFTREND_HINT);
        })
        // Clicking a bar opens an SGD reference search for this chemical in that
        // year (SGD search honors a year= facet). The chemical name has its
        // charge/IUPAC suffix like "(2-)" stripped, which would otherwise match
        // nothing in the full-text search.
        .on('click.reftrend keydown.reftrend', '.chem2-reftrend-col.is-clickable', function (ev) {
            if (ev.type === 'keydown' && ev.which !== 13 && ev.which !== 32) return;
            ev.preventDefault();
            var y = this.getAttribute('data-year');
            var term = cleanChemName(chemical['display_name']);
            window.open('/search?category=reference&page=0&q=' + encodeURIComponent(term) +
                '&year=' + encodeURIComponent(y), '_blank', 'noopener');
        });
}

// Busiest 3-year window, returned as ", most active around YYYY-YYYY" (or "" when
// the distribution is too small or flat to call a peak honestly).
function peakWindowLabel(byYear, minY, maxY, total) {
    if (total < 6 || (maxY - minY) < 2) return '';
    var bestStart = null, bestSum = 0;
    for (var s = minY; s <= maxY; s++) {
        var sum = (byYear[s] || 0) + (byYear[s + 1] || 0) + (byYear[s + 2] || 0);
        if (sum > bestSum) { bestSum = sum; bestStart = s; }
    }
    if (bestStart === null || bestSum < Math.max(3, Math.ceil(total * 0.25))) return '';
    var lo = null, hi = null;
    for (var yy = bestStart; yy <= bestStart + 2; yy++) {
        if (byYear[yy]) { if (lo === null) { lo = yy; } hi = yy; }
    }
    if (lo === null) return '';
    return ', most active ' + (lo === hi ? ('in ' + lo) : ('around ' + lo + '&ndash;' + hi));
}

// ---- Shared Chemicals network --------------------------------------------
// The diagram defaults to shared PHENOTYPES only — including GO annotations
// makes it too busy. When the chemical has GO annotations, a toolbar toggle
// re-renders the graph with shared GO terms added. The Table view lists both.
var _chem2_net_show_go = false;

// Drop nodes of a given category (and any edge touching them). Combined with the
// renderer's ignoreFloaters, this also hides chemicals left unconnected.
function dropCategory(data, cat) {
    var keep = {};
    var nodes = data.nodes.filter(function (n) {
        if (n.category === cat) return false;
        keep[n.id] = true;
        return true;
    });
    var edges = data.edges.filter(function (e) { return keep[e.source] && keep[e.target]; });
    return { nodes: nodes, edges: edges };
}

function buildNetwork(data) {
    var has_go = 0, has_complex = 0, has_pheno = 0;
    for (var i = 0; i < data['nodes'].length; i++) {
        var cat = data['nodes'][i]['category'];
        if (cat === 'GO') has_go++;
        else if (cat === 'COMPLEX') has_complex++;
        else if (cat === 'PHENOTYPE') has_pheno++;
    }

    // Render the graph via the shared views.network renderer. No in-graph category
    // filters: GO visibility is driven by the toolbar toggle, and the legend only
    // lists categories actually shown.
    function draw(includeGo) {
        var colors = { 'FOCUS': 'black', 'CHEMICAL': '#7d0df3' };
        if (has_pheno) colors['PHENOTYPE'] = '#1f77b4';
        if (has_complex) colors['COMPLEX'] = '#E6AB03';
        if (includeGo && has_go) colors['GO'] = '#2ca02c';
        var d = includeGo ? data : dropCategory(data, 'GO');
        views.network.render(d, colors, 'j-chemical-network2', {}, true);
    }

    _chem2_net_show_go = false;
    draw(false);
    setupNetworkGoToggle(has_go > 0, draw);

    // Build the shared phenotype/GO table + toggle from the full data.
    var focusId = null;
    data['nodes'].forEach(function (n) { if (n.category === 'FOCUS') focusId = n.id; });
    var neighbors = {};
    data['edges'].forEach(function (e) {
        (neighbors[e.source] = neighbors[e.source] || {})[e.target] = true;
        (neighbors[e.target] = neighbors[e.target] || {})[e.source] = true;
    });
    var focusNbrs = neighbors[focusId] || {};
    buildNetworkTable(data, neighbors, focusNbrs);
    setupNetworkToggle();
}

function buildNetworkTable(data, neighbors, focusNbrs) {
    var container = document.getElementById('chemical-network-table');
    if (!container) return;
    var nameById = {}, catById = {};
    data.nodes.forEach(function (n) { nameById[n.id] = n.name; catById[n.id] = n.category; });
    var chems = data.nodes.filter(function (n) { return n.category === 'CHEMICAL'; });
    // Each shared bridge node is either a phenotype or a GO term; split them so
    // GO sharing is visible in the table, not lumped under "phenotypes".
    var anyGo = false;
    var rows = chems.map(function (n) {
        var nbrs = neighbors[n.id] || {};
        var phenos = [], gos = [];
        for (var k in nbrs) {
            if (!focusNbrs[k] || !(k in nameById)) continue;
            if (catById[k] === 'GO') gos.push(nameById[k]);
            else if (catById[k] === 'PHENOTYPE') phenos.push(nameById[k]);
        }
        if (gos.length) anyGo = true;
        return { name: n.name, href: n.href, count: phenos.length + gos.length, phenos: phenos, gos: gos };
    });

    // Order chemicals that share phenotypes first (then by GO sharing), matching
    // the phenotype-first emphasis of the diagram.
    rows.sort(function (a, b) {
        return b.phenos.length - a.phenos.length ||
            b.gos.length - a.gos.length ||
            b.count - a.count ||
            a.name.localeCompare(b.name);
    });

    var headers = '<th>Chemical</th><th>Shared</th><th>Shared phenotypes</th>' +
        (anyGo ? '<th>Shared GO terms</th>' : '');
    var datatable = rows.map(function (r) {
        var row = [
            '<a href="' + r.href + '">' + escapeHtml(r.name) + '</a>',
            r.count,
            r.phenos.map(escapeHtml).join('; ')
        ];
        if (anyGo) row.push(r.gos.map(escapeHtml).join('; '));
        return row;
    });

    container.innerHTML = '<table class="table table-striped table-bordered table-condensed chem2-network-table" ' +
        'id="network_table"><thead><tr>' + headers + '</tr></thead></table>';

    var options = {};
    options['bPaginate'] = true;
    options['iDisplayLength'] = 10;
    options['aaSorting'] = []; // preserve the phenotype-first row order above
    options['aoColumns'] = anyGo
        ? [null, { 'sType': 'numeric' }, null, null]
        : [null, { 'sType': 'numeric' }, null];
    options['oLanguage'] = { 'sEmptyTable': 'No shared chemicals for ' + chemical['display_name'] };
    options['aaData'] = datatable;
    _chem2_network_dt = create_table('network_table', options);
}

// Add a "Show shared GO" toggle to the network toolbar, only when the chemical
// has GO annotations. Toggling re-renders the graph via the supplied draw fn.
function setupNetworkGoToggle(hasGo, draw) {
    var existing = document.getElementById('network_go_toggle_group');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var toolbar = document.querySelector('.chem2-network-toolbar');
    if (!hasGo || !toolbar) return;
    var grp = document.createElement('div');
    grp.id = 'network_go_toggle_group';
    grp.className = 'button-group radius chem2-network-go-toggle';
    grp.innerHTML = '<a id="network_toggle_go" class="small button secondary">Show shared GO</a>';
    toolbar.appendChild(grp);
    document.getElementById('network_toggle_go').onclick = function () {
        _chem2_net_show_go = !_chem2_net_show_go;
        this.textContent = _chem2_net_show_go ? 'Hide shared GO' : 'Show shared GO';
        this.className = _chem2_net_show_go ? 'small button' : 'small button secondary';
        draw(_chem2_net_show_go);
    };
}

function setupNetworkToggle() {
    var graphBtn = document.getElementById('network_view_graph');
    var tableBtn = document.getElementById('network_view_table');
    var graph = document.getElementById('j-chemical-network2');
    var table = document.getElementById('chemical-network-table');
    if (!graphBtn || !tableBtn) return;
    graphBtn.onclick = function () {
        graph.style.display = '';
        table.style.display = 'none';
        graphBtn.className = 'small button';
        tableBtn.className = 'small button secondary';
    };
    tableBtn.onclick = function () {
        graph.style.display = 'none';
        table.style.display = '';
        tableBtn.className = 'small button';
        graphBtn.className = 'small button secondary';
        // DataTable was initialized while hidden; fix column widths now that it is visible.
        if (_chem2_network_dt && _chem2_network_dt.fnAdjustColumnSizing) {
            _chem2_network_dt.fnAdjustColumnSizing();
        }
    };
}

// ---- GO + protein abundance tables (page-local, from chemical.js) ---------
function create_go_table(data) {
    var options = {};
    options['bPaginate'] = true;
    options['aaSorting'] = [[3, 'asc']];
    options['bDestroy'] = true;
    if ('Error' in data) {
        options['oLanguage'] = { 'sEmptyTable': data['Error'] };
        options['aaData'] = [];
        options['aoColumns'] = [
            { 'bSearchable': false, 'bVisible': false }, { 'bSearchable': false, 'bVisible': false },
            null, { 'bSearchable': false, 'bVisible': false }, null, { 'bSearchable': false, 'bVisible': false },
            null, { 'bSearchable': false, 'bVisible': false }, null, null, null, null, null,
            { 'bSearchable': false, 'bVisible': false }
        ];
    } else {
        var datatable = [];
        var genes = {};
        for (var i = 0; i < data.length; i++) {
            datatable.push(go_data_to_table(data[i], i));
            genes[data[i]['locus']['id']] = true;
        }
        set_up_header('go_table', datatable.length, 'entry', 'entries', Object.keys(genes).length, 'gene', 'genes');
        options['oLanguage'] = { 'sEmptyTable': 'No gene ontology data for ' + chemical['display_name'] };
        options['aaData'] = datatable;
        options['aoColumns'] = [
            { 'bSearchable': false, 'bVisible': false, 'aTargets': [0], 'mData': 0 },
            { 'bSearchable': false, 'bVisible': false, 'aTargets': [1], 'mData': 1 },
            { 'aTargets': [2], 'mData': 2 },
            { 'bSearchable': false, 'bVisible': false, 'aTargets': [3], 'mData': 3 },
            { 'aTargets': [4], 'mData': 4 },
            { 'bSearchable': false, 'bVisible': false, 'aTargets': [5], 'mData': 5 },
            { 'aTargets': [6], 'mData': 6 },
            { 'bSearchable': false, 'bVisible': false, 'aTargets': [7], 'mData': 7 },
            { 'aTargets': [8], 'mData': 8 },
            { 'aTargets': [9], 'mData': 9 },
            { 'bSearchable': false, 'bVisible': false, 'aTargets': [10], 'mData': 10 },
            { 'aTargets': [11], 'mData': 11 },
            { 'aTargets': [12], 'mData': 12 },
            { 'aTargets': [13], 'mData': 13 }
        ];
    }
    return create_table('go_table', options);
}

function create_protein_abundance_table(data) {
    var datatable = [];
    for (var i = 0; i < data.length; i++) {
        datatable.push(protein_abundance_data_to_table(data[i]));
    }
    set_up_header('protein_abundance_table', datatable.length, 'entry', 'entries', 'abundance', 'abundances');
    var options = {};
    options['aaSorting'] = [[11, 'asc']];
    options['aoColumns'] = [
        { bSearchable: false, bVisible: false }, { bSearchable: false, bVisible: false },
        { bSearchable: true, bVisible: true }, { bSearchable: false, bVisible: false },
        null, null, null, null, null, null, null, null, null
    ];
    options['aaData'] = datatable;
    options['bPaginate'] = true;
    options['iDisplayLength'] = 10;
    options['oLanguage'] = { sEmptyTable: 'No protein abundance data for this protein.' };
    return create_table('protein_abundance_table', options);
}
