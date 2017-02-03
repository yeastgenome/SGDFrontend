function domain_data_to_table(evidence) {
    var bioent = create_link(evidence['locus']['display_name'], evidence['locus']['link'], false);
    var domain;
    if(evidence['domain']['link'] != null) {
        domain = create_link(evidence['domain']['display_name'], evidence['domain']['link']);
    }
    else {
        domain = evidence['domain']['display_name']
    }

    var coord_range = evidence['start'] + '-' + evidence['end'];

    var description = '';
    if (evidence['domain']['description'] != null) {
        description = evidence['domain']['description'];
    }

    return [evidence['id'], evidence['locus']['id'], bioent, evidence['locus']['format_name'], coord_range, domain, description, evidence['source']['display_name'], '' + evidence['domain']['count']]
}

function dataset_datat_to_table(dataset) {
    var reference = '';
    if(dataset['reference'] != null) {
        reference = create_link(dataset['reference']['display_name'], dataset['reference']['link']);
        if(dataset['reference']['pubmed_id'] != null) {
            reference = reference + ' <small>PMID:' + dataset['reference']['pubmed_id'] + '</small>';
        }
    }

    var dataset_with_link = create_link(dataset['display_name'], dataset['link']);
    var tags = [];
    for(var j=0; j < dataset['tags'].length; j++) {
        tags.push(create_link(dataset['tags'][j]['display_name'], dataset['tags'][j]['link']));
    }

    var hist_values = [];
    if('hist_values' in dataset) {
        for(var j=0; j < dataset['hist_values'].length; j++) {
            var min_range = dataset['hist_values'][j];
            var max_range = min_range + .5;
            if(min_range == -5.5) {
                min_range = '*';
            }
            else {
                min_range = min_range.toFixed(1);
            }
            if(max_range == 5.5) {
                max_range = '*';
            }
            else {
                max_range = max_range.toFixed(1);
            }
            hist_values.push('log2ratio=' + min_range + ':' + max_range)
        }
    }



    return [dataset['id'], dataset['id'], hist_values.join(', '), dataset_with_link, dataset['short_description'], tags.join(', '), dataset['condition_count'].toString(), reference]
}

function phosphorylation_data_to_table(evidence) {
    var bioent = create_link(evidence['locus']['display_name'], evidence['locus']['link'], false);

    var site_index = evidence['site_index'];
    var site_residue = evidence['site_residue'];

    var reference = '';
    if(evidence['reference'] != null) {
        reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    }

    var site_functions = '';
    var kinases = '';
    for(var j=0; j < evidence['properties'].length; j++) {
        if(evidence['properties'][j]['role'] == 'Kinase') {
            if(kinases.length > 0) {
                kinases = kinases + ', ';
            }
            kinases = kinases + '<a href="' + evidence['properties'][j]['bioentity']['link'] + '">' + evidence['properties'][j]['bioentity']['display_name'] + '</a>';
        }
        else {
            if(site_functions.length > 0) {
                site_functions = site_functions + ', ';
            }
            site_functions = site_functions + evidence['properties'][j]['note'];
        }
    }

    var source = evidence['source']['display_name'];
    if(source == "PhosphoGRID") {
        var gene_id = null;
        for(var j=0; j < locus['aliases'].length; j++) {
            if(locus['aliases'][j]['category'] == 'Gene ID' && locus['aliases'][j]['source']['display_name'] == 'BioGRID') {
                gene_id = locus['aliases'][j]['display_name'];
            }
        }
        if(gene_id != null) {
	        source = create_link(source, "http://www.phosphogrid.org/sites/" + gene_id + "/" + evidence['locus']['format_name'] + ".phospho", true);
        }
	}
    var type = evidence['type'];
    var reference = "";
    if (evidence.source.format_name !== "PhosphoGRID") {
        var _r = evidence.reference;
        reference = "<span><a href='" + _r.link + "'>" + _r.display_name + "</a> <small>PMID: " + _r.pubmed_id + "</small></span>";
    } 

    return [evidence['id'], evidence['locus']['id'], bioent, evidence['locus']['format_name'], site_residue + site_index, site_functions, type, kinases, source, reference];
}

