import json
from urllib2 import Request, urlopen, URLError
import logging
import os
from datetime import datetime
import sys
reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF-8')
from src.models import Source, Psimi, Dbentity, Go, Taxonomy, Eco, Referencedbentity, \
       Locusdbentity, Complexdbentity, ComplexAlias, ComplexGo, ComplexReference, \
       Interactor, LocusAlias
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

all_json_url = "https://www.ebi.ac.uk/intact/complex-ws/search/*?format=json&facets=species_f&filters=species_f:(%22Saccharomyces%20cerevisiae%20\(strain%20ATCC%20204508%20/%20S288c\)%22)"

detail_json_url_template = "https://www.ebi.ac.uk/intact/complex-ws/complex/REPLACE_ID_HERE"

seq_json_url_template = "https://www.ebi.ac.uk/intact/complex-ws/export/REPLACE_ID_HERE"

log_file = "scripts/loading/complex/logs/load_complex.log"

goid_mapping = { "GO:0045449": "GO:0006355",
                 "GO:0070188": "GO:1990879",
                 "GO:0016251": "GO:0003703",
                 "GO:0016944": "GO:0006368",
                 "GO:0016481": "GO:0045892",
                 "GO:0016565": "GO:0001078",
                 "GO:0006350": "GO:0006351" }


