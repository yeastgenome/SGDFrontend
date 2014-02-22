function domain_data_to_table(evidence) {
    var bioent = create_link(evidence['protein']['locus']['display_name'], evidence['protein']['locus']['link'], false);
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

    return [evidence['id'], evidence['protein']['locus']['id'], bioent, evidence['protein']['locus']['format_name'], coord_range, domain, description, evidence['source']];
}

function phosphorylation_data_to_table(evidence) {
    var bioent = create_link(evidence['protein']['locus']['display_name'], evidence['protein']['locus']['link'], false);

    var site_index = evidence['site_index'];
    var site_residue = evidence['site_residue'];

    var reference = '';
    if(evidence['reference'] != null) {
        reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    }

    return [evidence['id'], evidence['protein']['locus']['id'], bioent, evidence['protein']['locus']['format_name'], site_index, site_residue, evidence['source'], reference];
}

function regulation_data_to_table(evidence, is_regulator) {
    var bioent1 = create_link(evidence['bioentity1']['display_name'], evidence['bioentity1']['link'])
	var bioent2 = create_link(evidence['bioentity2']['display_name'], evidence['bioentity2']['link'])

	var experiment = '';
	if(evidence['experiment'] != null) {
	    experiment = evidence['experiment']['display_name'];
	}
	var strain = '';
	if(evidence['strain'] != null) {
	    strain = evidence['strain']['display_name'];
	}
	var conditions = '';
	if(evidence['conditions'].length> 0) {
	    conditions = evidence['conditions'][0];
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
        analyze_value = evidence['bioentity1']['id'] + ',' + evidence['bioentity2']['id'];
    }
	else if(is_regulator) {
	    analyze_value = evidence['bioentity1']['id'];
	}
	else {
	    analyze_value = evidence['bioentity2']['id'];
	}
	var source = evidence['source'];
	if(source == "YEASTRACT") {
	    source = create_link(source, "http://yeastract.com/view.php?existing=regulation&proteinname=" + evidence["bioentity1"]["display_name"] + "p&orfname=" + evidence["bioentity2"]["display_name"], true);
	}
  	return [evidence['id'], analyze_value, bioent1, evidence['bioentity1']['format_name'], bioent2, evidence['bioentity2']['format_name'], experiment, conditions, strain, source, reference];
}

