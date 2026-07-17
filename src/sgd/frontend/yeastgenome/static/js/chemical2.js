// Redesigned chemical page (Tier 1). Reuses the same backend chemical data as
// chemical.js but adds: deduped synonyms, a phenotype summary bar + facet
// filters + numeric concentration column + .tsv/.json/API downloads, an
// interactive Cytoscape "Shared Chemicals" network with a table toggle, and a
// richer Resources list.

var _chem2_facet_rows = [];
var _chem2_facet_state = {};
var _chem2_refs = {}; // dedup key -> { year }

$(document).ready(function () {
    fillDefinition();
    fillSynonyms();
    fillResources();
    fetchProperties();

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

function copyableValue(text) {
    return '<span class="chem2-mono">' + escapeHtml(text) + '</span>' +
        ' <button type="button" class="chem2-copy" data-copy="' + escapeAttr(text) + '">' +
        '<i class="fa fa-clipboard"></i> Copy</button>';
}

function renderProperties(p) {
    var el = document.getElementById('chem2-properties');
    if (!el || !p) { if (el) el.innerHTML = ''; return; }
    var rows = '';
    if (p.formula) rows += propRow('Formula', escapeHtml(p.formula));
    if (p.molecular_weight) rows += propRow('Molecular weight', escapeHtml(p.molecular_weight) + ' g/mol');
    if (p.pubchem_cid) {
        rows += propRow('PubChem CID',
            '<a href="https://pubchem.ncbi.nlm.nih.gov/compound/' + encodeURIComponent(p.pubchem_cid) + '" target="_blank">' + escapeHtml(p.pubchem_cid) + '</a>');
    }
    if (p.inchikey) rows += propRow('InChIKey', copyableValue(p.inchikey));
    if (p.smiles) rows += propRow('SMILES', copyableValue(p.smiles));
    if (p.inchi) rows += propRow('InChI', copyableValue(p.inchi));

    if (!rows) { el.innerHTML = ''; return; }

    var html = '<h4 class="chem2-properties-title">Key properties</h4>';
    html += '<table class="chem2-properties-table">' + rows + '</table>';
    if (p.sdf_url) {
        html += '<div class="chem2-properties-actions">' +
            '<a class="small button secondary" href="' + p.sdf_url + '" target="_blank"><i class="fa fa-download"></i> Download (.sdf)</a>' +
            '</div>';
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

function buildFacets(data, table) {
    var container = document.getElementById('phenotype_facets');
    if (!container) return;
    var dims = [
        { key: 'gene', label: 'Gene' },
        { key: 'phenotype', label: 'Phenotype' },
        { key: 'category', label: 'Experiment Type' },
        { key: 'strain', label: 'Strain' }
    ];
    var html = '';
    dims.forEach(function (d) {
        var counts = {};
        for (var i = 0; i < _chem2_facet_rows.length; i++) {
            var v = _chem2_facet_rows[i][d.key] || '';
            if (v === '') continue;
            counts[v] = (counts[v] || 0) + 1;
        }
        var opts = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
        html += '<label class="chem2-facet"><span>' + d.label + '</span><select data-facet="' + d.key + '">';
        html += '<option value="">All</option>';
        opts.forEach(function (o) {
            html += '<option value="' + escapeAttr(o) + '">' + escapeHtml(o) + ' (' + counts[o] + ')</option>';
        });
        html += '</select></label>';
    });
    html += '<a class="chem2-facet-clear" href="#">Clear filters</a>';
    container.innerHTML = html;

    $(container).on('change', 'select', function () {
        _chem2_facet_state[this.getAttribute('data-facet')] = this.value;
        table.fnDraw();
    });
    $(container).on('click', '.chem2-facet-clear', function (e) {
        e.preventDefault();
        _chem2_facet_state = {};
        $(container).find('select').val('');
        table.fnDraw();
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
function loadGoEnrichment(phenoData) {
    var uniqGenes = {};
    for (var i = 0; i < phenoData.length; i++) {
        uniqGenes[phenoData[i]['locus']['display_name']] = true;
    }
    var geneCount = Object.keys(uniqGenes).length;
    $.getJSON('/redirect_backend?param=chemical/' + chemical['id'] + '/go_enrichment', function (data) {
        var t = set_up_enrichment_table(data || [], geneCount);
        create_download_button('enrichment_table_download', t, chemical['display_name'] + '_go_process_enrichment');
    }).fail(function () {
        set_up_enrichment_table([], geneCount);
    });
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

    var cols = '';
    for (var yr = minY; yr <= maxY; yr++) {
        var c = byYear[yr] || 0;
        var h = maxCount ? Math.round(100 * c / maxCount) : 0;
        cols += '<div class="chem2-reftrend-col" title="' + yr + ': ' + c + ' reference' + (c === 1 ? '' : 's') + '">' +
            '<div class="chem2-reftrend-num">' + (c || '') + '</div>' +
            '<div class="chem2-reftrend-barwrap"><div class="chem2-reftrend-bar" style="height:' + h + '%"></div></div>' +
            '<div class="chem2-reftrend-year">&rsquo;' + String(yr).slice(2) + '</div>' +
            '</div>';
    }
    el.innerHTML = '<div class="chem2-reftrend-summary"><b>' + total + '</b> reference' + (total === 1 ? '' : 's') +
        ', ' + minY + '&ndash;' + maxY + '</div>' +
        '<div class="chem2-reftrend-chart">' + cols + '</div>';
}

// ---- Shared Chemicals network (Cytoscape) --------------------------------
function buildNetwork(data) {
    // Render the graph with the shared views.network renderer (Cytoscape 2.3.4,
    // exposed globally by application.js) — the same path the original chemical
    // page uses, so click-to-navigate and category filters work as expected.
    var has_go = 0, has_complex = 0, has_pheno = 0;
    for (var i = 0; i < data['nodes'].length; i++) {
        var cat = data['nodes'][i]['category'];
        if (cat === 'GO') has_go++;
        else if (cat === 'COMPLEX') has_complex++;
        else if (cat === 'PHENOTYPE') has_pheno++;
    }
    var colors = { 'FOCUS': 'black', 'CHEMICAL': '#7d0df3' };
    var filters = { ' All': function (d) { return true; } };
    var categoryCount = 0;
    if (has_go > 0) {
        colors['GO'] = '#2ca02c';
        filters[' GO Terms'] = function (d) { return ['FOCUS', 'GO', 'CHEMICAL'].includes(d.category); };
        categoryCount++;
    }
    if (has_pheno > 0) {
        colors['PHENOTYPE'] = '#1f77b4';
        filters[' Phenotypes'] = function (d) { return ['FOCUS', 'PHENOTYPE', 'CHEMICAL'].includes(d.category); };
        categoryCount++;
    }
    if (has_complex > 0) {
        colors['COMPLEX'] = '#E6AB03';
        filters[' Complexes'] = function (d) { return ['FOCUS', 'COMPLEX', 'CHEMICAL'].includes(d.category); };
        categoryCount++;
    }
    if (categoryCount < 2) filters = {};
    views.network.render(data, colors, 'j-chemical-network2', filters, true);

    // Build the shared-phenotype table + toggle from the same data.
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
    var nameById = {};
    data.nodes.forEach(function (n) { nameById[n.id] = n.name; });
    var chems = data.nodes.filter(function (n) { return n.category === 'CHEMICAL'; });
    var rows = chems.map(function (n) {
        var nbrs = neighbors[n.id] || {};
        var sharedPhenos = [];
        for (var k in nbrs) { if (focusNbrs[k] && (k in nameById)) sharedPhenos.push(nameById[k]); }
        return { name: n.name, href: n.href, count: sharedPhenos.length, phenos: sharedPhenos };
    }).sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });

    var html = '<table class="table table-striped table-bordered table-condensed chem2-network-table">';
    html += '<thead><tr><th>Chemical</th><th>Shared</th><th>Shared phenotypes</th></tr></thead><tbody>';
    rows.forEach(function (r) {
        html += '<tr><td><a href="' + r.href + '">' + escapeHtml(r.name) + '</a></td>' +
            '<td>' + r.count + '</td>' +
            '<td>' + r.phenos.map(escapeHtml).join('; ') + '</td></tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
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
    options['iDisplayLength'] = 5;
    options['oLanguage'] = { sEmptyTable: 'No protein abundance data for this protein.' };
    return create_table('protein_abundance_table', options);
}
