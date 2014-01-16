function domain_data_to_table(evidence) {
    var bioent = create_link(evidence['protein']['display_name'], evidence['protein']['link'], false);
    var domain;
    if(evidence['domain']['link'] != null) {
        domain = create_link(evidence['domain']['display_name'], evidence['domain']['link'], true);
    }
    else {
        domain = evidence['domain']['display_name']
    }

    var coord_range = evidence['start'] + '-' + evidence['end'];

    var description = evidence['domain_description'];
    return [evidence['id'], bioent, coord_range, domain, description, evidence['source']];
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
	    reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);;
	}
	var analyze_value = '';
	if(is_regulator) {
	    analyze_value = evidence['bioentity1']['id'];
	}
	else {
	    analyze_value = evidence['bioentity2']['id'];
	}
  	return [evidence['id'], analyze_value, bioent1, evidence['bioentity1']['format_name'], bioent2, evidence['bioentity2']['format_name'], experiment, conditions, strain, evidence['source'], reference];
}

function interaction_data_to_table(evidence, index) {
	var icon;
	if(evidence['note'] != null) {
		icon = create_note_icon(index, evidence['note']);
	}
	else {
		icon = null;
	}

	var bioent1 = create_link(evidence['bioentity1']['display_name'], evidence['bioentity1']['link'])
	var bioent2 = create_link(evidence['bioentity2']['display_name'], evidence['bioentity2']['link'])

	var experiment = '';
	if(evidence['experiment'] != null) {
		experiment = evidence['experiment']['display_name'];
	}
	var phenotype = '';
	if(evidence['phenotype'] != null) {
	    phenotype = evidence['phenotype']['display_name'];
		//phenotype = create_link(evidence['phenotype']['display_name'], evidence['phenotype']['link']);
	}
	var modification = '';
	if(evidence['modification'] != null) {
		modification = evidence['modification'];
  	}
  	var reference = create_link(evidence['reference']['display_name'], evidence['reference']['link']);
    return [evidence['id'], evidence['bioentity2']['id'], icon, bioent1, evidence['bioentity1']['format_name'], bioent2, evidence['bioentity2']['format_name'], evidence['interaction_type'], experiment, evidence['annotation_type'], evidence['direction'], modification, phenotype, evidence['source'], reference, evidence['note']]
}

function gene_data_to_table(bioent) {
	var bioent_name = create_link(bioent['display_name'], bioent['link'])
  	return [bioent['id'], bioent['id'], bioent['format_name'], bioent_name, bioent['description']]
}