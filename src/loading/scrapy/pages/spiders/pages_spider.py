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

# init spiders
class BaseSpider(scrapy.Spider):
    def get_entities(self):
        return []

    def start_requests(self):
        entities = self.get_entities()
        for entity in entities:
            index = entities.index(entity)
            if (index % 100 == 0):
                percent_done = str(float(index) / float(len(entities)) * 100)
                self.log('CHECKIN STATS: ' + percent_done + '% of current index complete')
            # TEMP don't purge
            # Get a small subset of URLs which are purged and matched via ~ in varnish.
            # For example /locus/:sgdid will purge /locus/:sgdid, /locus/:sgdid/sequence, etc...
            # base_urls = entity.get_cache_base_urls()
            # for url in base_urls:
            #     yield scrapy.Request(url=url, headers=HEADER_OBJ, method='PURGE')
            # Get a longer list of URLs to GET, and prime the cache.
            urls = entity.get_all_cache_urls(True)
            for url in urls:
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
        return DBSession.query(Go).limit(10).all()

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
    # yield runner.crawl(GoSpider)
    # yield runner.crawl(ObservableSpider)
    # yield runner.crawl(PhenotypeSpider)
    yield runner.crawl(GenesSpider)
    reactor.stop()

crawl()
reactor.run()
