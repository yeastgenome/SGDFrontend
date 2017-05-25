from Bio import Entrez
from urllib import urlopen
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
# from config import EMAIL
EMAIL = 'sgd-helpdesk@lists.stanford.edu'

__author__ = 'sweng66'

Entrez.email = EMAIL
    
def get_abstract(pmid):

    handle = Entrez.efetch(db="pubmed", id=pmid, rettype='abstract')
    record = Entrez.read(handle)
    paper = record['PubmedArticle'][0]
    abstractText = ""
    article = paper['MedlineCitation']['Article']
    if article.get('Abstract'):
        for abstract in article['Abstract']['AbstractText']:
            if abstractText != "":
                abstractText = abstractText + "<p>"
            abstractText = abstractText + abstract
    return abstractText

def get_pubmed_record(pmid_list):

    handle = Entrez.esummary(db="pubmed", id=pmid_list) 
    records = Entrez.read(handle)
    return records


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


def set_cite(title, author_list, year, journal, volume, issue, pages):

    author_etc = get_author_etc(author_list)

    citation_data = {
            'title': title,
            'authors': author_etc,
            'year': year,
            'journal': journal,
            'volume': volume,
            'issue': issue,
            'pages': pages }
    citation = "{authors} ({year}). {title} {journal}".format(**citation_data)
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

def get_pmid_list(terms, retmax, day):

    pmid_list_all = []
    for term in terms:
        results = search(term+'[tw]', retmax, day)
        pmid_list = results['IdList']
        for pmid in pmid_list:
            if pmid not in pmid_list_all:
                pmid_list_all.append(pmid)
    return pmid_list_all

def search(query, retmax, day):

    handle = Entrez.esearch(db='pubmed',
                            sort='relevance',
                            reldate=day,
                            datetype='edat',
                            retmax=retmax,
                            retmode='xml',
                            term=query)
    results = Entrez.read(handle)
    return results


