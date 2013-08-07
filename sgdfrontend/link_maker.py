'''
Created on Mar 6, 2013

@author: kpaskov
'''
from sgdfrontend.config import backend_url, on_the_fly_url

backend_start = backend_url
frontend_start = ''

def add_format_name_params(link, is_backend, key_to_format_name):
    params = {}
    for key, format_name in key_to_format_name.iteritems():
        if format_name is not None:
            params[key] = format_name
        
    if is_backend:
        full_link = backend_start + link + '&'.join([key + '=' + value for key, value in params.iteritems()]) + '&callback=?'
    else:
        full_link = frontend_start + link + '&'.join([key + '=' + value for key, value in params.iteritems()])

    return full_link

def create_filename(format_names, ending):
    return '_'.join(filter(None, format_names)) + ending

#GO Links
def go_evidence_link(bioent_key=None, biocon_key=None):
    return add_format_name_params('/go_evidence?', False, {'bioent':bioent_key, 'biocon': biocon_key})

def go_overview_table_link(bioent_key=None, biocon_key=None, reference_key=None):
    return add_format_name_params('/go_overview_table?', True, {'bioent':bioent_key, 'biocon': biocon_key, 'reference':reference_key})
def go_evidence_table_link(bioent_key=None, biocon_key=None):
    return add_format_name_params('/go_evidence_table?', True, {'bioent':bioent_key, 'biocon': biocon_key})
def go_graph_link(bioent_key=None, biocon_key=None):
    return add_format_name_params('/go_graph?', True, {'bioent':bioent_key, 'biocon': biocon_key})
def go_ontology_graph_link(biocon_key=None):
    return add_format_name_params('/go_ontology_graph?', True, {'biocon': biocon_key})

def go_f_filename(bioent_key=None):
    return create_filename([bioent_key], '_function_go_terms')  
def go_p_filename(bioent_key=None):
    return create_filename([bioent_key], '_process_go_terms')
def go_c_filename(bioent_key=None):
    return create_filename([bioent_key], '_component_go_terms')  
def go_filename(biocon_key=None, reference_key=None):
    return create_filename([biocon_key, reference_key], '_genes')

def go_f_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([bioent_key, biocon_key], '_function_go_term_evidence')
def go_p_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([bioent_key, biocon_key], '_process_go_term_evidence')
def go_c_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([bioent_key, biocon_key], '_compartment_go_term_evidence')
def go_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([biocon_key, biocon_key], '_go_term_evidence')

#Phenotype Links
def phenotype_evidence_link(bioent_key=None, biocon_key=None):
    return add_format_name_params('/phenotype_evidence?', False, {'bioent':bioent_key, 'biocon': biocon_key})

def phenotype_overview_table_link(bioent_key=None, biocon_key=None, reference_key=None, chemical_key=None):
    return add_format_name_params('/phenotype_overview_table?', True, {'bioent':bioent_key, 'biocon': biocon_key, 'reference':reference_key, 'chemical':chemical_key})
def phenotype_evidence_table_link(bioent_key=None, biocon_key=None):
    return add_format_name_params('/phenotype_evidence_table?', True, {'bioent':bioent_key, 'biocon': biocon_key})
def phenotype_ontology_graph_link(biocon_key=None):
    return add_format_name_params('/phenotype_ontology_graph?', True, {'biocon': biocon_key})
def phenotype_graph_link(bioent_key=None, biocon_key=None):
    return add_format_name_params('/phenotype_graph?', True, {'biocon': biocon_key, 'bioent':bioent_key})

def cellular_phenotype_filename(bioent_key=None, reference_key=None):
    return create_filename([bioent_key, reference_key], '_cellular_phenotypes')
def chemical_phenotype_filename(bioent_key=None, reference_key=None):
    return create_filename([bioent_key, reference_key], '_chemical_phenotypes')
def pp_rna_phenotype_filename(bioent_key=None, reference_key=None):
    return create_filename([bioent_key, reference_key], '_pp_rna_phenotypes')
def phenotype_filename(biocon_key=None, chemical_key=None):
    return create_filename([biocon_key, chemical_key], '_phenotypes')

def cellular_phenotype_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([bioent_key, biocon_key], '_cellular_phenotype_evidence')
def chemical_phenotype_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([bioent_key, biocon_key], '_chemical_phenotype_evidence')
def pp_rna_phenotype_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([bioent_key, biocon_key], '_pp_rna_phenotype_evidence')
def phenotype_evidence_filename(bioent_key=None, biocon_key=None):
    return create_filename([bioent_key, biocon_key], '_phenotype_evidence')

