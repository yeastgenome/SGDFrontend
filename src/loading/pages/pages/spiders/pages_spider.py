import scrapy
from scrapy.crawler import CrawlerProcess
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

def get_genes():
    # get S288C genes
    gene_ids_so = DBSession.query(Dnasequenceannotation.dbentity_id, Dnasequenceannotation.so_id).filter(Dnasequenceannotation.taxonomy_id == 274901).all()
    dbentity_ids_to_so = {}
    dbentity_ids = set([])
    so_ids = set([])
    for gis in gene_ids_so:
        dbentity_ids.add(gis[0])
        so_ids.add(gis[1])
        dbentity_ids_to_so[gis[0]] = gis[1]
    all_genes = DBSession.query(Locusdbentity).filter(Locusdbentity.dbentity_id.in_(list(dbentity_ids)), Locusdbentity.dbentity_status == 'Active').limit(100).all()
    return all_genes

# init spiders
class GenesSpider(scrapy.Spider):
    name = 'genes'
    def start_requests(self):
        genes = get_genes()
        urls = []
        for locus in genes:
            urls += locus.get_tabbed_page_cache_urls()
        for url in urls:
            yield scrapy.Request(url=url, headers=HEADER_OBJ, method='PURGE')
            yield scrapy.Request(url=url, headers=HEADER_OBJ, callback=self.parse)

    def parse(self, response):
        if response.status != 200:
            self.log('error on ' + response.url)


process = CrawlerProcess({
    'USER_AGENT': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)'
})
process.crawl(GenesSpider)
process.start()