function history_data_to_table(evidence) {
    var bioent = create_link(evidence['locus']['display_name'], evidence['locus']['link'], false);

    var references = [];
    for(var j=0; j < evidence['references'].length; j++) {
        var reference = evidence['references'][j];
        var ref_link = create_link(reference['display_name'], reference['link']);
        if(reference['pubmed_id'] != null) {
            ref_link = ref_link + ' <small>PMID:' + reference['pubmed_id'] + '</small>';
        }
        references.push(ref_link)
    }
    return [evidence['id'], evidence['locus']['id'], bioent, evidence['locus']['format_name'], evidence['date_created'], evidence['note'], references.join(', ')];
}

function protein_experiment_data_to_table(evidence) {
    var bioent = create_link(evidence['locus']['display_name'], evidence['locus']['link'], false);

    var reference = '';
    if(evidence['reference'] != null) {
        reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    }

    var experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);

    return [evidence['id'], evidence['locus']['id'], bioent, evidence['locus']['format_name'], experiment, evidence['data_value'] + ' ' + evidence['data_unit'], reference];
}

function sublabel_data_to_table(evidence, locus, strand, data_id) {
    var coord_version = evidence['coord_version'];
    var seq_version = evidence['seq_version'];
    if(coord_version == 'None') {
        coord_version = '';
    }
    if(seq_version == 'None') {
        seq_version = '';
    }
    var coords = '';
    if(evidence['chromosomal_start'] < evidence['chromosomal_end']) {
        coords = evidence['chromosomal_start'] + '-' + evidence['chromosomal_end'];
    }
    else {
        coords = evidence['chromosomal_end'] + '-' + evidence['chromosomal_start'];
    }

    var display_name = evidence['display_name'];
    if(evidence['bioentity'] != null) {
        display_name = create_link(display_name, evidence['bioentity']['link']);
    }

    return [data_id, locus['id'], locus['display_name'], locus['format_name'], display_name, evidence['relative_start'] + '-' + evidence['relative_end'], coords, strand, coord_version, seq_version];
}

function regulation_data_to_table(evidence, is_regulator) {
    var bioent1 = create_link(evidence['locus1']['display_name'], evidence['locus1']['link']);
	var bioent2 = create_link(evidence['locus2']['display_name'], evidence['locus2']['link']);

	var experiment = '';
	if(evidence['experiment'] != null) {
        experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);
	}
	var strain = '';
	if(evidence['strain'] != null) {
	    strain = create_link(evidence['strain']['display_name'], evidence['strain']['link']);
	}
	var conditions = '';
	if(evidence['properties'].length> 0) {
	    conditions = evidence['properties'][0]['note'];
	}
	var reference = '';
	if(evidence['reference'] != null) {
	    reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
        if(evidence['reference']['pubmed_id'] != null) {
            reference = reference + ' <small>PMID:' + evidence['reference']['pubmed_id'] + '</small>';
        }
	}
	var analyze_value;
    if(is_regulator == null) {
        analyze_value = evidence['locus1']['id'] + ',' + evidence['locus2']['id'];
    }
	else if(is_regulator) {
	    analyze_value = evidence['locus1']['id'];
	}
	else {
	    analyze_value = evidence['locus2']['id'];
	}
  	return [evidence['id'], analyze_value, bioent1, evidence['locus1']['format_name'], bioent2, evidence['locus2']['format_name'], experiment, evidence['assay'], evidence['construct'], conditions, strain, reference];
}

