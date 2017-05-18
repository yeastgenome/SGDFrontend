import scrapy
from scrapy.crawler import CrawlerRunner
from scrapy.utils.project import get_project_settings
from scrapy.utils.log import configure_logging
from twisted.internet import reactor, defer
from sqlalchemy import create_engine, and_
import os
import logging

from src.models import Apo, DBSession, Dnasequenceannotation, Go, Locusdbentity, Phenotype, Referencedbentity, Straindbentity

HEADER_OBJ = { 'X-Forwarded-Proto': 'https' }

engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
DBSession.configure(bind=engine)

if 'WORKER_LOG_FILE' in os.environ.keys():
    LOG_FILE = os.environ['WORKER_LOG_FILE']
    logging.basicConfig(filename=LOG_FILE)
logger = logging.getLogger(__name__)
logger.setLevel(level=logging.INFO)

def get_all_urls_from_list(entitylist):
    all_urls = []
    for entity in entitylist:
        all_urls = all_urls + entity.get_all_cache_urls()
    return all_urls

# init spiders
class BaseSpider(scrapy.Spider):
    def get_entities(self):
        return []

    def start_requests(self):
        entities = self.get_entities()
        urls = get_all_urls_from_list(entities)
        for url in urls:
            index = urls.index(url)
            if (index % 100 == 0):
                percent_done = str(float(index) / float(len(urls)) * 100)
                self.log('CHECKIN STATS: ' + percent_done + '% of current index complete')
            # some debug
            # if (i % 10 == 0):
            #     self.log(urls.index(url))
            yield scrapy.Request(url=url, headers=HEADER_OBJ, method='PURGE')
            yield scrapy.Request(url=url, headers=HEADER_OBJ, callback=self.parse)

    def parse(self, response):
        if response.status != 200:
            self.log('error on ' + response.url)

class GenesSpider(BaseSpider):
    name = 'genes'
    def get_entities(self):
        self.log('getting genes')
        # get S288C genes
        gene_ids_so = DBSession.query(Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(Dnasequenceannotation.taxonomy_id == 274901).all()
        dbentity_ids_to_so = {}
        dbentity_ids = set([])
        so_ids = set([])
        for gis in gene_ids_so:
            dbentity_ids.add(gis[0])
            so_ids.add(gis[1])
            dbentity_ids_to_so[gis[0]] = gis[1]
        all_genes = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids)), Locusdbentity.dbentity_status == 'Active').all()
        return all_genes

class GoSpider(BaseSpider):
    name = 'go'
    def get_entities(self):
        self.log('getting gos')
        return DBSession.query(Go).all()

class ObservableSpider(BaseSpider):
    name = 'observable'
    def get_entities(self):
        self.log('getting observables')
        return DBSession.query(Apo).filter_by(apo_namespace="observable").all()

class PhenotypeSpider(BaseSpider):
    name = 'phenotype'
    def get_entities(self):
        self.log('getting phenotypes')
        return DBSession.query(Phenotype).all()

configure_logging()
runner = CrawlerRunner(get_project_settings())

@defer.inlineCallbacks
def crawl():
    yield runner.crawl(GenesSpider)
    yield runner.crawl(GoSpider)
    yield runner.crawl(ObservableSpider)
    yield runner.crawl(PhenotypeSpider)
    reactor.stop()

crawl()
reactor.run()
