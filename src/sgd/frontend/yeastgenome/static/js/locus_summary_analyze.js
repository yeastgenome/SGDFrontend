// Analyze buttons for the Regulation and Interaction sections of the Locus
// Summary Page, mirroring the button bars under the same graphics on the
// Regulation and Interaction tabs. The tabs build their gene lists from the
// locus *_details payloads they already fetch for their tables; the summary
// page does not fetch those (they can be large), so each button fetches the
// payload lazily on first click and then submits to /analyze exactly like
// the tabs do (see create_analyze_button* in local.js).

(function() {

    function targets_from(data) {
        var ids = {};
        for (var i = 0; i < data.length; i++) {
            if (data[i]['locus1']['id'] == locus['id']) {
                ids[data[i]['locus2']['id']] = true;
            }
        }
        return Object.keys(ids);
    }

    function regulators_from(data) {
        var ids = {};
        for (var i = 0; i < data.length; i++) {
            if (data[i]['locus2']['id'] == locus['id']) {
                ids[data[i]['locus1']['id']] = true;
            }
        }
        return Object.keys(ids);
    }

    // interactors of the given type ('Physical'/'Genetic', or null for any),
    // as a set keyed by dbentity id; the interactor is the locus on the other
    // side of the row from the current gene
    function interactors_from(data, wanted_type) {
        var ids = {};
        for (var i = 0; i < data.length; i++) {
            if (wanted_type && data[i]['interaction_type'] != wanted_type) {
                continue;
            }
            var other = data[i]['locus1']['id'] == locus['id'] ?
                data[i]['locus2'] : data[i]['locus1'];
            ids[other['id']] = true;
        }
        return ids;
    }

    function intersect_keys(a, b) {
        return Object.keys(a).filter(function(k) { return k in b; });
    }

    function wire(button_id, details_param, extract, list_name) {
        var button = $('#' + button_id);
        if (button.length === 0) {
            return;
        }
        button.attr('disabled', false);
        button.click(function() {
            if (button.attr('disabled')) {
                return;
            }
            button.attr('disabled', true);
            $.getJSON('/redirect_backend?param=locus/' + locus['id'] + '/' + details_param)
                .done(function(data) {
                    button.attr('disabled', false);
                    var bioent_ids = extract(data);
                    if (bioent_ids.length > 0) {
                        post_to_url('/analyze', {
                            'list_name': list_name,
                            'bioent_ids': JSON.stringify(bioent_ids)
                        });
                    }
                })
                .fail(function() {
                    button.attr('disabled', false);
                });
        });
    }

    $(document).ready(function() {
        var gene_link = "<a href='" + locus['link'] + "' class='gene_name'>" +
            locus['display_name'] + "</a>";

        wire('lsp_analyze_targets', 'regulation_details',
             targets_from, gene_link + ' targets');
        wire('lsp_analyze_regulators', 'regulation_details',
             regulators_from, gene_link + ' regulators');

        wire('lsp_phys', 'interaction_details', function(data) {
            return Object.keys(interactors_from(data, 'Physical'));
        }, gene_link + ' physical interactors');
        wire('lsp_gen', 'interaction_details', function(data) {
            return Object.keys(interactors_from(data, 'Genetic'));
        }, gene_link + ' genetic interactors');
        wire('lsp_phys_gen_intersect', 'interaction_details', function(data) {
            return intersect_keys(interactors_from(data, 'Physical'),
                                  interactors_from(data, 'Genetic'));
        }, gene_link + ' both physical and genetic interactors');
        wire('lsp_phys_gen_union', 'interaction_details', function(data) {
            return Object.keys(interactors_from(data, null));
        }, gene_link + ' interactors');
    });

})();
