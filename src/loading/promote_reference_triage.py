from StringIO import StringIO
from Bio import Entrez, Medline

import sys
reload(sys)
sys.setdefaultencoding('UTF8')

from ..models import DBSession, Dbentity, Referencedbentity, Referencedocument, Referenceauthor,\
                   Referencetype, ReferenceUrl, ReferenceRelation, Source, \
                   Journal, Locusdbentity

doi_root = 'http://dx.doi.org/'
pubmed_root = 'http://www.ncbi.nlm.nih.gov/pubmed/'
pmc_root = 'http://www.ncbi.nlm.nih.gov/pmc/articles/'
status = 'Published'
epub_status = 'Epub ahead of print'
pdf_status = 'N'
epub_pdf_status = 'NAP'

_all_genes = None

def add_paper(pmid, created_by="OTTO"):
    record = Medline.read(Entrez.efetch(db="pubmed", id=str(pmid), rettype='medline'))

    ncbi = DBSession.query(Source).filter_by(format_name='NCBI').one_or_none()
    source_id = ncbi.source_id

    ## insert into DBENTITY/REFERENCEDBENTITY/REFERENCEDOCUMENT
    [reference_id, authors, doi_url, pmc_url, sgdid] = insert_referencedbentity(pmid, source_id, record, created_by)
    
    insert_authors(reference_id, authors, source_id, created_by)
    insert_pubtypes(pmid, reference_id, record.get('PT', []), source_id, created_by)
    insert_urls(pmid, reference_id, doi_url, pmc_url, source_id, created_by)
    insert_relations(pmid, reference_id, record, created_by)
    
    return (reference_id, sgdid)

def insert_urls(pmid, reference_id, doi_url, pmc_url, source_id, created_by):
    x = ReferenceUrl(display_name = 'PubMed',
                     obj_url = pubmed_root + str(pmid),
                     reference_id = reference_id,
                     url_type = 'PubMed',
                     source_id = source_id,
                     created_by = created_by)
    DBSession.add(x)
    x = ReferenceUrl(display_name = 'DOI full text',
                     obj_url = doi_url,
                     reference_id = reference_id,
                     url_type = 'DOI full text',
                     source_id = source_id,
                     created_by= created_by)
    DBSession.add(x)
    x =ReferenceUrl(display_name = 'PMC full text',
                     obj_url = pmc_url,
                     reference_id = reference_id,
                     url_type = 'PMC full text',
                     source_id = source_id,
                     created_by= created_by)
    DBSession.add(x)
    DBSession.flush()
    DBSession.refresh(x)


def insert_pubtypes(pmid, reference_id, pubtypes, source_id, created_by):
    for type in pubtypes:
        x = Referencetype(display_name = type,
                          obj_url = '/referencetype/'+ type.replace(' ', '_'),
                          source_id = source_id,
                          reference_id = reference_id,
                          created_by = created_by)
        DBSession.add(x)
    DBSession.flush()
    DBSession.refresh(x)


def insert_abstract(pmid, reference_id, record, source_id, journal_abbrev, journal_title, issn_print, created_by):
    text = record.get('AB', '')

    if text == '':
        return
    
    x = Referencedocument(document_type = 'Abstract',
                          source_id = source_id,
                          reference_id = reference_id,
                          text = text,
                          html = link_gene_names(text),
                          created_by = created_by)
    DBSession.add(x)
    
    entries = create_bibentry(pmid, record, journal_abbrev, journal_title, issn_print)
    y = Referencedocument(document_type = 'Medline',
                          source_id = source_id,
                          reference_id = reference_id,
                          text = '\n'.join([key + ' - ' + str(value) for key, value in entries if value is not None]),
                          html = '\n'.join([key + ' - ' + str(value) for key, value in entries if value is not None]),
                          created_by = created_by)
    DBSession.add(y)
    DBSession.flush()
    DBSession.refresh(x)


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


def insert_authors(reference_id, authors, source_id, created_by):
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
                            created_by = created_by)
        DBSession.add(x)
    DBSession.flush()
    DBSession.refresh(x)
    

def insert_referencedbentity(pmid, source_id, record, created_by):
    pubstatus, date_revised = get_pubstatus_date_revised(record)
    journal_id, journal, journal_title, issn_print = get_journal_id(record, created_by)
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
                          year = int(year),
                          pmid = long(pmid),
                          pmcid = pmcid,
                          date_published = pubdate,
                          date_revised = date_revised,
                          issue = issue,
                          page = year,
                          volume = volume,
                          title = title,
                          doi = doi,
                          journal_id = long(journal_id),
                          created_by = created_by)

    DBSession.add(x)
    DBSession.flush()
    DBSession.refresh(x)
    dbentity_id = x.dbentity_id

    ## insert into REFERENCEDOCUMENT
    insert_abstract(pmid, dbentity_id, record,
                    source_id, journal, journal_title, issn_print, created_by)

    return [dbentity_id, authors, doi_url, pmc_url, x.sgdid]


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


