'''
Created on Oct 1, 2013

@author: kpaskov
'''

from locust import Locust, TaskSet, task

class WebsiteTasks(TaskSet):
    def on_start(self):
        pass

    @task
    def interactions(self):
        self.client.get("/locus/ABF1/interactions")

    @task
    def regulation(self):
        self.client.get("/locus/ABF1/regulation")

    @task
    def literature(self):
        self.client.get("/locus/ABF1/literature")

class WebsiteUser(Locust):
    task_set = WebsiteTasks
    min_wait = 5000
    max_wait = 15000
    host = "http://sgd-ng1.stanford.edu"