from io import StringIO
from Bio import Entrez, Medline
import os

from src.models import Dbentity, Referencedbentity, Referencedocument, Referenceauthor,\
    Referencetype, ReferenceUrl, ReferenceRelation, Source, Journal
from scripts.loading.database_session import get_session
from scripts.loading.util import link_gene_names

CREATED_BY = os.environ['DEFAULT_USER']

__author___ = 'sweng66'

doi_root = 'http://dx.doi.org/'
pubmed_root = 'http://www.ncbi.nlm.nih.gov/pubmed/'
pmc_root = 'http://www.ncbi.nlm.nih.gov/pmc/articles/'
status = 'Published'
epub_status = 'Epub ahead of print'
pdf_status = 'N'
epub_pdf_status = 'NAP'

from .pubmed import get_pubmed_record, set_cite

def add_paper(pmid, nex_session=None):
     
    if nex_session is None:
        nex_session = get_session()

    records = get_pubmed_record(str(pmid))
    # print records[0]

    rec_file = StringIO(records[0])
    record = Medline.read(rec_file)
    # print record

    source_id = get_source_id(nex_session, 'NCBI')

    ## insert into DBENTITY/REFERENCEDBENTITY/REFERENCEDOCUMENT
    [reference_id, authors, doi_url, pmc_url] = insert_referencedbentity(nex_session, 
                                                                         pmid, 
                                                                         source_id, 
                                                                         record)
    
    # print reference_id, authors, doi_url, pmc_url

    insert_authors(nex_session, reference_id, authors, source_id)

    insert_pubtypes(nex_session, pmid, reference_id, record.get('PT', []), source_id)
    
    insert_urls(nex_session, pmid, reference_id, doi_url, pmc_url, source_id)

    insert_relations(nex_session, pmid, reference_id, record)

    return reference_id

def insert_urls(nex_session, pmid, reference_id, doi_url, pmc_url, source_id):

    x = ReferenceUrl(display_name = 'PubMed',
                     obj_url = pubmed_root + str(pmid),
                     reference_id = reference_id,
                     url_type = 'PubMed',
                     source_id = source_id,
                     created_by = CREATED_BY)
    nex_session.add(x)
    x = ReferenceUrl(display_name = 'DOI full text',
                     obj_url = doi_url,
                     reference_id = reference_id,
                     url_type = 'DOI full text',
                     source_id = source_id,
                     created_by= CREATED_BY)
    nex_session.add(x)
    x =ReferenceUrl(display_name = 'PMC full text',
                     obj_url = pmc_url,
                     reference_id = reference_id,
                     url_type = 'PMC full text',
                     source_id = source_id,
                     created_by= CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)


def insert_pubtypes(nex_session, pmid, reference_id, pubtypes, source_id):
    
    for type in pubtypes:
        x = Referencetype(display_name = type,
                          obj_url = '/referencetype/'+ type.replace(' ', '_'),
                          source_id = source_id,
                          reference_id = reference_id,
                          created_by = CREATED_BY)
        nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

def insert_abstract(nex_session, pmid, reference_id, record, source_id, journal_abbrev, journal_title, issn_print):

    text = record.get('AB', '')

    if text == '':
        return
    
    x = Referencedocument(document_type = 'Abstract',
                          source_id = source_id,
                          reference_id = reference_id,
                          text = text,
                          html = link_gene_names(text, {}, nex_session),
                          created_by = CREATED_BY)
    nex_session.add(x)
    
    entries = create_bibentry(pmid, record, journal_abbrev, journal_title, issn_print)
    y = Referencedocument(document_type = 'Medline',
                          source_id = source_id,
                          reference_id = reference_id,
                          text = '\n'.join([key + ' - ' + str(value) for key, value in entries if value is not None]),
                          html = '\n'.join([key + ' - ' + str(value) for key, value in entries if value is not None]),
                          created_by = CREATED_BY)
    nex_session.add(y)
    nex_session.flush()
    nex_session.refresh(x)


