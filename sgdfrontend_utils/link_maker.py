'''
Created on Mar 6, 2013

@author: kpaskov
'''
from sgdfrontend.config import backend_url#, dev_url

backend_start = backend_url
frontend_start = ''

#GO Links
def go_page_link(bioent):
    return frontend_start + '/locus/' + str(bioent) + '/go'
def go_biocon_page_link(biocon):
    return frontend_start + '/go/' + str(biocon)

#def go_overview_link(bioent):
#    return dev_url + '/locus/' + str(bioent) + '/go_overview?callback=?'
#def go_details_link(bioent):
#    return dev_url + '/locus/' + str(bioent) + '/go_details?callback=?'
#def go_details_biocon_link(biocon):
#    return dev_url + '/go/' + str(biocon) + '/locus_details?callback=?'

#Phenotype Links
def phenotype_page_link(bioent):
    return frontend_start + '/locus/' + str(bioent) + '/go'
def phenotyp_biocon_page_link(biocon):
    return frontend_start + '/go/' + str(biocon)

#def phenotype_overview_link(bioent):
#    return dev_url + '/locus/' + str(bioent) + '/phenotype_overview?callback=?'
#def phenotype_details_link(bioent):
#    return dev_url + '/locus/' + str(bioent) + '/phenotype_details?callback=?'
#def phenotype_details_biocon_link(biocon):
#    return dev_url + '/phenotype/' + str(biocon) + '/locus_details?callback=?'

#Interaction Links
def interaction_page_link(bioent):
    return frontend_start + '/locus/' + str(bioent) + '/interactions'

def interaction_overview_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_overview'
def interaction_details_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_details?callback=?'
def interaction_graph_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_graph?callback=?'
def interaction_resources_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/interaction_resources?callback=?'

#Regulation Links
def regulation_page_link(bioent):
    return frontend_start + '/locus/' + str(bioent) + '/regulation'

def regulation_overview_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_overview'
def regulation_details_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_details?callback=?'
def regulation_target_enrichment_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_target_enrichment?callback=?'
def regulation_graph_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/regulation_graph?callback=?'

#Protein Links
def protein_domain_details_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/protein_domain_details?callback=?'
def binding_site_details_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/binding_site_details?callback=?'

#On the fly links
def analyze_link():
    return frontend_start + '/analyze'
def download_reference_link():
    return frontend_start + '/download_citations'
def go_enrichment_link():
    return backend_start + '/go_enrichment'
def enrichment_link():
    return frontend_start + '/enrichment'

#Literature Links
def literature_page_link(bioent):
    return frontend_start + '/locus/' + str(bioent) + '/literature'

def literature_overview_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/literature_overview'
def literature_details_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/literature_details?callback=?'
def literature_graph_link(bioent):
    return backend_start + '/locus/' + str(bioent) + '/literature_graph?callback=?'
    
#Bioentity links
def bioentity_overview_link(bioent):
    return backend_start + '/locus/' + bioent + '/overview'
def tab_link(bioent):
    return backend_start + '/locus/' + bioent + '/tabs?callback=?'

#List links
def bioent_list_link():
    return backend_start + '/bioentity_list'
def citation_list_link():
    return backend_start + '/reference_list'

def download_citations_link():
    return frontend_start + '/download_citations'

def download_table_link():
    return frontend_start + '/download_table'
    

