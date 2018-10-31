import json
from urllib2 import Request, urlopen, URLError
import logging
import os
from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF-8')
from src.models import Psimi, Taxonomy, Dbentity, Complexbindingannotation, Interactor, ComplexReference 
from scripts.loading.database_session import get_session
from scripts.loading.reference.promote_reference_triage import add_paper

__author__ = 'sweng66'

## Created on March 2018
## This script is used to load IntAct protein complex data into NEX2

TAXON_ID = "TAX:559292"

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

CREATED_BY = os.environ['DEFAULT_USER']

detail_json_url_template = "https://www.ebi.ac.uk/intact/complex-ws/complex/REPLACE_ID_HERE"

log_file = "scripts/loading/complex/logs/load_complexbindingannotation.log"

def load_complexbindingannotation():

    nex_session = get_session()

    format_name_to_psimi_id = dict([(x.format_name, x.psimi_id) for x in nex_session.query(Psimi).all()])
    taxon = nex_session.query(Taxonomy).filter_by(taxid=TAXON_ID).one_or_none()
    taxonomy_id = taxon.taxonomy_id

    complexAC_to_dbentity = dict([(x.format_name, x) for x in nex_session.query(Dbentity).filter_by(subclass='COMPLEX').all()])
    interactor_to_id = dict([(x.format_name, x.interactor_id) for x in nex_session.query(Interactor).all()])

    complex_id_to_reference_id_list = {}
    for x in nex_session.query(ComplexReference).all():
        reference_id_list = []
        if x.complex_id in complex_id_to_reference_id_list:
            reference_id_list = complex_id_to_reference_id_list[x.complex_id]
        reference_id_list.append(x.reference_id)
        complex_id_to_reference_id_list[x.complex_id] = reference_id_list
 
    fw = open(log_file, "w")

    key_to_annotations = {}
    for x in nex_session.query(Complexbindingannotation).all():
        annotations = []
        key = (x.complex_id, x.interactor_id, x.binding_interactor_id)
        if key in key_to_annotations:
            annotations = key_to_annotations[key]
        annotations.append((x.reference_id, x.binding_type_id, x.range_start, x.range_end))
        key_to_annotations[key] = annotations

    loaded = {}

    for complexAC in complexAC_to_dbentity:


        print "Getting info for ", complexAC


        d =  complexAC_to_dbentity[complexAC]
        source_id = d.source_id
        complex_id = d.dbentity_id
        
        detailUrl = detail_json_url_template.replace("REPLACE_ID_HERE", complexAC)
        
        y = get_json(detailUrl)
        if y == 404:
            print "Can't access:", detailUrl
            continue

        for p in y['participants']:

            interactor = p['identifier']
            interactor_id = interactor_to_id.get(interactor)
            if interactor_id is None:
                print "The interactor: ", interactor, " is not in the database."
                continue
                
            linkedFeatures = p.get('linkedFeatures')
            if linkedFeatures is None:
                continue

            for lf in linkedFeatures:

                binding_interactor = lf.get('participantId')
                if binding_interactor is None:
                    continue
                binding_interactor_id = interactor_to_id.get(binding_interactor)
                if binding_interactor_id is None:
                    print "The binding interactor: ", binding_interactor, " is not in the database."
                    continue
                binding_type = lf.get('featureTypeMI')
                if binding_type is None:
                    print "No binding type for ", complexAC, interactor, binding_interactor
                    continue
                binding_type_id = format_name_to_psimi_id.get(binding_type)
                if binding_type_id is None:
                    print "The binding_type:", binding_type, " is not in the PSIMI table."
                    continue

                ranges = lf.get('ranges')
                
                (range_start, range_end) = cleanup_ranges(ranges)

                print "ranges:", ranges, range_start, range_end

                reference_id_list = complex_id_to_reference_id_list.get(complex_id)
                if reference_id_list is None:
                    reference_id_list = []

                key = (complex_id, interactor_id, binding_interactor_id)

                annotations_in_db = key_to_annotations.get(key)

                if annotations_in_db is None:

                    if len(reference_id_list) == 0:
                        reference_id_list.append(None)

                    for reference_id in reference_id_list:
                        insert_annotation(nex_session, fw, complex_id, interactor_id, binding_interactor_id, binding_type_id, range_start, range_end, reference_id, source_id, taxonomy_id, loaded)
                    continue

                update_annotations(nex_session, fw, complex_id, interactor_id, binding_interactor_id, binding_type_id, range_start, range_end, reference_id_list, annotations_in_db, source_id, taxonomy_id, loaded)


        # nex_session.rollback()
        nex_session.commit()  

 