def create_bibentry(pmid, record, journal_abbrev, journal_title, issn_print):

    entries = []
    pubstatus, date_revised = get_pubstatus_date_revised(record)
    pubdate = record.get('DP', '')
    year = pubdate.split(' ')[0]
    title = record.get('TI', '')
    authors = record.get('AU', [])
    volume = record.get('VI', '')
    issue = record.get('IP', '')
    pages = record.get('PG', '')

    entries.append(('PMID', pmid))
    entries.append(('STAT', 'Active'))
    entries.append(('DP', pubdate))
    entries.append(('TI', title))
    entries.append(('LR', date_revised))
    entries.append(('IP', issue))
    entries.append(('PG', pages))
    entries.append(('VI', volume))
    entries.append(('SO', 'SGD'))
    authors = record.get('AU', [])
    for author in authors:
        entries.append(('AU', author))
    pubtypes = record.get('PubTypeList', [])
    for pubtype in pubtypes:
        entries.append(('PT', pubtype))
    if record.get('AB') is not None:
        entries.append(('AB', record.get('AB')))
 
    if journal_abbrev:
        entries.append(('TA', journal_abbrev))
    if journal_title:
        entries.append(('JT', journal_title))
    if issn_print:
        entries.append(('IS', issn_print))
    return entries


def insert_authors(nex_session, reference_id, authors, source_id):

    if len(authors) == 0:
        return

    i = 0
    for author in authors:
        i = i + 1
        x = Referenceauthor(display_name = author,
                            obj_url = '/author/' + author.replace(' ', '_'),
                            source_id = source_id,
                            reference_id = reference_id,
                            author_order = i,
                            author_type = 'Author', 
                            created_by = CREATED_BY)
        nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)
    

def insert_referencedbentity(nex_session, pmid, source_id, record):
    
    pubstatus, date_revised = get_pubstatus_date_revised(record)
    journal_id, journal, journal_title, issn_print = get_journal_id(nex_session, record)
    pubdate = record.get('DP', '')
    year = pubdate.split(' ')[0]
    title = record.get('TI', '')
    authors = record.get('AU', [])
    volume = record.get('VI', '')
    issue = record.get('IP', '')
    pages = record.get('PG', '')
    citation = set_cite(title, authors, year, journal, volume, issue, pages)
    doi, doi_url = get_doi(record)
    pmcid = record.get('PMC', '')
    pmc_url = pmc_root + pmcid + '/' if pmcid else ''

    publication_status = status
    fulltext_status = pdf_status
    if pubstatus == 'aheadofprint':
        publication_status = epub_status
        fulltext_status = epub_pdf_status

    x = Referencedbentity(display_name = citation.split(')')[0] + ')',
                          source_id = source_id,
                          subclass = 'REFERENCE',
                          dbentity_status = 'Active',
                          method_obtained = 'Curator triage',
                          publication_status = publication_status,
                          fulltext_status = fulltext_status,
                          citation = citation,
                          year = year,
                          pmid = pmid,
                          pmcid = pmcid,
                          date_published = pubdate,
                          date_revised = date_revised,
                          issue = issue,
                          page = year,
                          volume = volume,
                          title = title,
                          doi = doi,
                          journal_id = journal_id,
                          created_by = CREATED_BY)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)
    dbentity_id = x.dbentity_id

    ## insert into REFERENCEDOCUMENT                                                                                     
    insert_abstract(nex_session, pmid, dbentity_id, record,  
                    source_id, journal, journal_title, issn_print)      

    return [dbentity_id, authors, doi_url, pmc_url]


def get_doi(record):

    doi = ''
    doi_url = ''
    if record.get('AID'):
        # ['S0167-7012(17)30042-8 [pii]', '10.1016/j.mimet.2017.02.002 [doi]']                    
        for id in record['AID']:
            if id.endswith('[doi]'):
                doi = id.replace(' [doi]', '')
                doi_url = doi_root + doi
                break
    return doi, doi_url


