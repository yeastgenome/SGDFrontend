from StringIO import StringIO
from Bio import Entrez, Medline
import sys
reload(sys)
sys.setdefaultencoding('UTF8')
from src.models import Dbentity, Referencedbentity, Referencedocument, Referenceauthor,\
    Referencetype, ReferenceUrl, ReferenceRelation, Source, Journal, Locusdbentity
from scripts.loading.database_session import get_session

Entrez.email = "sweng@stanford.edu"

doi_root = 'http://dx.doi.org/'
pubmed_root = 'http://www.ncbi.nlm.nih.gov/pubmed/'
pmc_root = 'http://www.ncbi.nlm.nih.gov/pmc/articles/'
status = 'Published'
epub_status = 'Epub ahead of print'
pdf_status = 'N'
epub_pdf_status = 'NAP'

DBSession = get_session()

_all_genes = None

def add_paper(pmid, created_by="OTTO"):

    record = get_pubmed_record(str(pmid))

    ncbi = DBSession.query(Source).filter_by(format_name='NCBI').one_or_none()
    source_id = ncbi.source_id

    ## insert into DBENTITY/REFERENCEDBENTITY/REFERENCEDOCUMENT
    [reference_id, authors, doi_url, pmc_url, sgdid] = insert_referencedbentity(pmid, source_id, record, created_by)
    
    insert_authors(reference_id, authors, source_id, created_by)
    insert_pubtypes(pmid, reference_id, record.get('pubtypes', []), source_id, created_by)
    insert_urls(pmid, reference_id, doi_url, pmc_url, source_id, created_by)

    DBSession.commit()

    return (reference_id, sgdid)

def insert_urls(pmid, reference_id, doi_url, pmc_url, source_id, created_by):
    x = ReferenceUrl(display_name = 'PubMed',
                     obj_url = pubmed_root + str(pmid),
                     reference_id = reference_id,
                     url_type = 'PubMed',
                     source_id = source_id,
                     created_by = created_by)
    DBSession.add(x)
    
    if doi_url:
        x = ReferenceUrl(display_name = 'DOI full text',
                         obj_url = doi_url,
                         reference_id = reference_id,
                         url_type = 'DOI full text',
                         source_id = source_id,
                         created_by= created_by)
        DBSession.add(x)

    if pmc_url:
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
    text = record.get('abstract', '')

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
    pubdate = record.get('pubdate')
    date_revised = record.get('date_revised', '')
    pubstatus = record.get('publication_status', '')
    year = record.get('year', '')
    title = record.get('title', '')
    authors = record.get('authors', [])
    volume = record.get('volume', '')
    issue = record.get('issue', '')
    pages = record.get('page', '')

    entries.append(('PMID', pmid))
    entries.append(('STAT', 'Active'))
    entries.append(('DP', pubdate))
    entries.append(('TI', title))
    entries.append(('LR', date_revised))
    entries.append(('IP', issue))
    entries.append(('PG', pages))
    entries.append(('VI', volume))
    entries.append(('SO', 'SGD'))
    authors = record.get('authors', [])
    for author in authors:
        entries.append(('AU', author))
    pubtypes = record.get('pubtypes', [])
    for pubtype in pubtypes:
        entries.append(('PT', pubtype))
    if record.get('abstract') is not None:
        entries.append(('AB', record.get('abstract')))
 
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
    
    pubdate = record.get('pubdate')
    pubstatus = record.get('publication_status')
    date_revised = record.get('date_revised')
    journal_id, journal, journal_title, issn_print = get_journal_id(record, created_by)
    
    year = record.get('year', '')
    title = record.get('title', '')
    authors = record.get('authors', [])
    volume = record.get('volume', '')
    issue = record.get('issue', '')
    pages = record.get('page', '')
    citation = set_cite(title, authors, year, journal, volume, issue, pages)
    doi = record.get('doi')
    doi_url = doi_root + doi if doi else ''
    pmcid = record.get('pmc')
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
                          page = pages,
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