function interaction_data_to_table(evidence, index) {
	var icon;
	if(evidence['note'] != null) {
		icon = create_note_icon(index, evidence['note']);
	}
	else {
		icon = null;
	}

	var bioent1_key = 'bioentity1';
	var bioent2_key = 'bioentity2';
	var direction = evidence['bait_hit'];
    var analyze_key;

	if(locus_id != null) {
	    if(locus_id == evidence['bioentity1']['id']) {
            if(direction == 'Hit-Bait') {
                direction = 'Hit';
            }
            else {
                direction = 'Bait';
            }
        }
        else {
            bioent1_key = 'bioentity2';
            bioent2_key = 'bioentity1';
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
		experiment = evidence['experiment']['display_name'];
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

    return [evidence['id'], analyze_key, icon, bioent1, evidence[bioent1_key]['format_name'], bioent2, evidence[bioent2_key]['format_name'], evidence['interaction_type'], experiment, evidence['annotation_type'], direction, modification, phenotype, evidence['source'], reference, evidence['note']]
}

function gene_data_to_table(bioent) {
	var bioent_name = create_link(bioent['display_name'], bioent['link'])
  	return [bioent['id'], bioent['id'], bioent['format_name'], bioent_name, bioent['description']]
}

function phenotype_data_to_table(evidence, index) {
	var bioent = create_link(evidence['bioentity']['display_name'], evidence['bioentity']['link']);

	var experiment = '';
	if(evidence['experiment'] != null) {
		experiment = evidence['experiment']['display_name'];
		if(evidence['experiment']['details'] != null) {
			experiment = experiment + ' ' + create_note_icon('experiment_icon' + index, evidence['experiment']['details']);
		}
	}

	var strain = '';
	if(evidence['strain'] != null) {
		strain = evidence['strain']['display_name'];
	}

	var chemical = '';
	if(evidence['chemical'] != null) {
		if(evidence['chemical']['amount'] != null) {
			chemical = evidence['chemical']['amount'] + ' ' + create_link(evidence['chemical']['display_name'], evidence['chemical']['link']);
		}
		else {
			chemical = create_link(evidence['chemical']['display_name'], evidence['chemical']['link']);
		}
		var chemical_icon = create_note_icon('chemical_icon' + index, evidence['chemical']['note']);
		if(chemical_icon != '') {
			chemical = chemical + ' ' + chemical_icon;
		}
	}

	var allele = '';
	if(evidence['allele'] != null) {
		allele = '<br><strong>Allele: </strong>' + evidence['allele']['display_name'];
		var allele_icon = create_note_icon('allele_icon' + index, evidence['allele']['note']);
		if(allele_icon != '') {
			allele = allele + ' ' + allele_icon;
		}
	}

	var reporter = '';
	if(evidence['reporter'] != null) {
		reporter = '<strong>Reporter: </strong>' + evidence['reporter']['display_name'];
		var reporter_icon = create_note_icon('reporter_icon' + index, evidence['reporter']['note']);
		if(reporter_icon != '') {
			reporter = reporter + ' ' + reporter_icon;
		}
	}

    var note = '';
    for (var j=0; j < evidence['condition'].length; j++) {
        note = note + '<strong>Condition: </strong>' + evidence['condition'][j] + '<br>';
    }
    if(evidence['note'] != null) {
        note = note + '<strong>Details: </strong>' + evidence['note'] + '<br>';
    }

	var biocon = create_link(evidence['bioconcept']['display_name'], evidence['bioconcept']['link']);
	biocon = biocon + '<br>' + reporter;

  	var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    if(evidence['reference']['pubmed_id'] != null) {
        reference = reference + ' <small>PMID:' + evidence['reference']['pubmed_id'] + '</small>';
    }

    var experiment_category = evidence['experiment']['display_name'];
    if('experiment_type_category' in evidence) {
        experiment_category = evidence['experiment_type_category'];
    }

  	return [evidence['id'], evidence['bioentity']['id'], bioent, evidence['bioentity']['format_name'], biocon, experiment, experiment_category, evidence['mutant_type'] + allele, strain, chemical, note, reference];
}

function go_data_to_table(evidence, index) {
	var bioent = create_link(evidence['bioentity']['display_name'], evidence['bioentity']['link']);
	var biocon = create_link(evidence['bioconcept']['display_name'], evidence['bioconcept']['link']);
  	var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    if(evidence['reference']['pubmed_id'] != null) {
        reference = reference + ' <small>PMID:' + evidence['reference']['pubmed_id'] + '</small>';
    }

  	var with_entry = null;
	var relationship_entry = null;

  	for(var j=0; j < evidence['conditions'].length; j++) {
  		var condition = evidence['conditions'][j];
  		if(condition['role'] == 'With' || condition['role'] == 'From') {
  			var new_with_entry;
            if(condition['obj']['link'] == null) {
                new_with_entry = condition['obj']['display_name'];
            }
            else {
                new_with_entry = create_link(condition['obj']['display_name'], condition['obj']['link'], condition['obj']['class_type'] != 'GO' && condition['obj']['class_type'] != 'LOCUS');
            }
	  		if(with_entry == null) {
	  			with_entry = new_with_entry
	  		}
	  		else {
	  			with_entry = with_entry + ', ' + new_with_entry
	  		}
	  	}
	  	else if(condition['obj'] != null) {
	  		var new_rel_entry = condition['role'] + ' '
            if(condition['obj']['link'] == null) {
                new_rel_entry = new_rel_entry + condition['obj']['display_name'];
            }
            else {
                new_rel_entry = new_rel_entry + create_link(condition['obj']['display_name'], condition['obj']['link']);
            }
	  		if(relationship_entry == null) {
  				relationship_entry = new_rel_entry
  			}
  			else {
  				relationship_entry = relationship_entry + ', ' + new_rel_entry
  			}
	  	}

  	}
	var icon = create_note_icon(index, relationship_entry);

  	var evidence_code = evidence['code'];
  	if(with_entry != null) {
  		evidence_code = evidence_code + ' with ' + with_entry;
  	}

    var qualifier = evidence['qualifier'];
    if(qualifier == 'involved in' || qualifier == 'enables' || qualifier == 'part of') {
        qualifier = '';
    }

  	return [evidence['id'], evidence['bioentity']['id'], icon, bioent, evidence['bioentity']['format_name'], biocon, evidence['bioconcept']['go_id'], qualifier, evidence['bioconcept']['aspect'], evidence['method'], evidence_code, evidence['source'], evidence['date_created'], reference, relationship_entry];
}