def load_complex():

    nex_session = get_session()


    print "Retriving core data from database..."
    print datetime.now()

    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    format_name_to_psimi_id = dict([(x.format_name, x.psimi_id) for x in nex_session.query(Psimi).all()])
    goid_to_go_id = dict([(x.goid, x.go_id) for x in nex_session.query(Go).all()])
    format_name_to_eco_id = dict([(x.format_name, x.eco_id) for x in nex_session.query(Eco).all()])
    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    gene_name_to_locus_id = dict([(x.gene_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    taxon = nex_session.query(Taxonomy).filter_by(taxid=TAXON_ID).one_or_none()
    taxonomy_id = taxon.taxonomy_id

    complexAC_to_dbentity = dict([(x.format_name, x) for x in nex_session.query(Dbentity).filter_by(subclass='COMPLEX').all()])

    complexAC_to_complexdbentity = dict([(x.complex_accession, x) for x in nex_session.query(Complexdbentity).all()])
    
    format_name_to_interactor = dict([(x.format_name, x) for x in nex_session.query(Interactor).all()])

    
    print "Retriving Reference data from ComplexReference table..."
    print datetime.now()


    complex_id_to_reference_id_list = {}
    for x in nex_session.query(ComplexReference).all():
        reference_id_list = []
        if x.complex_id in complex_id_to_reference_id_list:
            reference_id_list = complex_id_to_reference_id_list[x.complex_id]
        reference_id_list.append(x.reference_id)
        complex_id_to_reference_id_list[x.complex_id] = reference_id_list


    print "Retriving Go data from ComplexGo table..."
    print datetime.now()


    complex_id_to_go_id_list = {}
    for x in nex_session.query(ComplexGo).all():
        go_id_list = []
        if x.complex_id in complex_id_to_go_id_list:
            go_id_list =complex_id_to_go_id_list[x.complex_id]
        go_id_list.append(x.go_id)
        complex_id_to_go_id_list[x.complex_id] = go_id_list


    print "Retriving Alias data from ComplexAlias table..."
    print datetime.now()

    complex_id_to_alias_list = {}
    for x in nex_session.query(ComplexAlias).all():
        alias_list = []
        if x.complex_id in complex_id_to_alias_list:
            alias_list =complex_id_to_alias_list[x.complex_id]
        alias_list.append((x.alias_type, x.display_name))
        complex_id_to_alias_list[x.complex_id] = alias_list
 

    print "Getting all json data from complex portal..."
    print datetime.now()


    fw = open(log_file, "w")
    
    all_json = get_json(all_json_url)
    elements = all_json['elements']

    
    print "Getting data from complex portal for each complex..."
    print datetime.now()


    interactor_added = {}
    pmid_added = {}
    annotation_data = []
    for x in elements:
        desc = x['description'].replace("\n", " ")
        complexAC = x['complexAC']
        complexName = x['complexName']


        print "Getting data for", complexAC
        print datetime.now()


        detailUrl = detail_json_url_template.replace("REPLACE_ID_HERE", complexAC)
        
        y = get_json(detailUrl)
        if y == 404:
            print "Can't access:", detailUrl
            continue

        systematicName = y['systematicName']

        intact_id = y.get("ac")
        
        aliases = []
        for synonym in y['synonyms']:
            if ('Synonym', synonym) not in aliases:
                aliases.append(('Synonym', synonym))

        properties = ""
        if y.get('properties'):
            properties = "; ".join(y['properties'])

        ecoid = None
        goid_list = []
        pmid_list = []
        for d in y['crossReferences']:
            if d['database'] == "evidence ontology":
                ecoid = d['identifier']
            if d['database'] == "gene ontology":
                goid_list.append(d['identifier'])
            if d['database'] == 'wwpdb':
                if ('PDB', d['identifier']) not in aliases:
                    aliases.append(('PDB', d['identifier']))
            if d['database'] == 'pubmed' and d['identifier'].isdigit():
                pmid_list.append(d['identifier'])
            if d['database'] == 'emdb':
                if ('EMDB', d['identifier']) not in aliases:
                    aliases.append(('EMDB', d['identifier']))
            if d['database'] =='intenz':
                if ('IntEnz', d['identifier']) not in aliases:
                    aliases.append(('IntEnz', d['identifier']))

        eco_id = format_name_to_eco_id.get(ecoid)
        if eco_id is None:
            print "The ecoid ", ecoid, " is not found in the database."
            continue
        source = y.get('institution')
        if source == "Saccharomyces Genome Database":
            source = 'SGD'
        elif source == 'pro':
            source = 'PRO'
        source_id = None
        source_id = source_to_id.get(source)
        if source_id is None:
            print "The source ", y.get('institution'), " is not found in the database."
            continue

        dbentity_id = None
        if complexAC in complexAC_to_dbentity:
            d = complexAC_to_dbentity[complexAC]
            dbentity_id = d.dbentity_id
            update_dbentity(nex_session, fw, complexAC, complexName, source_id, d.display_name)
            update_complexdbentity(nex_session, fw, intact_id, complexAC, systematicName, 
                                   eco_id, desc, properties, complexAC_to_complexdbentity)
        else:
            dbentity_id = insert_complexdbentity(nex_session, fw, intact_id, complexAC, complexName, 
                                                 systematicName, eco_id, desc, properties, 
                                                 source_id)

        complex_id = dbentity_id
        reference_id_list = []
        for pmid in pmid_list:
            reference_id = pmid_to_reference_id.get(int(pmid))

            print "PMID:", pmid, "reference_id:", reference_id

            if reference_id is None:
                reference_id = pmid_added.get(pmid)
                if reference_id is None:
                    print "Adding PMID:", pmid, " into the database."
                    (reference_id, sgdid) = add_paper(pmid, CREATED_BY)
                    if reference_id is None:
                        print "The pmid ", pmid, " is not in the database."
                        continue
                    else:
                        pmid_added[pmid] = reference_id
            if reference_id not in reference_id_list:
                reference_id_list.append(reference_id)
            
        update_complex_reference(nex_session, fw, complex_id, reference_id_list, 
                                 source_id, complex_id_to_reference_id_list.get(complex_id))

        go_id_list = []
        for goid in goid_list:
            if goid in goid_mapping:
                goid = goid_mapping[goid]
            go_id = goid_to_go_id.get(goid)
            if go_id is None:
                print "The goid ", goid, " is not in the database."
                continue
            if go_id not in go_id_list:
                go_id_list.append(go_id)
            
        update_complex_go(nex_session, fw, complex_id, go_id_list, source_id, 
                          complex_id_to_go_id_list.get(complex_id))

        update_complex_alias(nex_session, fw, dbentity_id, aliases, source_id, complex_id_to_alias_list.get(complex_id))
        
        seqUrl = seq_json_url_template.replace("REPLACE_ID_HERE", intact_id)
        s = get_json(seqUrl)
        if s == 404:
            print "Can't access:", seqUrl
            continue
        
        seq4id = {}
        for seqObj in s['data']:
            if seqObj['object'] == 'interactor':
                id = seqObj['identifier']['id']
                seq4id[id] = seqObj.get('sequence')

        # interactor_list = []
        interactor_to_id = {}
        for p in y['participants']:
            format_name = p['identifier']
            display_name = p.get('name')
            obj_url = p.get('identifierLink')
            if obj_url is None:
                if format_name.startswith("EBI-"):
                    obj_url = "https://www.ebi.ac.uk/complexportal/complex/search?query=" + format_name
                if format_name.startswith("NP_"):
                    obj_url = "https://www.ncbi.nlm.nih.gov/protein/" + format_name
            desc = p.get('description')
            locus_id = gene_name_to_locus_id.get(display_name)
            type_id = format_name_to_psimi_id.get(p.get('interactorTypeMI'))
            role_id = format_name_to_psimi_id.get(p.get('bioRoleMI'))
            stoichiometry = p.get('stochiometry')
            if stoichiometry is not None and stoichiometry == 'null':
                stoichiometry = None
            elif stoichiometry is not None and "maxValue" in stoichiometry:
                stoichiometry = int(stoichiometry.split("maxValue: ")[1])

            seq = seq4id.get(format_name)
            
            if display_name is None or display_name == 'null':
                locusAlias = nex_session.query(LocusAlias).filter_by(display_name=format_name, alias_type='UniProtKB ID').one_or_none()
                if locusAlias is not None:
                    display_name = locusAlias.locus.systematic_name
                    print "GETTING DISPLAY_NAME from database for ", format_name, " display_name=", display_name
                else:
                    display_name = desc.split(' ')[-1]
                    print "GETTING DISPLAY_NAME from DESCRIPTION for ", format_name, " and desc=", desc, " display_name=", display_name

            if format_name in interactor_added:
                interactor_to_id[format_name] = interactor_added[format_name]
            elif format_name in format_name_to_interactor:
                i = format_name_to_interactor[format_name]
                interactor_to_id[format_name] = i.interactor_id
                update_interactor(nex_session, fw, format_name, display_name, obj_url, locus_id, desc, type_id, role_id, stoichiometry, seq, i)
            else:
                interactor_id = insert_interactor(nex_session, fw, format_name, display_name, obj_url, desc, source_id, locus_id, type_id, role_id, stoichiometry, seq)
                interactor_added[format_name] = interactor_id
                interactor_to_id[format_name] = interactor_id
                       
        nex_session.commit()  

    fw.close()
    # nex_session.rollback()
    nex_session.commit()

            
def insert_interactor(nex_session, fw, format_name, display_name, obj_url, desc, source_id, locus_id, type_id, role_id, stoichiometry, seq):

    print "INSERT INTERACTOR:", format_name, display_name, obj_url, desc, source_id, locus_id, type_id, role_id, stoichiometry, seq
    
    if seq is None:
        seq = ""

    x = Interactor(format_name = format_name,
                   display_name = display_name,
                   obj_url = obj_url,
                   locus_id = locus_id,
                   type_id = type_id,
                   role_id = role_id,
                   description = desc,
                   stoichiometry = stoichiometry,
                   residues = seq,
                   source_id = source_id,
                   created_by = CREATED_BY)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

    fw.write("Insert a new INTERACTOR row for format_name=" + format_name + " and display_name=" + str(display_name) + "\n")

    return x.interactor_id


def update_interactor(nex_session, fw, format_name, display_name, obj_url, locus_id, desc, type_id, role_id, stoichiometry, seq, x):
    
    print "UPDATE INTERACTOR:", format_name, display_name, obj_url, locus_id, desc, type_id, role_id, stoichiometry, seq

    update_hash= {}
    if display_name and display_name != x.display_name:
        update_hash['display_name'] = display_name 
    if obj_url and obj_url != x.obj_url:
        update_hash['obj_url'] = obj_url
    if locus_id and locus_id != x.locus_id:
        update_hash['locus_id'] = locus_id
    if desc and desc != x.description:
        update_hash['description'] = desc
    if type_id and type_id != x.type_id:
        update_hash['type_id'] = type_id
    if role_id and role_id != x.role_id:
        update_hash['role_id'] = role_id
    if stoichiometry and stoichiometry != x.stoichiometry:
        update_hash['stoichiometry'] = stoichiometry
    if seq and str(seq) != str(x.residues):
        update_hash['residues'] = seq

    if not update_hash:
        return

    nex_session.query(Interactor).filter_by(format_name=format_name).update(update_hash)

    fw.write("Update Interactor row for format_name = " + format_name + "\n")


def insert_complex_alias(nex_session, fw, complex_id, alias_type, display_name, source_id):

    print "INSERT ALIAS:", complex_id, alias_type, display_name, source_id
    # return

    x = ComplexAlias(complex_id = complex_id,
                     alias_type = alias_type,
                     display_name = display_name,
                     source_id = source_id,
                     created_by = CREATED_BY)

    nex_session.add(x)

    fw.write("Insert a new COMPLEX_ALIAS row for complex_id=" + str(complex_id) + " and display_name=" + display_name + "\n")


def update_complex_alias(nex_session, fw, complex_id, aliases, source_id, aliases_in_db):

    print "UPDATE ALIAS:", complex_id, aliases, source_id
    # return

    if aliases_in_db is None:
        aliases_in_db = []

    for alias in aliases:
        if alias in aliases_in_db:
            continue
        (alias_type, display_name) = alias
        insert_complex_alias(nex_session, fw, complex_id, alias_type, display_name, source_id)

    for alias in aliases_in_db:
        if alias in aliases:
            continue
        (alias_type, display_name) = alias
        x = nex_session.query(ComplexAlias).filter_by(complex_id=complex_id, alias_type=alias_type, display_name=display_name).one_or_none()
        nex_session.delete(x)

        fw.write("The complex_alias row for complex_id=" + str(complex_id) + " and display_name=" + display_name + " has been deleted\n")


def insert_complex_go(nex_session, fw, complex_id, go_id, source_id):

    print "INSERT GO:", complex_id, go_id, source_id
    # return

    x = ComplexGo(complex_id = complex_id,
                  go_id = go_id,
                  source_id = source_id,
                  created_by = CREATED_BY)

    nex_session.add(x)

    fw.write("Insert a new COMPLEX_GO row for complex_id=" + str(complex_id) + " and go_id=" + str(go_id) + "\n")


def update_complex_go(nex_session, fw, complex_id, go_id_list, source_id, go_id_list_in_db):

    print "UPDATE GO:", complex_id, go_id_list, source_id
    # return

    if go_id_list_in_db is None:
        go_id_list_in_db = []

    for go_id in go_id_list:
        if go_id in go_id_list_in_db:
            continue
        insert_complex_go(nex_session, fw, complex_id, go_id, source_id)
    
    for go_id in go_id_list_in_db:
        if go_id in go_id_list:
            continue
        x = nex_session.query(ComplexGo).filter_by(complex_id=complex_id, go_id=go_id).one_or_none()
        nex_session.delete(x)

        fw.write("The complex_go row for complex_id=" + str(complex_id) + " and go_id=" + str(go_id) + " has been deleted\n")


def insert_complex_reference(nex_session, fw, complex_id, reference_id, source_id):

    print "INSERT REFERENCE:", complex_id, reference_id, source_id
    # return

    x = ComplexReference(complex_id = complex_id,
                         reference_id = reference_id,
                         source_id = source_id,
                         created_by = CREATED_BY)

    nex_session.add(x)

    fw.write("Insert a new COMPLEX_REFERENCE row for complex_id=" + str(complex_id) + " and reference_id=" + str(reference_id) + "\n")


def update_complex_reference(nex_session, fw, complex_id, reference_id_list, source_id, reference_id_list_in_db):

    print "UPDATE REFERENCE:", complex_id, reference_id_list, source_id
    # return
    
    if reference_id_list_in_db is None:
        reference_id_list_in_db = []

    for reference_id in reference_id_list:
        if reference_id in reference_id_list_in_db:
            continue
        insert_complex_reference(nex_session, fw, complex_id, reference_id, source_id)

    for reference_id in reference_id_list_in_db:
        if reference_id in reference_id_list:
            continue
        # x = nex_session.query(ComplexReference).filter_by(complex_id=complex_id, reference_id=reference_id).one_or_none()
        # nex_session.delete(x)

        nex_session.query(ComplexReference).filter_by(complex_id=complex_id, reference_id=reference_id).delete()

        fw.write("The complex_reference row for complex_id=" + str(complex_id) + " and reference_id=" + str(reference_id) + " has been deleted\n")


def insert_complexdbentity(nex_session, fw, intact_id, complexAC, complexName, systematicName, eco_id, desc, properties, source_id):

    print "NEW complexdbentity: ", intact_id, complexAC, complexName, systematicName, eco_id, desc, properties, source_id
    # return

    x = Complexdbentity(format_name = complexAC,
                        display_name = complexName,
                        source_id = source_id,
                        subclass = 'COMPLEX',
                        dbentity_status = 'Active',
                        intact_id = intact_id,
                        complex_accession = complexAC,
                        systematic_name = systematicName,
                        eco_id = eco_id,
                        description = desc,
                        properties = properties,
                        created_by = CREATED_BY)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)
    
    fw.write("Insert a new COMPLEXDBENTITY row for complex_accession=" + complexAC + "\n")
    
    return x.dbentity_id


def update_dbentity(nex_session, fw, complexAC, display_name, source_id, display_name_in_db):
        
    print "UPDATE DBENTITY:", complexAC, display_name, source_id
    # return

    if display_name_in_db == display_name:
        return
    
    nex_session.query(Dbentity).filter_by(format_name=complexAC).update({"display_name": display_name})    

    fw.write("Update dbentity.display_name to " + display_name + " for format_name = " + complexAC + "\n")
    

def update_complexdbentity(nex_session, fw, intact_id, complexAC, systematicName, eco_id, desc, properties, complexAC_to_complexdbentity):

    print "UPDATE COMPLEXDBENTITY:", intact_id, complexAC, systematicName, eco_id, desc, properties
    # return

    x = complexAC_to_complexdbentity.get(complexAC)
    
    update_hash = {}
    if x.systematic_name != systematicName:
        update_hash['systematic_name'] = systematicName
    if x.eco_id != eco_id:
        update_hash['eco_id'] = eco_id
    if x.description != desc:
        update_hash['description'] = desc
    if x.properties != properties:
        update_hash['properties'] = properties

    if not update_hash:
        return

    nex_session.query(Complexdbentity).filter_by(format_name=intact_id).update(update_hash)

    fw.write("Update complexdbentity row for format_name = " + intact_id + "\n")


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

    load_complex()