def get_journal_id(record, created_by):
    journal_abbr = record.get('journal_abbrev', '')
    journal_full_name = record.get('journal_title', '')
    issn_print = record.get('issn_print')
    issn_electronic = record.get('issn_electronic')
    
    if issn_print:
        journals = DBSession.query(Journal).filter_by(issn_print=issn_print).all()
        if len(journals) > 0:
            return journals[0].journal_id, journals[0].med_abbr, journal_full_name, issn_print
    if journal_abbr:
        journals = DBSession.query(Journal).filter_by(med_abbr=journal_abbr).all()
        if len(journals) > 0:
            return journals[0].journal_id, journals[0].med_abbr, journal_full_name, issn_print

    source_id = 824 # 'PubMed'

    # format_name = journal_full_name.replace(' ', '_') + journal_abbr.replace(' ', '_')
    journal_full_name = journal_full_name.split(" : ")[0]
    format_name = journal_full_name.replace(' ', '_')

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

def get_pubmed_record(pmid):

    handle = Entrez.efetch(db="pubmed", id=pmid, rettype='xml')
    record = Entrez.read(handle)
    paper = record['PubmedArticle'][0]
    entry = {}
    entry['pmid'] = int(paper['MedlineCitation']['PMID'])
    article = paper['MedlineCitation']['Article']

    journal = article['Journal']
    if journal.get('ISSN'):
        issn = journal.get('ISSN')
        if issn.attributes.get('IssnType') is not None and issn.attributes.get('IssnType') == 'Print': 
            entry['issn_print'] = str(issn)
        if issn.attributes.get('IssnType') is not None and issn.attributes.get('IssnType') == 'Electronic':
            entry['issn_electronic'] = str(issn)  

    entry['journal_abbrev'] = journal.get('ISOAbbreviation')
    entry['journal_title'] = journal.get('Title')

    if journal.get('JournalIssue') and journal['JournalIssue'].get('PubDate'):
        pubdate = journal['JournalIssue']['PubDate']
        year = pubdate.get('Year')
        month = month_to_number(pubdate.get('Month'))
        day = pubdate.get('Day')
        if year:
            entry['pubdate'] = year
            if month and day:
                entry['pubdate'] = entry['pubdate'] + "-" + month + "-" + day
            elif month:
                entry['pubdate'] = entry['pubdate'] + "-" + month

    if journal.get('JournalIssue'):
        entry['issue'] = journal['JournalIssue'].get('Issue')
        entry['volume'] = journal['JournalIssue'].get('Volume')
        if journal['JournalIssue'].get('PubDate'):
            entry['year'] = journal['JournalIssue']['PubDate'].get('Year')
    entry['title'] = article.get('ArticleTitle')
    if paper['MedlineCitation'].get('DateRevised'):
        dateRevised = paper['MedlineCitation']['DateRevised']
        entry['date_revised'] = dateRevised['Year'] + "-" + dateRevised['Month'] + "-" + dateRevised['Day']

    if article.get('Pagination'):
        entry['page'] = article['Pagination'].get('MedlinePgn')
           
    if article.get('PublicationTypeList'):
        types = []
        for type in article['PublicationTypeList']:
            types.append(str(type))
        entry['pubtypes'] = types

    if article.get('Abstract'):
        if article['Abstract'].get('AbstractText'):
            abstract = ''
            for text in article['Abstract']['AbstractText']:
                abstract = abstract + " " + text
            entry['abstract'] = abstract.strip()

    if article.get('AuthorList'):
        authors = []
        for author in article['AuthorList']:
            if author.get('LastName') is None or author.get('Initials') is None:
                continue
            authors.append(author['LastName'] + " " + author['Initials'])
        entry['authors'] = authors

    if paper['PubmedData'].get('PublicationStatus'):
        entry['publication_status'] = paper['PubmedData'].get('PublicationStatus')

    if paper['PubmedData'].get('ArticleIdList'):
        for item in paper['PubmedData'].get('ArticleIdList'):
            if item.attributes.get('IdType') is not None and item.attributes.get('IdType') == 'pmc':
                entry['pmc'] = str(item)
            if item.attributes.get('IdType') is not None and item.attributes.get('IdType') == 'doi':
                entry['doi'] = str(item)

    return entry

def month_to_number(month):

    mapping = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' }

    return mapping.get(month)
