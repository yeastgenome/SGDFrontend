'''
Created on Mar 6, 2013

@author: kpaskov
'''
from sgdfrontend.config import backend_url

backend_start = backend_url
frontend_start = ''

#GO Links
def go_references_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/go_references?callback=?'

#Phenotype Links
def phenotype_references_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/phenotype_references?callback=?'

#Interaction Links
def interaction_page_link(bioent, bioent_type):
    return frontend_start + '/' + bioent_type + '/' + str(bioent) + '/interactions'

def interaction_overview_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/interaction_overview?callback=?'
def interaction_details_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/interaction_details?callback=?'
def interaction_graph_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/interaction_graph?callback=?'
def interaction_resources_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/interaction_resources?callback=?'
def interaction_references_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/interaction_references?callback=?'

#Regulation Links
def regulation_page_link(bioent, bioent_type):
    return frontend_start + '/' + bioent_type + '/' + str(bioent) + '/regulation'

def regulation_overview_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/regulation_overview?callback=?'
def regulation_details_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/regulation_details?callback=?'
def regulation_graph_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/regulation_graph?callback=?'
def regulation_references_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/regulation_references?callback=?'

#Protein Links
def protein_domain_details_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/protein_domain_details?callback=?'
def binding_site_details_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/binding_site_details?callback=?'

#On the fly links
def analyze_link():
    return frontend_start + '/analyze'
def download_reference_link():
    return frontend_start + '/download_citations'

#Literature Links
def literature_page_link(bioent, bioent_type):
    return frontend_start + '/' + bioent_type + '/' + str(bioent) + '/literature'

def literature_overview_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/literature_overview?callback=?'
def literature_details_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/literature_details?callback=?'
def literature_graph_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + str(bioent) + '/literature_graph?callback=?'
    
#Bioentity links
def bioentity_overview_link(bioent, bioent_type):
    return backend_start + '/' + bioent_type + '/' + bioent + '/overview?callback=?'

#List links
def bioent_list_link():
    return backend_start + '/bioent_list'
def citation_list_link():
    return backend_start + '/reference_list'

def download_citations_link():
    return frontend_start + '/download_citations'

def download_table_link():
    return frontend_start + '/download_table'
    

