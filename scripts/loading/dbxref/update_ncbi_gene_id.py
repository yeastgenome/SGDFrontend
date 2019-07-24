import urllib.request, urllib.parse, urllib.error
import sys
import os
import gzip
from datetime import datetime
import logging
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
from src.models import Dbentity, Locusdbentity, LocusAlias, Source, Filedbentity, Edam
from src.helpers import upload_file
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

CREATED_BY = os.environ['DEFAULT_USER']

log_file = "scripts/loading/dbxref/logs/update_ncbi_gene_id.log"
link_root_url = "http://www.ncbi.nlm.nih.gov/gene/"

def update_data(infile):

    nex_session = get_session()

    fw = open(log_file,"w")

    log.info(str(datetime.now()))
    log.info("Getting data from the database...")

    edam_to_id = dict([(x.format_name, x.edam_id) for x in nex_session.query(Edam).all()])
    ncbi = nex_session.query(Source).filter_by(display_name='NCBI').one_or_none()
    source_id = ncbi.source_id
    sgd = nex_session.query(Source).filter_by(display_name='SGD').one_or_none()
    sgd_source_id = sgd.source_id

    name_to_locus_id = {}
    locus_id_to_name = {}
    for x in nex_session.query(Locusdbentity).all():
        name_to_locus_id[x.systematic_name] = x.dbentity_id
        if x.gene_name:
            name_to_locus_id[x.gene_name] = x.dbentity_id
        locus_id_to_name[x.dbentity_id] = x.systematic_name

    locus_id_to_gene_id = {}
    for x in nex_session.query(LocusAlias).filter_by(alias_type='Gene ID', source_id=source_id).all():
        gene_id_list = []
        if x.locus_id in locus_id_to_gene_id:
            gene_id_list = locus_id_to_gene_id[x.locus_id]
        gene_id_list.append(x.display_name)
        locus_id_to_gene_id[x.locus_id] = gene_id_list

    log.info("Reading data from NCBI gene2accession file and updating the database...")

    nex_session.close()
    nex_session = get_session()
    
    f = open(infile)
    
    found = {}
    locus_id_to_new_gene_id = {}

    for line in f:

        pieces = line.strip().split("\t")

        if pieces[0] != "559292":
            continue

        gene_id = pieces[1]
        name = pieces[15]

        if (name, gene_id) in found:
            continue
        found[(name, gene_id)] = 1

        if name not in name_to_locus_id:
            # print name, " is not in the database."
            continue

        locus_id = name_to_locus_id[name]

        gene_id_list = []
        if locus_id in locus_id_to_new_gene_id:
            gene_id_list = locus_id_to_new_gene_id[locus_id]
        gene_id_list.append(gene_id)
        locus_id_to_new_gene_id[locus_id] = gene_id_list

    f.close()

    for locus_id in locus_id_to_new_gene_id:
        update_gene_ids(nex_session, fw, locus_id, 
                        locus_id_to_gene_id.get(locus_id), 
                        locus_id_to_new_gene_id[locus_id],
                        source_id, locus_id_to_name[locus_id])
        
    for locus_id in locus_id_to_gene_id:
        if locus_id in locus_id_to_new_gene_id:
            continue
        # print "TO BE DELETED Gene_id:", locus_id_to_gene_id[locus_id], locus_id_to_name[locus_id] 
        for gene_id in locus_id_to_gene_id[locus_id]:
            delete_alias(nex_session, fw, locus_id, gene_id, source_id)

    update_database_load_file_to_s3(nex_session, infile, sgd_source_id, edam_to_id)
    
    # nex_session.rollback()

    nex_session.commit()

    fw.close()

    log.info(str(datetime.now()))
    log.info("Done!")


def update_gene_ids(nex_session, fw, locus_id, gene_id_list, new_gene_id_list, source_id, name):

    for gene_id in new_gene_id_list:
        if gene_id_list and gene_id in gene_id_list:
            continue
        print("New Gene ID: ", gene_id, " for locus_id=", locus_id, name)
        insert_alias(nex_session, fw, locus_id, source_id, gene_id)

    if gene_id_list is None:
        return

    for gene_id in gene_id_list:
        if gene_id in new_gene_id_list:
            continue
        print("Remove OLD Gene ID: ", gene_id, " for locus_id=", locus_id, name)
        delete_alias(nex_session, fw, locus_id, gene_id, source_id)


def delete_alias(nex_session, fw, locus_id, gene_id, source_id):

    nex_session.query(LocusAlias).filter_by(locus_id=locus_id, alias_type='Gene ID', source_id=source_id, display_name=gene_id).delete()

    fw.write("Delete NCBI Gene ID: " + gene_id + " for locus_id="+str(locus_id)+"\n")
   
def insert_alias(nex_session, fw, locus_id, source_id, gene_id):
    
    # print "NEW Gene ID:", gene_id

    x = LocusAlias(display_name = gene_id,
                   obj_url = link_root_url + gene_id,
                   source_id = source_id,
                   locus_id = locus_id,
                   has_external_id_section = "1",
                   alias_type = 'Gene ID',
                   created_by = CREATED_BY)
    nex_session.add(x)

    fw.write("Insert a new NCBI Gene ID " + gene_id +"\n")

def update_database_load_file_to_s3(nex_session, data_file, sgd_source_id, edam_to_id):

    local_file = open(data_file)

    import hashlib
    dx_md5sum = hashlib.md5(local_file.read()).hexdigest()
    dx_row = nex_session.query(Filedbentity).filter_by(md5sum = dx_md5sum).one_or_none()

    if dx_row is not None:
        return

    log.info("Uploading the file to S3...")

    data_file = data_file.split('/').pop()

    nex_session.query(Dbentity).filter_by(display_name=data_file, dbentity_status='Active').update({"dbentity_status": 'Archived'})
    nex_session.commit()

    data_id = edam_to_id.get('EDAM:2872')   ## data:2872 ID list 
    topic_id = edam_to_id.get('EDAM:3345')  ## topic:3345 Data identity and mapping
    format_id = edam_to_id.get('EDAM:3475') ## format:3475 TSV

    from sqlalchemy import create_engine
    from src.models import DBSession
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)

    upload_file(CREATED_BY, local_file,
                filename=data_file,
                file_extension='txt',
                description='subset of NCBI gene2accession file for taxon ID 559292',
                display_name=data_file,
                data_id=data_id,
                format_id=format_id,
                topic_id=topic_id,
                status='Active',
                is_public='0',
                is_in_spell='0',
                is_in_browser='0',
                file_date=datetime.now(),
                source_id=sgd_source_id)

if __name__ == '__main__':

    # url_path = 'ftp://ftp.ncbi.nih.gov/gene/DATA/'
    # gene_id_file = 'gene2accession.gz.gz'
    # urllib.urlretrieve(url_path + gene_id_file, gene_id_file)

    gene_id_file = "scripts/loading/dbxref/data/gene2accession_559292.txt";

    update_data(gene_id_file)
    




