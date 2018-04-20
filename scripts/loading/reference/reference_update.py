import logging
import os
from datetime import datetime
import time
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
from src.models import Dbentity, Referencedbentity, Source, Journal, \
                       Referenceauthor, ReferenceUrl, Referencetype, \
                       ReferenceRelation, Referencedocument
from scripts.loading.database_session import get_session
from scripts.loading.reference.pubmed import get_pubmed_record_from_xml, \
                                             get_abstracts, set_cite
from scripts.loading.reference.add_reference import tag_to_type_mapping, \
                                        relation_in_tag, relation_on_tag
from scripts.loading.util import link_gene_names

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)
CREATED_BY = os.environ['DEFAULT_USER']


MAX = 500
MAX_4_CONNECTION = 5000
SLEEP_TIME = 2
PUBLISHED_STATUS = 'Published'
EPUB_STATUS = 'Epub ahead of print'
EPUB = 'aheadofprint'
PUBLISH = 'ppublish'
SRC = 'NCBI'
AUTHOR_TYPE = 'Author'
PMC_URL_TYPE = 'PMC full text'
DOI_URL_TYPE = 'DOI full text'
PMC_ROOT = 'http://www.ncbi.nlm.nih.gov/pmc/articles/'
DOI_ROOT = 'http://dx.doi.org/'

field_names = ['citation', 'title', 'year', 'volume', 'issue', 'page', 'doi', 'pmcid',
               'publication_status', 'author_name', 'pub_type', 'abstract', 'pmc_url',
               'doi_url', 'comment_erratum', 'date_revised']

def update_reference_data(log_file):
 
    nex_session = get_session()

    fw = open(log_file,"w")

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting PMID list...\n")
    
    log.info(str(datetime.now()))
    log.info("Getting data from the database...")

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    journal_id_to_abbrev = dict([(x.journal_id, x.med_abbr) for x in nex_session.query(Journal).all()])
    key_to_type = dict([((x.parent_id, x.child_id), x.relation_type) for x in nex_session.query(ReferenceRelation).all()])
    reference_id_to_abstract = dict([(x.reference_id, x.text) for x in nex_session.query(Referencedocument).filter_by(document_type="Abstract").all()])
    
    pmids_all = []
    pmid_to_reference = {}
    for x in nex_session.query(Referencedbentity).all():
        if x.pmid:
            pmids_all.append(x.pmid)
            pmid_to_reference[x.pmid] = { 'dbentity_id': x.dbentity_id, 
                                          'publication_status': x.publication_status,
                                          'date_revised': x.date_revised }
            
    reference_id_to_authors = {}
    for x in nex_session.query(Referenceauthor).order_by(Referenceauthor.reference_id, Referenceauthor.author_order).all():
        authors = []
        if x.reference_id in reference_id_to_authors:
            authors = reference_id_to_authors[x.reference_id]
        authors.append(x.display_name)
        reference_id_to_authors[x.reference_id] = authors

    reference_id_to_urls = {}
    for x in nex_session.query(ReferenceUrl).all():
        urls = []
        if x.reference_id in reference_id_to_urls:
            urls = reference_id_to_urls[x.reference_id]
        urls.append((x.url_type, x.obj_url))
        reference_id_to_urls[x.reference_id] = urls

    reference_id_to_pubtypes = {}
    for x in nex_session.query(Referencetype).all():
        pubtypes = []
        if x.reference_id in reference_id_to_pubtypes:
            pubtypes = reference_id_to_pubtypes[x.reference_id]
        pubtypes.append(x.display_name)
        reference_id_to_pubtypes[x.reference_id] = pubtypes

    ###########################
    nex_session.close()
    nex_session = get_session()
    ###########################

    fw.write(str(datetime.now()) + "\n")
    fw.write("Getting Pubmed records...\n")

    # log.info(datetime.now())
    log.info("Getting Pubmed records and updating the database...")

    update_log = {}
    for field_name in field_names:
        update_log[field_name] = 0

    pmids = []
    j = 0
    i = 0
    updated_pmids = []
    dbentity_ids_with_author_changed = []
    for pmid in pmids_all:
        
        if pmid is None or pmid in [26842620, 27823544, 11483584]:
            continue

        i = i + 1
        j = j + 1
        
        if j >= MAX_4_CONNECTION:
            ###########################
            nex_session.close()
            nex_session = get_session()
            ###########################
            log.info("Reference updated: " + str(i))
            j = 0

        # print "PMID: ", pmid
            
        if len(pmids) >= MAX:
            records = get_pubmed_record_from_xml(','.join(pmids))
            abstracts = get_abstracts(','.join(pmids))
            update_database_batch(nex_session, fw, records, 
                                  pmid_to_reference, 
                                  journal_id_to_abbrev, 
                                  reference_id_to_authors,
                                  abstracts,
                                  reference_id_to_abstract,
                                  reference_id_to_urls, 
                                  reference_id_to_pubtypes,
                                  key_to_type,
                                  source_to_id,
                                  update_log,
                                  updated_pmids,
                                  dbentity_ids_with_author_changed)

            pmids = []
            time.sleep(SLEEP_TIME)
        pmids.append(str(pmid))

    if len(pmids) > 0:
        records = get_pubmed_record_from_xml(','.join(pmids))
        abstracts = get_abstracts(','.join(pmids))
        update_database_batch(nex_session, fw, records, 
                              pmid_to_reference, 
                              journal_id_to_abbrev,
                              reference_id_to_authors,
                              abstracts,
                              reference_id_to_abstract,
                              reference_id_to_urls, 
                              reference_id_to_pubtypes,
                              key_to_type,
                              source_to_id,
                              update_log,
                              updated_pmids,
                              dbentity_ids_with_author_changed)
        
    nex_session.commit()

    log.info("Reference updated: " + str(i))

    log.info("Writing Summary...")
    for field_name in field_names:
        log.info("Paper(s) with " + field_name + " updated:" + str(update_log[field_name]))

    log.info("PMIDs that have some of their info updated: " + ", ".join(str(v) for v in updated_pmids)) 

    log.info(str(datetime.now()))
    log.info("Done!")

    fw.close()


