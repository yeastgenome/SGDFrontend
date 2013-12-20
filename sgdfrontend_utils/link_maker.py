'''
Created on Mar 6, 2013

@author: kpaskov
'''

#Interaction Links
def interaction_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_overview'
def interaction_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_details?callback=?'
def interaction_graph_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_graph?callback=?'
def interaction_resources_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_resources?callback=?'

#Regulation Links
def regulation_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_overview'
def regulation_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_details?callback=?'
def regulation_target_enrichment_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_target_enrichment?callback=?'
def regulation_graph_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_graph?callback=?'

#GO Links
def go_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/go_overview'
def go_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/go_details?callback=?'
def go_details_biocon_link(backend_start, biocon, with_children=False):
    if with_children:
        return backend_start + '/go/' + str(biocon) + '/locus_details_all?callback=?'
    else:
        return backend_start + '/go/' + str(biocon) + '/locus_details?callback=?'
def go_link(backend_start, go):
    return backend_start + '/go/' + go + '/overview'
def go_ontology_graph_link(backend_start, go):
    return backend_start + '/go/' + go + '/ontology_graph?callback=?'

#Phenotype Links
def phenotype_ontology_link():
    return '/ontology/ypo/overview'
def observable_link(observable):
    observable = observable.replace(' ', '_')
    observable = observable.replace('/', '-')
    return '/observable/' + observable + '/overview'

def phenotype_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/phenotype_overview'
def phenotype_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/phenotype_details?callback=?'
def phenotype_resources_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/phenotype_resources?callback=?'
def phenotype_details_biocon_link(backend_start, biocon, with_children=False):
    if with_children:
        return backend_start + '/phenotype/' + str(biocon) + '/locus_details_all?callback=?'
    else:
        return backend_start + '/phenotype/' + str(biocon) + '/locus_details?callback=?'
def phenotype_link(backend_start, phenotype):
    return backend_start + '/phenotype/' + phenotype + '/overview'
def phenotype_ontology_graph_link(backend_start, phenotype):
    return backend_start + '/phenotype/' + phenotype + '/ontology_graph?callback=?'
def ypo_ontology_link(backend_start):
    return backend_start + '/phenotype/ontology?callback=?'

#Protein Links
def protein_domain_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/protein_domain_details?callback=?'
def binding_site_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/binding_site_details?callback=?'

#On the fly links
def analyze_link():
    return '/analyze'
def download_reference_link():
    return '/download_citations'
def go_enrichment_link(backend_start):
    return backend_start + '/go_enrichment'
def enrichment_link():
    return '/enrichment'
def download_citations_link():
    return '/download_citations'
def download_table_link():
    return '/download_table'
def download_image_link():
    return '/download_image'

#Literature Links
def literature_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/literature_overview'
def literature_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/literature_details?callback=?'
def literature_graph_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/literature_graph?callback=?'
    
#Bioentity links
def bioentity_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + bioent + '/overview'
def tab_link(backend_start, bioent):
    return backend_start + '/locus/' + bioent + '/tabs'

#Chemical Links

def chemical_ontology_link():
    return '/chemical/chebi_ontology/overview'

def chemical_details_chem_link(backend_start, chemical):
    return backend_start + '/chemical/' + str(chemical) + '/locus_details?callback=?'
def chemical_link(backend_start, chemical):
    return backend_start + '/chemical/' + chemical + '/overview'
def chemical_ontology_graph_link(backend_start, chemical):
    return backend_start + '/chemical/' + chemical + '/ontology_graph?callback=?'

#List links
def bioent_list_link(backend_start):
    return backend_start + '/bioentity_list'
def citation_list_link(backend_start):
    return backend_start + '/reference_list'


    