function interaction_data_to_table(evidence, index) {
	var icon;
	if(evidence['note'] != null) {
		icon = create_note_icon(index, evidence['note']);
	}
	else {
		icon = null;
	}

	var bioent1_key = 'locus1';
	var bioent2_key = 'locus2';
	var direction = evidence['bait_hit'];
    var analyze_key;

	if(typeof(locus) !== 'undefined') {
	    if(locus['id'] == evidence['locus1']['id']) {
            if(direction == 'Hit-Bait') {
                direction = 'Hit';
            }
            else {
                direction = 'Bait';
            }
        }
        else {
            bioent1_key = 'locus2';
            bioent2_key = 'locus1';
            if(direction == 'Hit-Bait') {
                direction = 'Bait';
            }
            else {
                direction = 'Hit';
            }
        }
        analyze_key = evidence[bioent2_key]['id']
	}
    else {
        analyze_key = evidence[bioent1_key]['id'] + ',' + evidence[bioent2_key]['id'];
    }

	var experiment = '';
	if(evidence['experiment'] != null) {
		experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);
	}
	var phenotype = '';
	if(evidence['phenotype'] != null) {
		phenotype = create_link(evidence['phenotype']['display_name'], evidence['phenotype']['link']) + '<br><strong>Mutant Type:</strong> ' + evidence['mutant_type'];
	}
	var modification = '';
	if(evidence['modification'] != null) {
		modification = evidence['modification'];
  	}

     bioent1 = create_link(evidence[bioent1_key]['display_name'], evidence[bioent1_key]['link']);
	 bioent2 = create_link(evidence[bioent2_key]['display_name'], evidence[bioent2_key]['link']);

  	var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    if(evidence['reference']['pubmed_id'] != null) {
        reference = reference + ' <small>PMID:' + evidence['reference']['pubmed_id'] + '</small>';
    }

    return [evidence['id'], analyze_key, icon, bioent1, evidence[bioent1_key]['format_name'], bioent2, evidence[bioent2_key]['format_name'], evidence['interaction_type'], experiment, evidence['annotation_type'], direction, modification, phenotype, evidence['source']['display_name'], reference, evidence['note']]
}

function gene_data_to_table(bioent) {
	var bioent_name = create_link(bioent['display_name'], bioent['link']);
  	return [bioent['id'], bioent['id'], bioent['format_name'], bioent_name, bioent['description']];
}

function phenotype_data_to_table(evidence, index) {
	var bioent = create_link(evidence['locus']['display_name'], evidence['locus']['link']);

	var experiment = '';
	if(evidence['experiment'] != null) {
		experiment = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);
		if(evidence['experiment_details'] != null) {
			experiment = experiment + ' ' + create_note_icon('experiment_icon' + index, evidence['experiment_details']);
		}
	}

	var strain = '';
	if(evidence['strain'] != null) {
		strain = create_link(evidence['strain']['display_name'], evidence['strain']['link']);
	}

    var allele = '';
    var chemical = '';
	var reporter = '';
    var note = '';
    for (var j=0; j < evidence['properties'].length; j++) {
        if(evidence['properties'][j]['class_type'] == 'CHEMICAL') {
            if(evidence['properties'][j]['concentration'] != null) {
                chemical = evidence['properties'][j]['concentration'] + ' ' + create_link(evidence['properties'][j]['bioitem']['display_name'], evidence['properties'][j]['bioitem']['link']);
            }
            else {
                chemical = create_link(evidence['properties'][j]['bioitem']['display_name'], evidence['properties'][j]['bioitem']['link']);
            }
            var chemical_icon = create_note_icon('chemical_icon' + index, evidence['properties'][j]['note']);
            if(chemical_icon != '') {
                chemical = chemical + ' ' + chemical_icon;
            }
        }
        else if(evidence['properties'][j]['role'] == 'Allele') {
            allele = '<br><strong>Allele: </strong>' + evidence['properties'][j]['bioitem']['display_name'];
            var allele_icon = create_note_icon('allele_icon' + index, evidence['properties'][j]['note']);
            if(allele_icon != '') {
                allele = allele + ' ' + allele_icon;
            }
        }
        else if(evidence['properties'][j]['role'] == 'Reporter') {
            reporter = '<strong>Reporter: </strong>' + evidence['properties'][j]['bioitem']['display_name'];
            var reporter_icon = create_note_icon('reporter_icon' + index, evidence['properties'][j]['note']);
            if(reporter_icon != '') {
                reporter = reporter + ' ' + reporter_icon;
            }
        }
        else {
	    var classType = evidence['properties'][j]['class_type'];
	    var label = classType.charAt(0).toUpperCase() + classType.slice(1) + ": ";
	    note = note + '<strong>' + label + '</strong>' + evidence['properties'][j]['note'] + '<br>';
        }
    }
    if(evidence['note'] != null) {
        note = note + '<strong>Details: </strong>' + evidence['note'] + '<br>';
    }

	var biocon = create_link(evidence['phenotype']['display_name'], evidence['phenotype']['link']);
	biocon = biocon + '<br>' + reporter;

  	var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    if(evidence['reference']['pubmed_id'] != null) {
        reference = reference + ' <small>PMID:' + evidence['reference']['pubmed_id'] + '</small>';
    }

  	return [evidence['id'], evidence['locus']['id'], bioent, evidence['locus']['format_name'], biocon, experiment, evidence['experiment']['category'], evidence['mutant_type'] + allele, strain, chemical, note, reference];
}