def update_database_batch(nex_session, fw, records, pmid_to_reference, journal_id_to_abbrev, reference_id_to_authors, abstracts, reference_id_to_abstract, reference_id_to_urls, reference_id_to_pubtypes, key_to_type, source_to_id, update_log, updated_pmids, dbentity_ids_with_author_changed):

    source_id = source_to_id[SRC]

    pmid_to_abstract = {}
    for (pmid, abstract) in abstracts:
        if pmid is None:
            continue
        pmid_to_abstract[int(pmid)] = abstract
        
    for record in records:            

        pmid = record.get('pmid')
        if pmid is None:
            continue
        
        x = pmid_to_reference.get(pmid)
        
        if x is None:
            continue

        # print "Updating data for PMID: ", pmid

        dbentity_id = x['dbentity_id']

        ### UPDATE AUTHORS
        authors = record.get('authors', '')
        author2orcid = record.get('orcid', {})
        update_authors(nex_session, fw, pmid, 
                       dbentity_id, authors, author2orcid, 
                       reference_id_to_authors.get(dbentity_id), 
                       source_id, update_log, updated_pmids,
                       dbentity_ids_with_author_changed)

        ### UPDATE REFERENCEDBENTITY TABLE
        update_database(nex_session, fw, record, pmid, x, 
                        journal_id_to_abbrev, source_id, 
                        update_log, updated_pmids)
        
        ### UPDATE ABSTRACTS
        abstract_db = reference_id_to_abstract.get(dbentity_id)
        abstract = pmid_to_abstract.get(pmid)
        update_abstract(nex_session, fw, pmid, dbentity_id, abstract, 
                        abstract_db, source_id, update_log, updated_pmids)

        ### UPDATE URLS
        doi = record.get('doi', '')
        doi_url = None
        if doi != '':
            doi_url = DOI_ROOT + doi
            doi_url = doi_url.replace("&lt;", "<").replace("&gt;", ">")

        pmc = record.get('pmc','')
        pmc_url = None
        if pmc != '':
            pmc_url = PMC_ROOT + pmc + '/'

        update_urls(nex_session, fw, pmid, dbentity_id, pmc_url, doi_url,
                    reference_id_to_urls[dbentity_id], source_id, update_log, 
                    updated_pmids)

        ### UPDATE PUB TYPES
        pubtypes = record.get('pubtypes', [])
        update_reftypes(nex_session, fw, pmid, dbentity_id, pubtypes, 
                        reference_id_to_pubtypes.get(dbentity_id), 
                        source_id, update_log, updated_pmids)
        
        ### UPDATE REFERENCE RELATION
        update_comment_erratum(nex_session, fw, record, int(pmid), 
                               pmid_to_reference, key_to_type, 
                               source_to_id['SGD'], update_log, updated_pmids)


