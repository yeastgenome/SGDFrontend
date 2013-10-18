'''
Created on Oct 1, 2013

@author: kpaskov
'''

from locust import Locust, TaskSet, task

class WebsiteTasks(TaskSet):
    def on_start(self):
        pass

    # Interaction
    @task
    def interaction_overview(self):
        self.client.get("/locus/ABF1/interaction_overview")
        
    @task
    def interaction_details(self):
        self.client.get("/locus/ABF1/interaction_details")
        
    @task
    def interaction_graph(self):
        self.client.get("/locus/ABF1/interaction_graph")
        
    @task
    def interaction_resources(self):
        self.client.get("/locus/ABF1/interaction_resources")
     
    #Literature   
    @task
    def literature_overview(self):
        self.client.get("/locus/ABF1/literature_overview")
        
    @task
    def literature_details(self):
        self.client.get("/locus/ABF1/literature_details")
        
    @task
    def literature_graph(self):
        self.client.get("/locus/ABF1/literature_graph")
        
    @task
    def go_references(self):
        self.client.get("/locus/ABF1/go_references")
        
    @task
    def phenotype_references(self):
        self.client.get("/locus/ABF1/phenotype_references")
        
    @task
    def interaction_references(self):
        self.client.get("/locus/ABF1/interaction_references")
        
    @task
    def regulation_references(self):
        self.client.get("/locus/ABF1/regulation_references")
        
    # Regulation
    @task
    def regulation_overview(self):
        self.client.get("/locus/ABF1/regulation_overview")
        
    @task
    def regulation_details(self):
        self.client.get("/locus/ABF1/regulation_details")
        
    @task
    def regulation_graph(self):
        self.client.get("/locus/ABF1/regulation_graph")
        
    @task
    def protein_domain_details(self):
        self.client.get("/locus/ABF1/protein_domain_details")
        
    @task
    def binding_site_details(self):
        self.client.get("/locus/ABF1/binding_site_details")

#    @task
#    def interactions(self):
#        self.client.get("/locus/ABF1/interactions")
#
#    @task
#    def regulation(self):
#        self.client.get("/locus/ABF1/regulation")
#
#    @task
#    def literature(self):
#        self.client.get("/locus/ABF1/literature")
#
#    @task
#    def interactions(self):
#        self.client.get("/cgi-bin/interactions.fpl?dbid=S000001595")
#
#    @task
#    def regulation(self):
#        self.client.get("/regulation/S000001595")
#
#    #@task
#    #def literature(self):
#    #    self.client.get("/cgi-bin/locus.fpl?dbid=S000001595")
#    
#    @task
#    def gotermfinder(self):
#        self.client.get("/cgi-bin/GO/goTermFinder.pl")

class WebsiteUser(Locust):
    task_set = WebsiteTasks
    min_wait = 5000
    max_wait = 15000
    #host = "http://www.yeastgenome.org"
    host = "http://sgd-ng1.stanford.edu/webservice"