'''
Created on Mar 6, 2013

@author: kpaskov
'''

#Interaction Links
def interaction_page_link(bioent):
    return '/locus/' + str(bioent) + '/interaction'

def interaction_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_overview'
def interaction_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_details?callback=?'
def interaction_graph_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_graph?callback=?'
def interaction_resources_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_resources?callback=?'

#Regulation Links
def regulation_page_link(bioent):
    return '/locus/' + str(bioent) + '/regulation'

def regulation_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_overview'
def regulation_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_details?callback=?'
def regulation_target_enrichment_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_target_enrichment?callback=?'
def regulation_graph_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_graph?callback=?'

#GO Links
def go_page_link(bioent):
    return '/locus/' + str(bioent) + '/go'
def go_biocon_page_link(biocon):
    return '/go/' + str(biocon)

def go_overview_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/go_overview?callback=?'
def go_details_link(backend_start, bioent):
    return backend_start + '/locus/' + str(bioent) + '/go_details?callback=?'
def go_details_biocon_link(backend_start, biocon):
    return backend_start + '/go/' + str(biocon) + '/locus_details?callback=?'

#Phenotype Links
def phenotype_page_link(bioent):
    return frontend_start + '/locus/' + str(bioent) + '/go'
def phenotyp_biocon_page_link(biocon):
    return frontend_start + '/go/' + str(biocon)

def phenotype_overview_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/phenotype_overview'
def phenotype_details_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/phenotype_details?callback=?'
def phenotype_resources_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/phenotype_resources?callback=?'
def phenotype_details_biocon_link(biocon):
    return backend_start + '/phenotype/' + str(biocon) + '/locus_details?callback=?'

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
def literature_page_link(bioent):
    return '/locus/' + str(bioent) + '/literature'

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
    return backend_start + '/locus/' + bioent + '/tabs?callback=?'

#Bioconcept links
def phenotype_link(phenotype):
    return backend_start + '/phenotype/' + phenotype + '/overview'
def phenotype_overview_link(bioent):
    return backend_start + '/locus/' + bioent + '/phenotype_overview'
def go_overview_link(go):
    return backend_start + '/go/' + go + '/overview'
def phenotype_locus_details_link(phenotype):
    return backend_start + '/phenotype/' + phenotype + '/locus_details?callback=?'
def go_locus_details_link(go):
    return backend_start + '/go/' + go + '/locus_details?callback=?'
def phenotype_ontology_graph_link(phenotype):
    return backend_start + '/phenotype/' + phenotype + '/ontology_graph?callback=?'
def phenotype_ontology_link():
    return frontend_start + '/phenotype/apo_ontology/overview'

#Chemical links
def chemical_link(chemical):
    return backend_start + '/chemical/' + chemical + '/overview'
def chemical_locus_details_link(chemical):
    return backend_start + '/chemical/' + chemical + '/locus_details?callback=?'
def chemical_ontology_graph_link(chemical):
    return backend_start + '/chemical/' + chemical + '/ontology_graph?callback=?'

#List links
def bioent_list_link(backend_start):
    return backend_start + '/bioentity_list'
def citation_list_link(backend_start):
    return backend_start + '/reference_list'


    

