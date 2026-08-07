/* Faceted filtering for the "Literature Recently Added to SGD" page.
   Reads the `references` blob embedded in the page, builds facets, and shows/
   hides the server-rendered <li data-ref-index> items. Within a facet the
   selected values are OR'd; across facets they are AND'd. Option counts are
   dynamic: each facet's counts reflect the selections active in the others. */

(function () {

  var FACETS = [
    { key: 'author', title: 'Author' },
    { key: 'journal', title: 'Journal' },
    { key: 'year', title: 'Year' },
    { key: 'gene', title: 'Associated Genes' },
    { key: 'allele', title: 'Associated Alleles' },
    { key: 'complex', title: 'Associated Complexes' },
    { key: 'pathway', title: 'Associated Pathways' }
  ];

  var INITIAL_VISIBLE = 10;   // options shown before "Show all"
  var SEARCH_THRESHOLD = 12;  // show a filter box when a facet has more options

  // facetValues[i] = { author: [..], journal: [..], year: [..], ... } for reference i
  var facetValues = [];
  var selected = {};          // key -> object acting as a Set of selected values
  FACETS.forEach(function (f) { selected[f.key] = {}; });

  function entityBucket(link) {
    if (!link) { return null; }
    if (link.indexOf('/complex/') !== -1) { return 'complex'; }
    if (link.indexOf('pathway') !== -1) { return 'pathway'; }
    if (link.indexOf('/allele/') !== -1) { return 'allele'; }
    if (link.indexOf('/locus/') !== -1) { return 'gene'; }
    return null;
  }

  function extractValues(ref) {
    var v = { author: [], journal: [], year: [], gene: [], allele: [], complex: [], pathway: [] };
    if (ref.authors) {
      ref.authors.forEach(function (a) {
        if (a && a.display_name) { v.author.push(a.display_name); }
      });
    }
    if (ref.journal && ref.journal.med_abbr) { v.journal.push(ref.journal.med_abbr); }
    if (ref.year !== null && ref.year !== undefined && ref.year !== '') {
      v.year.push(String(ref.year));
    }
    (ref.entity_list || []).forEach(function (e) {
      if (!e || !e.locus) { return; }
      var bucket = entityBucket(e.locus.link);
      if (bucket && e.locus.display_name) { v[bucket].push(e.locus.display_name); }
    });
    // de-duplicate values within a single reference
    Object.keys(v).forEach(function (k) {
      v[k] = v[k].filter(function (val, idx) { return v[k].indexOf(val) === idx; });
    });
    return v;
  }

  // Does reference i satisfy every facet's selection, optionally ignoring one facet?
  function matches(i, exceptKey) {
    for (var k = 0; k < FACETS.length; k++) {
      var key = FACETS[k].key;
      if (key === exceptKey) { continue; }
      var chosen = Object.keys(selected[key]);
      if (chosen.length === 0) { continue; }
      var vals = facetValues[i][key];
      var hit = chosen.some(function (c) { return vals.indexOf(c) !== -1; });
      if (!hit) { return false; }
    }
    return true;
  }

  // Count, per value, how many references have it once every OTHER facet is applied.
  function countsFor(key) {
    var counts = {};
    for (var i = 0; i < facetValues.length; i++) {
      if (!matches(i, key)) { continue; }
      facetValues[i][key].forEach(function (val) {
        counts[val] = (counts[val] || 0) + 1;
      });
    }
    return counts;
  }

  function sortValues(key, counts) {
    var vals = Object.keys(counts);
    if (key === 'year') {
      vals.sort(function (a, b) { return Number(b) - Number(a); });
    } else {
      vals.sort(function (a, b) {
        if (counts[b] !== counts[a]) { return counts[b] - counts[a]; }
        return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
      });
    }
    return vals;
  }

  function applyFilter() {
    var shown = 0;
    var total = facetValues.length;
    $('#references_list_wrapper li[data-ref-index]').each(function () {
      var i = Number($(this).attr('data-ref-index'));
      if (matches(i, null)) { $(this).show(); shown++; }
      else { $(this).hide(); }
    });
    var anySelected = FACETS.some(function (f) { return Object.keys(selected[f.key]).length > 0; });
    $('#ref-result-count').text(
      anySelected ? ('Showing ' + shown + ' of ' + total + ' references') : (total + ' references')
    );
    renderFacets();
  }

  function renderFacets() {
    var $root = $('#ref-facets');
    if (!$root.length) { return; }

    FACETS.forEach(function (f) {
      var counts = countsFor(f.key);
      var values = sortValues(f.key, counts);
      // Always keep already-selected values visible even if their count is 0.
      Object.keys(selected[f.key]).forEach(function (s) {
        if (values.indexOf(s) === -1) { values.push(s); counts[s] = counts[s] || 0; }
      });

      var $facet = $root.find('[data-facet="' + f.key + '"]');
      var isNew = false;
      var searchText = '';
      var expanded = false;
      if (!$facet.length) {
        if (values.length === 0) { return; } // nothing to show for this facet
        isNew = true;
        $facet = $('<div class="ref-facet" data-facet="' + f.key + '"></div>');
        $facet.append(
          '<div class="ref-facet-header">' +
            '<span>' + f.title + '</span>' +
            '<span class="ref-facet-caret">▾</span>' +
          '</div>'
        );
        var $body = $('<div class="ref-facet-body"></div>');
        if (values.length > SEARCH_THRESHOLD) {
          $body.append('<input type="text" class="ref-facet-filter" placeholder="Filter ' + f.title + '…">');
        }
        $body.append('<div class="ref-facet-options"></div>');
        $body.append('<a class="ref-facet-more" style="display:none;">Show all</a>');
        $facet.append($body);
        $root.append($facet);
      } else {
        searchText = ($facet.find('.ref-facet-filter').val() || '').toLowerCase();
        expanded = $facet.data('expanded') === true;
      }
      if (values.length === 0 && Object.keys(selected[f.key]).length === 0) {
        $facet.remove();
        return;
      }

      var $options = $facet.find('.ref-facet-options');
      $options.empty();
      var filtered = values.filter(function (v) {
        return searchText === '' || v.toLowerCase().indexOf(searchText) !== -1;
      });
      var limit = expanded ? filtered.length : INITIAL_VISIBLE;
      filtered.slice(0, limit).forEach(function (v) {
        var checked = selected[f.key][v] ? ' checked' : '';
        var label = $('<label class="ref-facet-option"></label>');
        label.append('<input type="checkbox"' + checked + '>');
        label.find('input').data('value', v);
        label.append(document.createTextNode(v + ' '));
        label.append('<span class="ref-facet-count">(' + (counts[v] || 0) + ')</span>');
        $options.append(label);
      });

      var $more = $facet.find('.ref-facet-more');
      if (filtered.length > INITIAL_VISIBLE) {
        $more.show().text(expanded ? 'Show fewer' : ('Show all ' + filtered.length));
      } else {
        $more.hide();
      }
    });
  }

  function wireEvents() {
    var $root = $('#ref-facets');

    $root.on('change', 'input[type="checkbox"]', function () {
      var $facet = $(this).closest('.ref-facet');
      var key = $facet.attr('data-facet');
      var val = $(this).data('value');
      if (this.checked) { selected[key][val] = true; }
      else { delete selected[key][val]; }
      applyFilter();
    });

    $root.on('click', '.ref-facet-header', function () {
      var $body = $(this).siblings('.ref-facet-body');
      $body.toggleClass('collapsed');
      $(this).find('.ref-facet-caret').text($body.hasClass('collapsed') ? '▸' : '▾');
    });

    $root.on('click', '.ref-facet-more', function () {
      var $facet = $(this).closest('.ref-facet');
      $facet.data('expanded', $facet.data('expanded') !== true);
      renderFacets();
    });

    $root.on('input', '.ref-facet-filter', function () {
      renderFacets();
    });

    $('#ref-facet-clear-all').on('click', function () {
      FACETS.forEach(function (f) { selected[f.key] = {}; });
      $root.find('input[type="checkbox"]').prop('checked', false);
      applyFilter();
    });
  }

  $(document).ready(function () {
    if (typeof references === 'undefined' || !references) { return; }
    facetValues = references.map(extractValues);
    wireEvents();
    applyFilter();
  });

})();