def get_journal_id(nex_session, record, source_id=None):

    journal_abbr = record.get('TA', '')
    journal_full_name = record.get('JT', '')

    # 1469-221X (Print) 1469-221X (Linking)
    # 1573-6881 (Electronic) 0145-479X (Linking)
    issn_list = record.get('IS', '').split(') ')
    issn_print = ''                                                                 
    issn_electronic = ''
    for issn in issn_list:
        if "Print" in issn or "Linking" in issn:
            issn_print = issn.split(' ')[0]
        if "Electronic" in issn:
            issn_electronic = issn.split(' ')[0]
    if issn_print:
        journals = nex_session.query(Journal).filter_by(issn_print=issn_print).all()
        if len(journals) > 0:
            return journals[0].journal_id, journals[0].med_abbr, journal_full_name, issn_print
    if journal_abbr:
        journals = nex_session.query(Journal).filter_by(med_abbr=journal_abbr).all()
        if len(journals) > 0:
            return journals[0].journal_id, journals[0].med_abbr, journal_full_name, issn_print

    if source_id is None:
        source_id = get_source_id(nex_session, 'PubMed')

    format_name = journal_full_name.replace(' ', '_') + journal_abbr.replace(' ', '_')
    j = Journal(issn_print = issn_print,
                issn_electronic = issn_electronic,
                display_name = journal_full_name,
                format_name = format_name,
                title = journal_full_name,
                med_abbr = journal,
                source_id = source_id,
                obj_url = '/journal/'+format_name,
                created_by = CREATED_BY)
    nex_session.add(j)
    nex_session.flush()
    nex_session.refresh(x)
    return j.journal_id, j.med_abbr, journal_full_name, issn_print

def tag_to_type_mapping():

    #      CON       Comment on
    #      CIN       Comment in
    #      EIN       Erratum in
    #      EFR       Erratum for
    #      CRI       Corrected and Republished in 
    #      CRF       Corrected and Republished from
    #      PRIN      Partial retraction in
    #      PROF      Partial retraction of
    #      RPI       Republished in 
    #      RPF       Republished from
    #      RIN       Retraction in
    #      ROF       Retraction of 
    #      UIN       Update in 
    #      UOF       Update of
    #      SPIN      Summary for patients in 
    #      ORI       Original report in
    
    return { "CON":  "Comment",
             "CIN":  "Comment",
             "EIN":  "Erratum",
             "EFR":  "Erratum",
             "CRI":  "Corrected and Republished",
             "CRF":  "Corrected and Republished",
             "PRIN": "Partial retraction",
             "PROF": "Partial retraction",
             "RPI":  "Republished", 
             "RPF":  "Republished",
             "RIN":  "Retraction", 
             "ROF":  "Retraction",    
             "UIN":  "Update", 
             "UOF":  "Update",
             "SPIN": "Summary for patients",
             "ORI":  "Original report" }


def relation_in_tag():
    
    return ['CIN', 'EIN', 'CRI', 'PRIN', 'RPI', 'RIN', 'UIN', 'SPIN', 'ORI']

def relation_on_tag():
    
    return ['CON', 'EFR', 'CRF', 'PROF', 'RPF', 'ROF', 'UOF']

def insert_relations(nex_session, pmid, reference_id, record):

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

    source_id = get_source_id(nex_session, 'SGD')
    
    for (child_pmid , type) in inPmidList:
        parent_reference_id = reference_id
        child_reference_id = get_reference_id(child_pmid)
        if child_reference_id is not None:
            insert_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id)

    for (parent_pmid, type) in onPmidList:
        child_reference_id = reference_id
        parent_reference_id = get_reference_id(parent_pmid)
        if parent_reference_id is not None:
            insert_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id)

def insert_relation(nex_session, fw, pmid, type, source_id, parent_reference_id, child_reference_id):
    
    x = ReferenceRelation(parent_id = parent_reference_id,
                          child_id = child_reference_id,
                          source_id = source_id,
                          relation_type = type,
                          created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

def get_source_id(nex_session, source):
    
    src = nex_session.query(Source).filter_by(display_name=source).all()
    return src[0].source_id

def get_reference_id(pmid):
    ref = nex_session.query(Referencedbentity).filter_by(pmid=pmid).all()
    if ref:
        return ref[0].dbentity_id
    else:
        return None

def get_pubstatus_date_revised(record):

    pubstatus = record.get('PST', '')  # 'aheadofprint', 'epublish'                               
           
    date_revised = record.get('LR', '')
    if date_revised:
        date_revised = date_revised[0:4] + "-" + date_revised[4:6] + "-" + date_revised[6:8]        
    return pubstatus, date_revised
        