def update_abstract(nex_session, fw, pmid, reference_id, abstract, abstract_db, source_id, update_log, updated_pmids):

    if abstract is None or abstract == "" or len(abstract) < 10:
        return
    if abstract == abstract_db:
        return

    update_log['abstract'] = update_log['abstract'] + 1

    if pmid not in updated_pmids:
        updated_pmids.append(pmid)

    if abstract_db is None:
        x = Referencedocument(document_type = 'Abstract',
                              source_id = source_id,
                              reference_id = reference_id,
                              text = abstract,
                              html = link_gene_names(abstract, {}, nex_session),
                              created_by = CREATED_BY)
        nex_session.add(x)
        nex_session.commit()
        fw.write("PMID:" + str(pmid) + ": new abstract added.\nNew abstract: " + abstract + "\n")        
    else:
        nex_session.query(Referencedocument).filter_by(reference_id=reference_id).update({'text': abstract,
                                                                                          'html': link_gene_names(abstract, {}, nex_session)})
        nex_session.commit()
        fw.write("PMID=" + str(pmid) + ": the abstract is updated.\nNew abstract: " + abstract + "\nOld abstract: " + abstract_db + "\n\n")
        

def update_comment_erratum(nex_session, fw, record, pmid, pmid_to_reference, key_to_type, source_id, update_log, updated_pmids):

    tag_to_type = tag_to_type_mapping()

    inPmidList = []
    onPmidList = []

    # ['Biochem Pharmacol. 1975 Aug 15;24(16):1517-21. PMID: 8']                                                                                                                                 
    # ['Epigenetics. 2013 Oct;8(10):1008-12. PMID: 23917692', 'Nat Rev Mol Cell Biol. 2011 Nov;12(11):692. PMID: 21952299', 'Cell. 2011 Sep 2;146(5):671-2. PMID: 21884927']                     

    for tag in relation_in_tag():
        if record.get(tag):
            type = tag_to_type[tag]
            for inText in record[tag]:
                if "PMID: " not in inText:
                    continue
                this_pmid = int(inText.split("PMID: ")[1].strip())
                inPmidList.append((this_pmid, type))

    for tag in relation_on_tag():
        if record.get(tag):
            type = tag_to_type[tag]
            for onText in record[tag]:
                if "PMID: " not in onText:
                    continue
                this_pmid = int(onText.split("PMID: ")[1].strip())
                onPmidList.append((this_pmid, type))

    if len(inPmidList) == 0 and len(onPmidList) == 0:
        return

    x = pmid_to_reference.get(pmid)

    reference_id = x['dbentity_id']

    updated = 0
    for (child_pmid, type) in inPmidList:
        parent_reference_id = reference_id
        child_x = pmid_to_reference.get(child_pmid)
        if child_x is not None:
            child_reference_id = child_x['dbentity_id']
            update_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id, key_to_type)
            updated = 1

    for (parent_pmid, type) in onPmidList:
        child_reference_id = reference_id
        parent_x= pmid_to_reference.get(parent_pmid)
        if parent_x is not None:
            parent_reference_id = parent_x['dbentity_id']
            update_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id, key_to_type)
            updated = 1
    if updated == 1:
        update_log['comment_erratum'] = update_log['comment_erratum']+ 1
        if pmid not in updated_pmids:
            updated_pmids.append(pmid)

