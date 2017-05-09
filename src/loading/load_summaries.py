from datetime import datetime
import json
import csv
import sys
import transaction
from src.models import Locussummary, LocussummaryReference, Locusdbentity, Referencedbentity, Source
                             
__author__ = 'sweng66'

'''
* Retrieve the summary data and put it into dictionary (memory)
* Read in the summary text for each gene from the upload file and compare the 
  text with the info in the memory.
  * The summary for this gene for the given type (eg, Regulation or Phenotype) 
    is not in the database,
       * insert the summay text into the LOCUSSUMMARY table
       * insert any associated reference(s) into LOCUSSUMMARY_REFERENCE table 
         (eg, for regulation summaries)
  * The summary for this gene for the given type is in the database.
       * if the summary text is updated, update the LOCUSSUMMARY.text/html; 
         otherwise noneed todo anything to theLOCUSSUMMARY table
       * check to see if there is any referenceupdate, if yes, updatethe 
         LOCUSSUMMARY_REFERENCE table
'''  

def load_summaries(nex_session, summary_file_reader, summary_type=None):
    
    if summary_type is None:
        summary_type = "Phenotype_Regulation"

    [data, data_to_return] = read_summary_file(nex_session, summary_type, summary_file_reader)

    # not sure if need to write to file?
    # fw.write(str(datetime.now()) + "\n")
    # fw.write("retriveing data from database and store the data in dictionary...\n")
    
    key_to_summary = dict([((x.locus_id, x.summary_type, x.summary_order), x) for x in nex_session.query(Locussummary).all()])
    key_to_summaryref = dict([((x.summary_id, x.reference_id, x.reference_order), x) for x in nex_session.query(LocussummaryReference).all()])
    
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    source_id = source_to_id.get('SGD')

    summary_id_to_references = {}
    for x in nex_session.query(LocussummaryReference).all():
        references = []
        if x.summary_id in summary_id_to_references:
            references = summary_id_to_references[x.summary_id]
        references.append(x)
        summary_id_to_references[x.summary_id] = references

    load_summary_holder = { "summary_added": 0,
                            "summary_updated": 0,
                            "summary_reference_added": 0 }

    # fw.write(str(datetime.now()) + "\n")
    # fw.write("updating the database...\n")

    for x in data:
        key = (x['locus_id'], x['summary_type'], x['summary_order'])
        summary_id = None
        if key in key_to_summary:
            if x['text'] != key_to_summary[key].text.strip() and x['html'] != key_to_summary[key].html.strip():
                # fw.write("OLD:" + key_to_summary[key].text + ":\n")
                # fw.write("NEW:" + x['text'] + ":\n")
                nex_session.query(Locussummary).filter_by(summary_id=key_to_summary[key].summary_id).update({'text': x['text'], 'html': x['html']})
                load_summary_holder['summary_updated'] = load_summary_holder['summary_updated'] + 1
            else:
                print 'not updated'
                # fw.write("SUMMARY is in DB\n")
                summary_id = key_to_summary[key].summary_id
                update_references(nex_session,
                                  load_summary_holder,
                                  source_id, 
                                  summary_id, 
                                  summary_id_to_references.get(summary_id), 
                                  x.get('references'))
        else:
            summary_id = insert_summary(nex_session, load_summary_holder, source_id, x)
            if x.get('references'):
                for y in x['references']:
                    insert_summary_reference(nex_session, load_summary_holder, source_id, summary_id, y)

    transaction.commit()
    return data_to_return

def insert_summary_reference(nex_session, load_summary_holder, source_id, summary_id, y):
    x = LocussummaryReference(summary_id = summary_id, 
                              reference_id = y['reference_id'], 
                              reference_order = y['reference_order'], 
                              source_id = source_id, 
                              created_by = CREATED_BY)
    nex_session.add(x)
    
    load_summary_holder['summary_reference_added'] = load_summary_holder['summary_reference_added'] + 1

    # fw.write("insert new summary reference:" + str(summary_id) + ", " + str(y['reference_id']) + ", " + str(y['reference_order']))

def insert_summary(nex_session, load_summary_holder, source_id, x):
    x = Locussummary(locus_id = x['locus_id'], 
                     summary_type = x['summary_type'], 
                     summary_order = x['summary_order'], 
                     text = x['text'], 
                     html = x['html'], 
                     source_id = source_id, 
                     created_by = CREATED_BY)
    nex_session.add(x)
    nex_session.commit()

    load_summary_holder['summary_added'] = load_summary_holder['summary_added'] + 1

    # fw.write("insert summary:" + str(x['locus_id']) + ", " + x['summary_type'] + ", " + str(x['summary_order']) + ", " + x['text'] + ", " + x['html'])
    
    return x.summary_id

    