def get_journal_id(record, created_by):
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
        journals = DBSession.query(Journal).filter_by(issn_print=issn_print).all()
        if len(journals) > 0:
            return journals[0].journal_id, journals[0].med_abbr, journal_full_name, issn_print
    if journal_abbr:
        journals = DBSession.query(Journal).filter_by(med_abbr=journal_abbr).all()
        if len(journals) > 0:
            return journals[0].journal_id, journals[0].med_abbr, journal_full_name, issn_print

    source_id = 824 # 'PubMed'

    format_name = journal_full_name.replace(' ', '_') + journal_abbr.replace(' ', '_')
    j = Journal(issn_print = issn_print,
                issn_electronic = issn_electronic,
                display_name = journal_full_name,
                format_name = format_name,
                title = journal_full_name,
                med_abbr = journal_abbr,
                source_id = source_id,
                obj_url = '/journal/'+format_name,
                created_by = created_by)
    DBSession.add(j)
    DBSession.flush()
    DBSession.refresh(j)
    
    return j.journal_id, j.med_abbr, journal_full_name, issn_print

def insert_relations(pmid, reference_id, record, created_by):
    tag_to_type = {
        "CON":  "Comment",
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
        "ORI":  "Original report"
    }
    
    inText = None
    onText = None
    type = None
    for tag in ['CIN', 'EIN', 'CRI', 'PRIN', 'RPI', 'RIN', 'UIN', 'SPIN', 'ORI']:
        if record.get(tag):
            inText = record[tag]
            type = tag_to_type[tag]
            break

    for tag in ['CON', 'EFR', 'CRF', 'PROF', 'RPF', 'ROF', 'UOF']:
        if record.get(tag):
            onText = record[tag]
            type = tag_to_type[tag]
            break

    if inText is None and onText is None:
        return

    source_id = 834 # 'SGD'

    parent_reference_id = None
    child_reference_id = None

    if inText is not None and "PMID:" in inText:
        parent_reference_id = reference_id
        child_pmid = inText.split("PMID: ")[1].strip()
        child_reference_id = get_reference_id[int(child_pmid)]
        if child_reference_id is not None:
            x = ReferenceRelation(parent_id = parent_reference_id,
                                  child_id = child_reference_id,
                                  source_id = source_id,
                                  correction_type = type,
                                  created_by = created_by)
            DBSession.add(x)

    if onText is not None and "PMID:" in onText:
        child_reference_id = reference_id
        parent_pmid = onText.split("PMID: ")[1].strip()
        parent_reference_id = get_reference_id[int(parent_pmid)]
        if parent_reference_id is not None:
            x = ReferenceRelation(parent_id = parent_reference_id,
                                  child_id = child_reference_id,
                                  source_id = source_id,
                                  correction_type = type,
                                  created_by = created_by)
            DBSession.add(x)

    DBSession.flush()
    DBSession.refresh(x)

def get_reference_id(pmid):
    ref = DBSession.query(Referencedbentity).filter_by(pmid=pmid).all()
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

def link_gene_names(text):
    words = text.split(' ')
    new_chunks = []
    chunk_start = 0
    i = 0
    for word in words:
        dbentity_name = word
        if dbentity_name.endswith('.') or dbentity_name.endswith(',') or dbentity_name.endswith('?') or dbentity_name.endswith('-'):
            dbentity_name = dbentity_name[:-1]
        if dbentity_name.endswith(')'):
            dbentity_name = dbentity_name[:-1]
        if dbentity_name.startswith('('):
            dbentity_name = dbentity_name[1:]

        dbentity = get_dbentity_by_name(dbentity_name.upper())

        if dbentity is not None:
            new_chunks.append(text[chunk_start: i])
            chunk_start = i + len(word) + 1

            new_chunk = "<a href='" + dbentity.obj_url + "'>" + dbentity_name + "</a>"
            if len(word) > 1 and word[-2] == ')':
                new_chunk = new_chunk + word[-2]
            if word.endswith('.') or word.endswith(',') or word.endswith('?') or word.endswith('-') or word.endswith(')'):
                new_chunk = new_chunk + word[-1]
            if word.startswith('('):
                new_chunk = word[0] + new_chunk
            new_chunks.append(new_chunk)
        i = i + len(word) + 1
    new_chunks.append(text[chunk_start: i])
    try:
        return ' '.join(new_chunks)
    except:
        return text

def get_dbentity_by_name(dbentity_name):
    global _all_genes
    
    if _all_genes is None:
        _all_genes = {}
        for locus in DBSession.query(Locusdbentity).all():
            _all_genes[locus.display_name.lower()] = locus
            _all_genes[locus.format_name.lower()] = locus
            _all_genes[locus.display_name.lower() + 'p'] = locus
            _all_genes[locus.format_name.lower() + 'p'] = locus

    return _all_genes.get(dbentity_name.lower())

def set_cite(title, author_list, year, journal, volume, issue, pages):
    author_etc = get_author_etc(author_list)

    citation_data = {
            'title': title,
            'authors': author_etc,
            'year': year,
            'journal': journal,
            'volume': volume,
            'issue': issue,
            'pages': pages
    }
    citation = "{authors} ({year}) {title} {journal}".format(**citation_data)
    if volume and issue and pages:
        citation += " {volume}({issue}): {pages}.".format(**citation_data)
    elif volume and issue:
        citation += " {volume}({issue}).".format(**citation_data)
    elif volume and pages:
        citation += " {volume}: {pages}.".format(**citation_data)
    elif volume:
        citation += " {volume}.".format(**citation_data)
    elif pages:
        citation += " {pages}.".format(**citation_data)
    else:
        citation += "."
    return citation


def get_author_etc(author_list):
    if author_list is None or len(author_list) == 0:
        return ""

    author_et_al = ""

    if len(author_list) == 1:
        author_et_al = author_list[0]
    elif len(author_list) == 2:
        author_et_al = " and ".join(author_list)
    else:
        author_et_al = author_list[0] + ", et al."

    return author_et_al