function go_data_to_table(evidence, index) {
	var bioent = create_link(evidence['locus']['display_name'], evidence['locus']['link']);
	var biocon = create_link(evidence['go']['display_name'], evidence['go']['link']);
  	var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    if(evidence['reference']['pubmed_id'] != null) {
        reference = reference + ' <small>PMID:' + evidence['reference']['pubmed_id'] + '</small>';
    }

    var evidence_code = null;
    if(evidence['experiment'] != null) {
        evidence_code = create_link(evidence['experiment']['display_name'], evidence['experiment']['link']);;
    }
    else {
        evidence_code = evidence['go_evidence'];
    }

  	var with_entry = null;
	var relationship_entry = null;

  	for(var j=0; j < evidence['properties'].length; j++) {
  		var condition = evidence['properties'][j];
        var obj = null;
        if('bioitem' in condition) {
            obj = condition['bioitem'];
        }
        else if('bioentity' in condition) {
            obj = condition['bioentity'];
        }
        else if('bioconcept' in condition) {
            obj = condition['bioconcept'];
        }

  		if(condition['role'] == 'With' || condition['role'] == 'From') {
  			var new_with_entry;
            if(obj['link'] == null) {
                new_with_entry = obj['display_name'];
            }
            else {
                new_with_entry = create_link(obj['display_name'], obj['link'], obj['class_type'] != 'GO' && obj['class_type'] != 'LOCUS');
            }
	  		if(with_entry == null) {
	  			with_entry = new_with_entry
	  		}
	  		else {
	  			with_entry = with_entry + ', ' + new_with_entry
	  		}
	  	}
	  	else if(obj != null) {

	  		var new_rel_entry = condition['role'] + ' ';
            if(obj['link'] == null) {
                new_rel_entry = new_rel_entry + obj['display_name'];
            }
            else {
                new_rel_entry = new_rel_entry + create_link(obj['display_name'], obj['link']);
            }
	  		if(relationship_entry == null) {
  				relationship_entry = new_rel_entry
  			}
  			else {
  				relationship_entry = relationship_entry + ', ' + new_rel_entry
  			}
	  	}

  	}
  	if(with_entry != null) {
  		evidence_code = evidence_code + ' with ' + with_entry;
  	}

    var qualifier = evidence['qualifier'];
    if(qualifier == 'involved in' || qualifier == 'enables' || qualifier == 'part of') {
        qualifier = '';
    }

  	return [evidence['id'], evidence['locus']['id'], bioent, evidence['locus']['format_name'], biocon, evidence['go']['go_id'], qualifier, evidence['go']['go_aspect'], evidence['annotation_type'], evidence_code, evidence['source']['display_name'], evidence['date_created'], relationship_entry, reference];
}