def update_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id, key_to_type):

    if (parent_reference_id, child_reference_id) in key_to_type:
        type_db = key_to_type.get((parent_reference_id, child_reference_id))
        if type != type_db:
            nex_session.query(ReferenceRelation).filter_by(parent_id=parent_reference_id, child_id=child_reference_id).update({'relation_type': type})
            nex_session.commit()
            fw.write("PMID=" + str(pmid) + ": relation_type is updated to " + type + "\n")
            key_to_type[(parent_reference_id, child_reference_id)] = type
    else:
        r = ReferenceRelation(source_id = source_id,
                              parent_id = parent_reference_id,
                              child_id = child_reference_id,
                              relation_type = type,
                              created_by = CREATED_BY)
        nex_session.add(r)
        nex_session.commit()
        fw.write("PMID=" + str(pmid) + ": a new reference_relation is added.\n")
        key_to_type[(parent_reference_id, child_reference_id)] = type


def update_reftypes(nex_session, fw, pmid, reference_id, pubtypes, pubtypes_in_db, source_id, update_log, updated_pmids):

    if pubtypes_in_db is None:
        pubtypes_in_db = []

    if sorted(pubtypes) == sorted(pubtypes_in_db):
        return

    updated = 0
    for type in pubtypes_in_db:
        if type not in pubtypes:
            rt = nex_session.query(Referencetype).filter_by(reference_id=reference_id, display_name=type).all()
            nex_session.delete(rt[0])
            updated = 1

    # add new ones

    for type in pubtypes:
        if type not in pubtypes_in_db:
            rt = Referencetype(display_name = type,
                               source_id = source_id,
                               obj_url = '/referencetype/' + type.replace(' ', '_'),
                               reference_id = reference_id,
                               created_by = CREATED_BY)
            nex_session.add(rt)
            updated = 1

    if updated == 1:
        nex_session.commit()
        fw.write("PMID=" + str(pmid) + ": the reference type list is updated.\nNew types: " + str(pubtypes) + "\nOld types: " + str(pubtypes_in_db) + "\n\n")
        update_log['pub_type'] = update_log['pub_type'] + 1