#Interaction Links
def interaction_evidence_link(bioent_key=None, biocon_key=None):
    return add_format_name_params('/interaction_evidence?', False, {'bioent':bioent_key, 'biocon': biocon_key})

def interaction_overview_table_link(bioent_key=None, bioent_type='LOCUS', reference_key=None):
    return add_format_name_params('/interaction_overview_table?', True, {'bioent':bioent_key, 'bioent_type':bioent_type, 'reference':reference_key})
def interaction_evidence_table_link(bioent_key=None, bioent_type='LOCUS', biorel_key=None):
    return add_format_name_params('/interaction_evidence_table?', True, {'bioent':bioent_key, 'bioent_type':bioent_type, 'biorel': biorel_key})
def interaction_graph_link(bioent_key=None, bioent_type='LOCUS'):
    return add_format_name_params('/interaction_graph?', True, {'bioent':bioent_key, 'bioent_type':bioent_type})
def interaction_evidence_resource_link(bioent_key=None, bioent_type='LOCUS'):
    return add_format_name_params('/interaction_evidence_resources?', True, {'bioent':bioent_key, 'bioent_type':bioent_type})

def interaction_filename(bioent_key=None, reference_key=None):
    return create_filename([bioent_key, reference_key], '_interactions')
def interaction_evidence_filename(bioent_key=None, biorel_key=None):
    return create_filename([bioent_key, biorel_key], '_interaction_evidence')

def genetic_interactor_listname(bioent_key=None):
    return bioent_key + ' Genetic Interactors'
def physical_interactor_listname(bioent_key=None):
    return bioent_key + ' Physical Interactors'
def all_interactor_listname(bioent_key=None):
    return bioent_key + ' All Interactors'
def both_interactor_listname(bioent_key=None):
    return bioent_key + ' Both Genetic and Physical Interactors'

#On the fly links
def analyze_link():
    return frontend_start + '/analyze'

#Bioent-Evidence Links
def bioent_evidence_link(bioent_key=None):
    return add_format_name_params('/bioent_evidence?', False, {'bioent':bioent_key})

def bioent_overview_table_link(bioent_key=None, reference_key=None):
    return add_format_name_params('/bioent_overview_table?', True, {'bioent':bioent_key, 'reference': reference_key})
def bioent_evidence_table_link(bioent_key):
    return add_format_name_params('/bioent_evidence_table?', True, {'bioent':bioent_key})
def litguide_graph_link(bioent_key):
    return add_format_name_params('/litguide_graph?', True, {'bioent':bioent_key})

def bioent_filename(reference_key=None):
    return create_filename([reference_key], '_litguide')


#Biocon links
def biocon_link(biocon_name, biocon_type):
    return backend_start + '/biocon/' + biocon_type + '/' + biocon_name
def go_link(biocon_name):
    return backend_start + '/go/' + biocon_name
def phenotype_link(biocon_name):
    return backend_start + '/phenotype/' + biocon_name
    
#Bioentity links
def bioent_link(bioent_name, bioent_type):
    return backend_start + '/bioent/' + bioent_type + '/' + bioent_name
def locus_link(bioent_name):
    return backend_start + '/locus/' + bioent_name

#Biorelation links
def biorel_link(biorel_name, biorel_type):
    return backend_start + '/biorel/' + biorel_type + '/' + biorel_name

#Chemical links
def chemical_link(chemical_name):
    return backend_start + '/chemical/' + chemical_name

#Reference links
def reference_link(reference_name):
    return backend_start + '/reference/' + reference_name
def reference_graph_link(reference_key=None):
    return add_format_name_params('/reference_graph?', True, {'reference': reference_key})
def author_link(author_name):
    return backend_start + '/author/' + author_name
def assoc_reference_link(author_key):
    return add_format_name_params('/assoc_references?', True, {'author':author_key})

def list_link():
    return on_the_fly_url + '/list'
def go_enrichment_link():
    return add_format_name_params('/go_enrichment?', True, {})
def enrichment_header_filename():
    return 'go_enrichment'

#Search links
def search_results_link(search_str, biotype, page):
    return backend_start + '/search_results?keyword=' + search_str + '&bio_type=' + biotype + '&page=' + page + '&callback=?'