def insert_annotation(nex_session, fw, complex_id, interactor_id, binding_interactor_id, binding_type_id, range_start, range_end, reference_id, source_id, taxonomy_id, loaded):

    loading_key = (complex_id, interactor_id, binding_interactor_id, reference_id)
    if loading_key in loaded:
        return
    loaded[loading_key] = 1
    
    x = Complexbindingannotation(complex_id = complex_id,
                                 interactor_id = interactor_id,
                                 binding_interactor_id = binding_interactor_id,
                                 binding_type_id = binding_type_id,
                                 source_id = source_id,
                                 taxonomy_id = taxonomy_id,
                                 reference_id = reference_id, 
                                 range_start = range_start,
                                 range_end = range_end,
                                 created_by = CREATED_BY)
    nex_session.add(x)

    fw.write("Add a new Complexbindingannotation row for complex_id=" + str(complex_id) + ", interactor_id=" + str(interactor_id) + ", binding_interactor_id="+ str(binding_interactor_id) + " and reference_id=" + str(reference_id) + "\n")
    

def update_annotations(nex_session, fw, complex_id, interactor_id, binding_interactor_id, binding_type_id, range_start, range_end, reference_id_list, annotations_in_db, source_id, taxonomy_id, loaded):

    if len(reference_id_list) == 0:
        reference_id_list.append(-1)

    reference_id_to_details_in_db = {}
    for annot in annotations_in_db:
        (reference_id_db, binding_type_id_db, range_start_db, range_end_db) = annot
        if reference_id_db is None:
            reference_id_db = -1
        if reference_id_db not in reference_id_list:
            if reference_id_db != -1:
                nex_session.query(Complexbindingannotation).filter_by(complex_id=complex_id, interactor_id=interactor_id, binding_interactor_id=binding_interactor_id, reference_id=reference_id_db).delete()
                fw.write("The Complexbindingannotation for complex_id=" + str(complex_id) + ", interactor_id=" + str(interactor_id) + ", binding_interactor_id=" + str(binding_interactor_id) + ", and reference_id=" + str(reference_id_db) + " has been deleted.\n")
            else:
                nex_session.query(Complexbindingannotation).filter_by(complex_id=complex_id, interactor_id=interactor_id, binding_interactor_id=binding_interactor_id).delete()
                fw.write("The Complexbindingannotation for complex_id=" + str(complex_id) + ", interactor_id=" + str(interactor_id) + ", binding_interactor_id=" + str(binding_interactor_id) + " has been deleted.\n")
            continue
        reference_id_to_details_in_db[reference_id_db] = (binding_type_id_db, range_start_db, range_end_db)
    
    for reference_id in reference_id_list:
        if reference_id in reference_id_to_details_in_db:
            (binding_type_id_db, range_start_db, range_end_db) = reference_id_to_details_in_db[reference_id]
            
            print "range in DB", range_start_db, range_end_db, " new range:", range_start, range_end

            update_hash = {}
            if binding_type_id != binding_type_id_db:
                update_hash['binding_type_id'] = binding_type_id
            if range_start != range_start_db:
                update_hash['range_start'] = range_start
            if range_end != range_end_db:
                update_hash['range_end'] = range_end
            
            if not update_hash:
                continue

            if reference_id == -1:
                nex_session.query(Complexbindingannotation).filter_by(complex_id=complex_id, interactor_id=interactor_id, binding_interactor_id=binding_interactor_id).update(update_hash)
                fw.write("The Complexbindingannotation for complex_id=" + str(complex_id) + ", interactor_id=" + str(interactor_id) + ", binding_interactor_id=" + str(binding_interactor_id) + ", and reference_id=" + str(reference_id) + " has been updated.\n")
            else:
                nex_session.query(Complexbindingannotation).filter_by(complex_id=complex_id, interactor_id=interactor_id, binding_interactor_id=binding_interactor_id, reference_id=reference_id).update(update_hash)
                fw.write("The Complexbindingannotation for complex_id=" + str(complex_id) + ", interactor_id=" + str(interactor_id) + ", binding_interactor_id=" + str(binding_interactor_id) + " has been updated.\n")
            
        else:
            if reference_id == -1:
                reference_id = None
            insert_annotation(nex_session, fw, complex_id, interactor_id, binding_interactor_id, binding_type_id, range_start, range_end, reference_id, source_id, taxonomy_id, loaded)
            


def cleanup_ranges(ranges):

    range_start = None
    range_end = None
    if ranges[0] != '?-?':
        ranges[0] = ranges[0].replace(">", "").replace("<", "")
        range_start = ranges[0].split("-")[0].split("..")[0]
        range_end = ranges[0].split("-")[1].split("..")[0]

        if range_start is not None and range_start in ['n', 'c', '?']:
            range_start = None
        if range_end is not None and range_end in ['n', 'c', '?']:
            range_end = None

    return (range_start, range_end)


def get_json(url):

    print "get json:", url

    try:
        req = Request(url)
        res = urlopen(req)
        raw_data = res.read()
        u_raw_data = unicode(raw_data, 'latin-1')
        data = json.loads(u_raw_data)
        return data
    except URLError:
        return 404

if __name__ == "__main__":

    load_complexbindingannotation()
