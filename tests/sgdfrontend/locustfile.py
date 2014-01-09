'''
Created on Oct 1, 2013

@author: kpaskov
'''

from locust import Locust, TaskSet, task

class WebsiteTasks(TaskSet):
    def on_start(self):
        pass

    @task
    def interaction(self):
        self.client.get("/locus/ABF1/interaction")

    @task
    def regulation(self):
        self.client.get("/locus/ABF1/regulation")

    @task
    def literature(self):
        self.client.get("/locus/ABF1/literature")

    @task
    def go(self):
        self.client.get("/locus/ABF1/go")

    @task
    def phenotype(self):
        self.client.get("/locus/ABF1/phenotype")

class WebsiteUser(Locust):
    task_set = WebsiteTasks
    min_wait = 5000
    max_wait = 15000
    host = "http://sgd-qa.stanford.edu"