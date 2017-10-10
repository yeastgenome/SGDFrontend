from datetime import datetime
from StringIO import StringIO
from Bio import Entrez, Medline 
from urllib import urlopen
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, Referencetriage, Locusdbentity, LocusAlias
sys.path.insert(0, '../')
from database_session import get_dev_session
from config import CREATED_BY
from pubmed import get_pmid_list, get_pubmed_record, set_cite
from util import extract_gene_names

__author__ = 'sweng66'

TERMS = ['yeast', 'cerevisiae']
URL = 'http://www.ncbi.nlm.nih.gov/pubmed/'
DAY = 14
RETMAX = 10000

def load_references(log_file):
 
    nex_session = get_dev_session()

    pmid_to_reference_id =  dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    pmid_to_curation_id =  dict([(x.pmid, x.curation_id) for x in nex_session.query(Referencetriage).all()])
    
    gene_list = []
    all_loci = nex_session.query(Locusdbentity).all()
    for x in all_loci:
        if len(x.systematic_name) > 12 or len(x.systematic_name) < 4:
            continue
        gene_list.append(str(x.systematic_name.upper()))
        if x.gene_name and x.gene_name != x.systematic_name:
            gene_list.append(str(x.gene_name.upper()))
    
    alias_to_name = {}
    for x in nex_session.query(LocusAlias).all():
        if x.alias_type not in ['Uniform', 'Non-uniform']:
            continue
        if len(x.display_name) < 4:
            continue
        name = x.locus.gene_name if x.locus.gene_name else x.locus.systematic_name 
        alias_to_name[x.display_name] = name
        
    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")
    
    print datetime.now()
    print "Getting PMID list..."

    pmid_list = get_pmid_list(TERMS, RETMAX, DAY)

    pmids = []
    for pmid in pmid_list:
        if int(pmid) in pmid_to_reference_id:
            # print ("The pmid=", pmid, " is in the REFERENCEDBENTITY table.", "\n")
            continue
        if int(pmid) in pmid_to_curation_id:
            # print ("The pmid=", pmid, " is in the REFERENCETRIAGE table.", "\n")
            continue
        pmids.append(pmid)

    if len(pmids) == 0:
        fw.write("No new papers\n")
        print "No new papers"
        return

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")
    
    print datetime.now()
    print "Getting Pubmed records and inserting references..."

    records = get_pubmed_record(','.join(pmids))

    i = 1
    for rec in records:
        rec_file = StringIO(rec)
        record = Medline.read(rec_file)
        pmid = record.get('PMID')
        pubmed_url = 'http://www.ncbi.nlm.nih.gov/pubmed/' + str(pmid)
        doi_url = ""
        if record.get('AID'):
            # ['S0167-7012(17)30042-8 [pii]', '10.1016/j.mimet.2017.02.002 [doi]']
            doi = None
            for id in record['AID']:
                if id.endswith('[doi]'):
                    doi = id.replace(' [doi]', '')
                    break
            if doi:
                doi_url = "/".join(['http://dx.doi.org', doi])
        title = record.get('TI', '')
        authors = record.get('AU', [])
        pubdate = record.get('DP', '')  # 'PubDate': '2012 Mar 20'  
        year = pubdate.split(' ')[0]
        journal = record.get('TA', '')
        volume = record.get('VI', '')
        issue = record.get('IP', '')
        pages = record.get('PG', '')
                
        citation = set_cite(title, authors, year, journal, volume, issue, pages)  

        # print "CITE=", citation
        # print "URL=", doi_url

        abstract = record.get('AB', '')

        gene_names = extract_gene_names(abstract, gene_list, alias_to_name)
        
        # print "gene_name=", gene_names, "\n"
        # print abstract, "\n"
    
        insert_reference(nex_session, fw, pmid, citation, doi_url, abstract, ", ".join(gene_names))

    fw.close()

    print "Done!"

def insert_reference(nex_session, fw, pmid, citation, doi_url, abstract, gene_list):

    x = None
    if doi_url and abstract:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            fulltext_url = doi_url,
                            abstract = abstract,
                            abstract_genes = gene_list,
                            created_by = CREATED_BY)
    elif doi_url:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            fulltext_url = doi_url,
                            abstract_genes = gene_list,
                            created_by = CREATED_BY)
    elif abstract:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            abstract = abstract,
                            abstract_genes = gene_list,
                            created_by = CREATED_BY)
    else:
        x = Referencetriage(pmid = pmid,
                            citation = citation,
                            abstract_genes = gene_list,
                            created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.commit()

    fw.write("Insert new reference: " + citation + "\n")
    

if __name__ == '__main__':

    log_file = "logs/reference_triage.log"
    
    load_references(log_file)