def update_references(nex_session, load_summary_holder, source_id, summary_id, old_references, new_references):
    if old_references is None and new_references is None:
        return
    if old_references is None:
        for y in new_references:
            insert_summary_reference(nex_session, load_summary_holder, source_id, summary_id, y)
    elif new_references is None:
        for y in old_references:
            nex_session.delete(y)
    else:
        ref_old = {}
        for x in old_references:
            ref_old[x.reference_id] = x

        ref_new = {}
        for y in new_references:
            if y['reference_id'] in ref_old:
                x = ref_old[y['reference_id']]
                if y['reference_order'] == x.reference_order:
                    continue
                else:
                    nex_session.query(LocussummaryReference).filter_by(summary_id=summary_id,reference_id=y['reference_id']).update({'reference_order': y['reference_order']})
            else:
                insert_summary_reference(nex_session, load_summary_holder, source_id, summary_id, y)
            ref_new[y['reference_id']] = 1

        ## clean up old refs
        # for x in old_references:
        #    if x.reference_id in ref_new:
        #        print "The REFERENCE is in the file"
        #        continue
        #    # nex_session.delete(x)
        #    # print "The LOCUSSUMMARY_REFERENCE row for summary_id=", summary_id, " and reference_id=", x.reference_id, " has been deleted from the database."

def read_summary_file(nex_session, summary_type, summary_file_reader):
    name_to_dbentity = dict([(x.systematic_name, x) for x in nex_session.query(Locusdbentity).all()])
    sgdid_to_dbentity_id = dict([(x.sgdid, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()]) 
    
    data = []
    data_to_return = []
        
    if summary_type == 'Phenotype_Regulation':

        for pieces in summary_file_reader:
            dbentity = name_to_dbentity.get(pieces[0])
            if dbentity is None:
                continue

            references = []
            if len(pieces) > 3:
                pmid_list = pieces[3].replace(' ', '')
                if pmid_list is '':
                    pmids = []
                else:
                    pmids = pmid_list.split('|')
                order = 0

                for pmid in pmids:
                    reference_id = pmid_to_reference_id.get(int(pmid))
                    if reference_id is None:
                        print "PMID=", pmid, " is not in the database"
                        continue
                    order = order + 1
                    references.append({'reference_id': reference_id, 'reference_order': order})

            summary_type = pieces[1]
            if summary_type in ['Phenotype', 'phenotype', 'PHENOTYPE']:
                summary_type = 'Phenotype'
            elif summary_type in ['Regulation', 'regulation', 'REGULATION']:
                summary_type = 'Regulation'

            data.append({'locus_id': dbentity.dbentity_id,
                         'text': pieces[2],
                         'html': link_gene_names(pieces[2], {dbentity.display_name, dbentity.format_name, dbentity.display_name + 'P', dbentity.format_name + 'P'}, nex_session),
                         'summary_type': summary_type,
                         'summary_order': 1,
                         'references': references})
            name = dbentity.gene_name
            if name is None:
                name = dbentity.systematic_name
            data_to_return.append({'category': 'locus',
                                   'name': name,
                                   'href': 'http://www.yeastgenome.org/locus/' + dbentity.sgdid,
                                   'type': summary_type + ' summary',
                                   'value': pieces[2]})

    elif summary_type == 'Function':
        for pieces in summary_file_reader:
            if len(pieces) >= 8:
                sgdid = pieces[8]
                if sgdid.startswith('SGD:'):
                    dbentity_id = sgdid_to_dbentity_id.get(sgdid[4:])
                    if dbentity_id is None:
                        continue
                    functionSummary = [x[22:].strip() for x in pieces[9].split('|') if x.startswith('go_annotation_summary')]
                    if len(functionSummary) == 1:
                        data.append({'locus_id': dbentity_id,
                                     'text': functionSummary[0],
                                     'html': functionSummary[0],
                                     'summary_type': summary_type,
                                     'summary_order': 1})
    else:
        # fw.write("Unknown summary_type: " + summary_type+ "\n")
        exit()
    
    return [data, data_to_return]

def link_gene_names(text, to_ignore, nex_session):
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

        dbentity = get_dbentity_by_name(dbentity_name.upper(), to_ignore, nex_session)

        if dbentity is not None:
            new_chunks.append(text[chunk_start: i])
            chunk_start = i + len(word) + 1

            new_chunk = "<a href='" + dbentity.obj_url + "'>" + dbentity_name + "</a>"
            if word[-2] == ')':
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


def get_dbentity_by_name(dbentity_name, to_ignore, nex_session):
    if dbentity_name not in to_ignore:
        try:
            int(dbentity_name)
        except ValueError:
            dbentity_id = get_word_to_dbentity_id(dbentity_name, nex_session)
            return None if dbentity_id is None else nex_session.query(Locusdbentity).filter_by(dbentity_id=dbentity_id).first()
    return None

word_to_dbentity_id = None

def get_word_to_dbentity_id(word, nex_session):
    global word_to_dbentity_id
    if word_to_dbentity_id is None:
        word_to_dbentity_id = {}
        for locus in nex_session.query(Locusdbentity).all():
            word_to_dbentity_id[locus.format_name.lower()] = locus.dbentity_id
            word_to_dbentity_id[locus.display_name.lower()] = locus.dbentity_id
            word_to_dbentity_id[locus.format_name.lower() + 'p'] = locus.dbentity_id
            word_to_dbentity_id[locus.display_name.lower() + 'p'] = locus.dbentity_id

    word = word.lower()
    return None if word not in word_to_dbentity_id else word_to_dbentity_id[word]