def update_urls(nex_session, fw, pmid, reference_id, pmc_url, doi_url, urls_in_db, source_id, update_log, updated_pmids):

    if doi_url == '':
        doi_url = None

    if pmc_url is None and doi_url is None:
        return

    if urls_in_db is None:
        urls_in_db = []

    pmc_url_db = None
    doi_url_db = None

    for (type, url) in urls_in_db:
        if type == DOI_URL_TYPE:
            doi_url_db = url
        if type == PMC_URL_TYPE:
            pmc_url_db = url

    pmc_url_changed = 0
    doi_url_changed = 0
    if pmc_url is not None:
        if pmc_url_db is None:
            ru = ReferenceUrl(display_name = PMC_URL_TYPE,
                              obj_url = pmc_url,
                              source_id = source_id,
                              reference_id = reference_id,
                              url_type = PMC_URL_TYPE,
                              created_by = CREATED_BY)
            nex_session.add(ru)
            nex_session.commit()
            pmc_url_changed = 1
        elif pmc_url != pmc_url_db:
            nex_session.query(ReferenceUrl).filter_by(reference_id=reference_id, url_type=PMC_URL_TYPE).update({'obj_url': pmc_url})
            nex_session.commit()
            pmc_url_changed = 1

    if doi_url is not None:
        if doi_url_db is None:
            ru = ReferenceUrl(display_name = DOI_URL_TYPE,
                              obj_url = doi_url,
                              source_id = source_id,
                              reference_id = reference_id,
                              url_type = DOI_URL_TYPE,
                              created_by = CREATED_BY)
            nex_session.add(ru)
            nex_session.commit()
            doi_url_changed = 1
        elif doi_url != doi_url_db:
            nex_session.query(ReferenceUrl).filter_by(reference_id=reference_id, url_type=DOI_URL_TYPE).update({'obj_url': doi_url})
            nex_session.commit()
            doi_url_changed = 1

    if pmc_url_changed == 1:
        fw.write("PMID=" + str(pmid) + ": the PMC URL is updated.\nNew URL: " + str(pmc_url) + "\nOld URL: " + str(pmc_url_db) + "\n\n")
        update_log['pmc_url'] = update_log['pmc_url'] + 1
        if pmid not in updated_pmids:
            updated_pmids.append(pmid)
    if doi_url_changed == 1:
        fw.write("PMID=" + str(pmid) + ": the DOI URL is updated.\nNew URL: " + str(doi_url) + "\nOld URL: " + str(doi_url_db) + "\n\n")
        update_log['doi_url'] =update_log['doi_url'] +1
        if pmid not in updated_pmids:
            updated_pmids.append(pmid)


def update_orcid(nex_session, fw, pmid, reference_id, authors, author2orcid):

    for author in authors:
        
        orcid = author2orcid.get(author)

        if orcid is None or orcid == '':  
            continue

        rows = nex_session.query(Referenceauthor).filter_by(reference_id=reference_id, display_name=author).all()

        for x in rows:

            if x.orcid and x.orcid == orcid:
                continue
        
            x.orcid = orcid
            nex_session.add(x)
            nex_session.commit()

            fw.write(str(pmid) + ": orcid for " + author + ": " + orcid + "\n")


def update_authors(nex_session, fw, pmid, reference_id, authors, author2orcid, authors_in_db, source_id, update_log, updated_pmids, dbentity_ids_with_author_changed):

    if authors_in_db is None:
        authors_in_db = []

    if ", ".join(authors) == ", ".join(authors_in_db):
        # print pmid, "no change"
        update_orcid(nex_session, fw, pmid, reference_id, authors, author2orcid)
        return

    ## NEED to IMPROVE THE FOLLOWING CODE                                     
    # delete old ones                                                         
                        
    update_log['author_name'] = update_log['author_name'] + 1

    if pmid not in updated_pmids:
        updated_pmids.append(pmid)
    if reference_id not in dbentity_ids_with_author_changed:
        dbentity_ids_with_author_changed.append(reference_id)

    for ra in nex_session.query(Referenceauthor).filter_by(reference_id=reference_id).all():
        nex_session.delete(ra)
    nex_session.commit()

    # add new ones                                           
    i = 1
    for author in authors:
        if author2orcid.get(author) is None or author2orcid.get(author) == '':
            ra = Referenceauthor(display_name = author,
                                 source_id = source_id,
                                 obj_url = '/author/' + author.replace(' ', '_'),
                                 reference_id = reference_id,
                                 author_order = i,
                                 author_type = 'Author',
                                 created_by = CREATED_BY)
        else:
            ra = Referenceauthor(display_name = author,
                                 source_id = source_id,
                                 orcid = author2orcid.get(author),
                                 obj_url = '/author/' + author.replace(' ', '_'),
                                 reference_id = reference_id,
                                 author_order = i,
                                 author_type = 'Author',
                                 created_by = CREATED_BY)
        nex_session.add(ra)
        i = i + 1
    nex_session.commit()

    fw.write("PMID=" + str(pmid) + ": the author list is updated.\nNew authors: " + ", ".join(authors) + "\nOld authors: " + ", ".join(authors_in_db) + "\n\n")


