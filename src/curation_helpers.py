import string
import re

def link_gene_names(raw, locus_names_ids):
    # first create an object with display_name as key and sgdid as value
    locus_names_object = {}
    for d in locus_names_ids:
        display_name = d[0]
        sgdid = d[1]
        locus_names_object[display_name] = sgdid
    processed = raw
    words = raw.split(' ')
    for p_original_word in words:
        original_word = p_original_word#.translate(string.punctuation)
        wupper = original_word.upper()
        if wupper in locus_names_object.keys() and len(wupper) > 3:
            sgdid = locus_names_object[wupper]
            url = '/locus/'  + sgdid
            new_str = '<a href="' + url + '">' + wupper + '</a>'
            processed = processed.replace(original_word, new_str)
    return processed

# take pipe separated list and return list of integers
def process_pmid_list(raw):
    raw = raw.strip()
    if len(raw) == 0:
        return []
    p_list = re.split('\||,', raw)
    try:
        return [int(x) for x in p_list]
    except ValueError, e:
        raise ValueError('PMIDs must be a pipe-separated list of valid PMIDs.')