def update_database(nex_session, fw, record, pmid, x, journal_id_to_abbrev, source_id, update_log, updated_pmids):

    pubstatus = record.get('publication_status')
    date_revised = record.get('date_revised')
    
    date_revised_db = None
    if x.get('date_revised'):
        date_revised_db = str(x['date_revised']).split(' ')[0]

    if x['publication_status'] == EPUB_STATUS and pubstatus == PUBLISH:

        update_reference(nex_session, fw, pmid, record, journal_id_to_abbrev, source_id, 
                         update_log, updated_pmids, date_revised, PUBLISHED_STATUS)

        fw.write("EPUB: get published for pmid=" + str(pmid) + "\n")

    elif date_revised:
        if date_revised_db is None or date_revised != date_revised_db:

            update_reference(nex_session, fw, pmid, record, journal_id_to_abbrev, source_id,
                             update_log, updated_pmids, date_revised, None)
                            
            fw.write("DATE_REVISED: date_revised changed for pmid=" + str(pmid) + " from " + str(date_revised_db) + " to " + date_revised + "\n")

        else:
            fw.write("PMID:" + str(pmid) + " no change" + "\n")
    else:
        fw.write("PMID:" + str(pmid) + " no change" + "\n")

                            
def update_reference(nex_session, fw, pmid, record, journal_id_to_abbrev, source_id, update_log, updated_pmids, date_revised, published_status):

    x = nex_session.query(Referencedbentity).filter_by(pmid=pmid).one_or_none()

    if x is None:
        return

    journal = journal_id_to_abbrev[x.journal_id]
    authors = record.get('authors', [])
    title = record.get('title', '')
    year = record.get('year')
    if year is None:
        year = x.year
    else:
        year = int(year)
    volume = record.get('volume', '')
    issue = record.get('issue', '')
    page = record.get('page', '')
    citation = set_cite(title, authors, year, journal, volume, issue, page)    
    doi = record.get('doi', '')
    pmcid = record.get('pmc', '')

    update_str = ""
    ### update reference table
    has_update = 0
    if published_status:
        x.publication_status = published_status
        has_update = 1
        update_log['publication_status'] = update_log['publication_status'] + 1
    if citation != x.citation:
        x.citation = citation
        update_log['citation'] = update_log['citation'] + 1
        has_update = 1
    if title != x.title:
        x.title = title
        update_log['title'] = update_log['title'] + 1
        has_update = 1
    if year != x.year:
        x.year = year
        update_log['year'] = update_log['year'] + 1
        has_update = 1
    if volume != x.volume:
        x.volume = volume
        update_log['volume'] = update_log['volume'] + 1
        has_update = 1
    if issue != x.issue:
        x.issue = issue
        update_log['issue'] = update_log['issue'] + 1
        has_update = 1
    if page != x.page:
        x.page = page
        update_log['page'] = update_log['page'] + 1
        has_update = 1
    if doi and doi != x.doi:
        x.doi = doi
        update_log['doi'] = update_log['doi'] + 1
        has_update = 1
    if pmcid and pmcid != x.pmcid and pmcid != "PMC4502675":
        x.pmcid = pmcid
        update_log['pmcid'] = update_log['pmcid'] + 1
        has_update = 1
    if date_revised:
        date_revised_db = None
        if x.date_revised:
            date_revised_db = str(x.date_revised).split(' ')[0]
        if date_revised_db is None or date_revised != date_revised_db:
            x.date_revised = date_revised
            update_log['date_revised'] = update_log['date_revised'] + 1
            has_update = 1

    if has_update == 1:
        nex_session.add(x)
        nex_session.commit()
        if pmid not in updated_pmids:
            updated_pmids.append(pmid)
    # else:
    #    print pmid, "No change"


if __name__ == '__main__':

    log_file = "scripts/loading/reference/logs/reference_update.log"
    
    update_reference_data(log_file)




