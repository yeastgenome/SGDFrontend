from sqlalchemy.engine import create_engine
from sqlalchemy.ext.declarative.api import declarative_base
from sqlalchemy.orm.session import sessionmaker
from sqlalchemy import not_
from gpad_config import curator_id, computational_created_by,  \
    go_db_code_mapping, go_ref_mapping, current_go_qualifier, email_receiver, \
    email_subject

import sys
sys.path.insert(0, '../../src/')

__author__ = 'sweng66'

def prepare_schema_connection(dbtype, dbhost, dbname, schema, dbuser, dbpass):
    class Base(object):
        __table_args__ = {'schema': schema, 'extend_existing':True}

    Base = declarative_base(cls=Base)
    Base.schema = schema
    metadata = Base.metadata
    engine_key = "%s://%s:%s@%s/%s" % (dbtype, dbuser, dbpass, dbhost, dbname)
    engine = create_engine(engine_key, pool_recycle=3600)
    Base.metadata.bind = engine
    session_maker = sessionmaker(bind=engine)

    return session_maker


def float_approx_equal(x, y, tol=1e-18, rel=1e-7):
    #http://code.activestate.com/recipes/577124-approximately-equal/
    if tol is rel is None:
        raise TypeError('cannot specify both absolute and relative errors are None')
    tests = []
    if tol is not None: tests.append(tol)
    if rel is not None: tests.append(rel*abs(x))
    assert tests
    return abs(x - y) <= max(tests)

def break_up_file(filename, delimeter='\t'):
    rows = []
    f = open(filename, 'r')
    for line in f:
        rows.append(line.split(delimeter))
    f.close()
    return rows

def is_number(str_value):
    try:
        int(str_value)
        return True
    except:
        return False

def get_sequence(parent_id, start, end, strand, sequence_library):
    if parent_id in sequence_library:
        residues = sequence_library[parent_id][start-1:end]
        if strand == '-':
            residues = reverse_complement(residues)
        return residues
    else:
        print 'Parent not found: ' + parent_id
        
def reverse_complement(residues):
    basecomplement = {'A': 'T', 'C': 'G', 'G': 'C', 'T': 'A', 't': 'a', 'a': 't', 'c': 'g', 'g': 'c', 'n': 'n', 'W': 'W', 'Y': 'R', 'R': 'Y', 'S': 'S', 'K':'M', 'M':'K', 'B':'V', 'D':'H', 'H':'D', 'V':'B', 'N':'N'}
    letters = list(residues)
    letters = [basecomplement[base] for base in letters][::-1]
    return ''.join(letters)


def get_dna_sequence_library(gff3_file, remove_spaces=False):
    id_to_sequence = {}
    on_sequence = False
    current_id = None
    current_sequence = []
    for line in gff3_file:
        line = line.replace("\r\n","").replace("\n", "")
        if not on_sequence and line.startswith('>'):
            on_sequence = True
        if line.startswith('>'):
            if current_id is not None:
                id_to_sequence[current_id] = ''.join(current_sequence)
            current_id = line[1:]
            if remove_spaces:
                current_id = current_id.split(' ')[0]
            current_sequence = []
        elif on_sequence:
            current_sequence.append(line)

    if current_id is not None:
        id_to_sequence[current_id] = ''.join(current_sequence)

    return id_to_sequence

def get_sequence_library_fsa(fsa_file):
    id_to_sequence = {}
    on_sequence = False
    current_id = None
    current_sequence = []
    for line in fsa_file:
        line = line.replace("\r\n","").replace("\n", "")
        if line.startswith('>'):
            if current_id is not None:
                id_to_sequence[current_id] = ''.join(current_sequence)
            current_id = line[1:]
            if '_' in current_id:
                current_id = current_id[0:current_id.index('_')]
            if ' ' in current_id:
                current_id = current_id[0:current_id.index(' ')]
            current_sequence = []
            on_sequence = True
        elif on_sequence:
            current_sequence.append(line)

    if current_id is not None:
        id_to_sequence[current_id] = ''.join(current_sequence)

    return id_to_sequence


def get_sequence_with_contig_library_fsa(fsa_file):
    id_to_sequence = {}
    on_sequence = False
    current_id = None
    current_sequence = []
    contig = None
    for line in fsa_file:
        line = line.replace("\r\n","").replace("\n", "")
        if line.startswith('>'):
            if current_id is not None:
                id_to_sequence[(current_id, contig)] = ''.join(current_sequence)
            current_id = line[1:]
            if '_' in current_id:
                current_id = current_id[0:current_id.index('_')]
            if ' ' in current_id:
                current_id = current_id[0:current_id.index(' ')]
            current_sequence = []
            on_sequence = True
            if "gi|" in line:
                items = line.split(" ")
                if "gi|" in items[2]:
                    contig = items[2].split("|")[3]
                if "gi|" in items[1]:
                    contig = items[1].split("|")[3]
        elif on_sequence:
            current_sequence.append(line)

    if current_id is not None:
        id_to_sequence[(current_id, contig)] = ''.join(current_sequence)

    return id_to_sequence


def get_ref_sequence_library_fsa(fsa_file):

    id_to_sequence = {}
    on_sequence = False
    current_id = None
    current_sequence = []
    header = None
    for line in fsa_file:
        line = line.replace("\r\n","").replace("\n", "")
        if line.startswith('>'):
            if current_id is not None:
                id_to_sequence[current_id] = (header, ''.join(current_sequence))
            current_id = line[1:]
            if '_' in current_id:
                current_id = current_id[0:current_id.index('_')]
            if ' ' in current_id:
                current_id = current_id[0:current_id.index(' ')]
            current_sequence = []
            on_sequence = True
            items = line.split(' Chr ')
            if '2-micron plasmid' in line:
                items = line.split(' 2-micron plasmid')
            items[1] = items[1].split(', Genome Release 64-2-1')[0]            
            items[1] = items[1].replace(' from ', ':')
            items[1] = items[1].replace('-', '..')
            header = items[0] + ' chr'
            if '2-micron plasmid' in line:
                header = items[0] + ' 2-micron plasmid'               
            header = header + items[1] + ' [Genome Release 64-2-1]'
                
        elif on_sequence:
            current_sequence.append(line)

    if current_id is not None:
        id_to_sequence[current_id] = (header, ''.join(current_sequence))

    return id_to_sequence

def get_protein_sequence_library_fsa(fsa_file):

    id_to_sequence = {}
    on_sequence = False
    current_id = None
    current_sequence = []
    header = None
    for line in fsa_file:
        line = line.replace("\r\n","").replace("\n", "")
        if line.startswith('>'):
            if current_id is not None:
                id_to_sequence[(current_id, header)] = ''.join(current_sequence)
            current_id = line[1:]
            if '_' in current_id:
                current_id = current_id[0:current_id.index('_')]
            if ' ' in current_id:
                current_id = current_id[0:current_id.index(' ')]
            current_sequence = []
            on_sequence = True
            items = line.split(' ')
            header = ' '.join(items[0:4])
        elif on_sequence:
            current_sequence.append(line)

    if current_id is not None:
        id_to_sequence[(current_id, header)] = ''.join(current_sequence)

    return id_to_sequence


def make_fasta_file_starter(filename):

    def fasta_file_starter():
        f = open(filename, 'r')
        on_sequence = False
        current_id = None
        header = None
        current_sequence = []
        for line in f:
            line = line.replace("\r\n","").replace("\n", "")
            if not on_sequence and line == '##FASTA':
                on_sequence = True
            elif line.startswith('>'):
                on_sequence = True
                if current_id is not None:
                    yield current_id, header, ''.join(current_sequence)
                current_id = line[1:]
                current_sequence = []
                header = line
            elif on_sequence:
                current_sequence.append(line)

        if current_id is not None:
            yield current_id, header, ''.join(current_sequence)
        f.close()
    return fasta_file_starter


def get_strain_taxid_mapping():

    # "CENPK":           "TAX:889517",

    return { "S288C":           "TAX:559292",
             "FL100":           "TAX:947036",
             "RM11-1a":         "TAX:285006",
             "SK1":             "TAX:580239",
             "W303":            "TAX:580240",
             "Y55":             "TAX:580230",
             "Sigma1278b":      "TAX:658763",
             "AWRI1631":        "TAX:545124",
             "AWRI796":         "TAX:764097",
             "BY4741":          "TAX:1247190",
             "CBS7960":         "TAX:929587",
             "CLIB215":         "TAX:464025",
             "CLIB324":         "TAX:929629",
             "CLIB382":         "TAX:947035",
             "EC1118":          "TAX:643680",
             "EC9-8":           "TAX:1095001",
             "FostersB":        "TAX:764102",
             "FostersO":        "TAX:764101",
             "JAY291":          "TAX:574961",
             "Kyokai7":         "TAX:721032",
             "LalvinQA23":      "TAX:764098",
             "M22":             "TAX:538975",
             "PW5":             "TAX:947039",
             "RedStar":         "TAX:1337438",
             "T7":              "TAX:929585",
             "T73":             "TAX:471859",
             "UC5":             "TAX:947040",
             "VIN13":           "TAX:764099",
             "VL3":             "TAX:764100",
             "Y10":             "TAX:462210",
             "YJM269":          "TAX:929586",
             "YJM339":          "TAX:1337529",
             "YJM789":          "TAX:307796",
             "YPS163":          "TAX:538976",
             "ZTW1":            "TAX:1227742",
             "BY4742":          "NTR:100",
             "D273-10B":        "NTR:101",
             "DBVPG6044":       "NTR:102",
             "FY1679":          "NTR:103",
             "JK9-3d":          "NTR:104",
             "K11":             "NTR:105",
             "L1528":           "NTR:106",
             "SEY6210":         "NTR:107",
             "X2180-1A":        "NTR:108",
             "YPH499":          "NTR:109",
             "YPS128":          "NTR:110",
             "YS9":             "NTR:111",
             "Y55":             "NTR:112",
             "BC187":           "NTR:113",
             "UWOPSS":          "NTR:114",
             "CENPK":           "NTR:115",
             'Other':           "TAX:4932" }

def read_gpad_file(filename, nex_session, uniprot_to_date_assigned, uniprot_to_sgdid_list, get_extension=None, get_support=None, new_pmids=None, dbentity_with_new_pmid=None, dbentity_with_uniprot=None, bad_ref=None):

    from models import Referencedbentity, Locusdbentity, Go, EcoAlias
    import config

    goid_to_go_id = dict([(x.goid, x.id) for x in nex_session.query(Go).all()])
    evidence_to_eco_id = dict([(x.display_name, x.eco_id) for x in nex_session.query(EcoAlias).all()])

    pmid_to_reference_id = {}
    sgdid_to_reference_id = {}
    for x in nex_session.query(Referencedbentity).all():
        pmid_to_reference_id[x.pmid] = x.dbentity_id
        sgdid_to_reference_id[x.sgdid] = x.dbentity_id

    sgdid_to_locus_id = dict([(x.sgdid, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])

    f = open(filename)
    
    read_line = {}
    data = []

    for line in f:

        if line.startswith('!'):
            continue

        field = line.strip().split('\t')
        if field[9] != 'SGD' and not field[11].startswith('go_evidence=IEA'):
            continue

        ## get rid of duplicate lines...                                                                    
        if line in read_line:
            continue
        read_line[line] = 1

        # if get_extension == 1 and field[10] == '':
        #    continue
        # if get_support == 1 and field[6] == '':
        #    continue

        ## uniprot ID & SGDIDs                                                                              
        uniprotID = field[1]
        sgdid_list = uniprot_to_sgdid_list.get(uniprotID)
        if sgdid_list is None:
            print "The UniProt ID = ", uniprotID, " is not mapped to any SGDID."
            continue

        ## go_qualifier                                                                                     
        go_qualifier = field[2]
        if go_qualifier == 'part_of':
            go_qualifier = 'part of'
        if go_qualifier == 'involved_in':
            go_qualifier = 'involved in'
        if 'NOT' in go_qualifier:
            go_qualifier = 'NOT'

        ## go_id                                                                                            
        goid = field[3]
        go_id = goid_to_go_id.get(goid)
        if go_id is None:
            print "The GOID = ", goid, " is not in GO table."
            continue

        ## eco_id                                                                                           
        # go_evidence=IMP|id=2113463881|curator_name=Kimberly Van Auken                                     
        annot_prop_dict = annot_prop_to_dict(field[11])
        go_evidence = annot_prop_dict.get('go_evidence')
        eco_id = evidence_to_eco_id.get(go_evidence)
        if eco_id is None:
            print "The go_evidence = ", annotation.go_evidence, " is not in the ECO table."
            continue

        ## source                                                                                           
        source = field[9]

        ## created_by                                                                                       
        if source != 'SGD' and go_evidence == 'IEA':
            created_by = computational_created_by
        else:
            created_by = curator_id.get(annot_prop_dict.get('curator_name'))

        ## dbentity_id list
        dbentity_ids = []
        sgdid_list = uniprot_to_sgdid_list.get(uniprotID)
        if sgdid_list is None:
            print "UniProt ID ", uniprotID, " is not in GPI file."
            continue

        for sgdid in sgdid_list:
            if sgdid == '':
                continue
            locus_id = sgdid_to_locus_id.get(sgdid)
            if locus_id is None:
                print "The sgdid = ", sgdid, " is not in LOCUSDBENTITY table."
                continue    
            dbentity_ids.append(locus_id)
            if dbentity_with_uniprot is not None:
                dbentity_with_uniprot[locus_id] = 1

        ## reference_id                                                                                     
        reference_id = None
        if field[4].startswith('PMID:'):
            pmid = field[4][5:]    # PMID:1234567; need to be 1234567                                       
            reference_id = pmid_to_reference_id.get(int(pmid))
        else:
            ref_sgdid = go_ref_mapping.get(field[4])
            if ref_sgdid is None:
                if bad_ref is not None and field[4] not in bad_ref:
                    bad_ref.append(field[4])
                print "UNKNOWN REF: ", field[4], ", line=", line
                continue
            reference_id = sgdid_to_reference_id.get(ref_sgdid)
        if reference_id is None:
            print "The PMID = " + str(pmid) + " is not in the REFERENCEDBENTITY table."
            if new_pmids is not None:
                if pmid not in new_pmids:
                    new_pmids.append(pmid)
                    for dbentity_id in dbentity_ids:
                        dbentity_with_new_pmid[dbentity_id] = 1
            continue

        # assigned_group = field[9]           
        # eg, SGD for manual cuartion;
        # Interpro, UniPathway, UniProtKB, GOC, RefGenome for computational annotation
        # taxon_id = field[7]                  
        
        date_created = str(field[8][0:4]) + '-' + str(field[8][4:6]) + '-' + str(field[8][6:])
        if source == 'SGD':
            date_assigned = uniprot_to_date_assigned.get(uniprotID)
            annotation_type = 'manually curated'
        else:
            date_assigned = date_created
            annotation_type = 'computational'
        
        # sgdid_list = uniprot_to_sgdid_list.get(uniprotID)
        # if sgdid_list is None:
        #    print "UniProt ID ", uniprotID, " is not in GPI file."
        #    continue

        # for sgdid in sgdid_list:
        #    if sgdid == '':
        #        continue
        #    locus_id = sgdid_to_locus_id.get(sgdid)
        #    if locus_id is None:
        #        print "The sgdid = ", sgdid, " is not in LOCUSDBENTITY table."
        #        continue
    
        for locus_id in dbentity_ids:

            entry = { 'source': source,
                      'dbentity_id': locus_id,
                      'reference_id': reference_id,
                      'go_id': go_id,
                      'eco_id': eco_id,
                      'annotation_type': annotation_type,
                      'go_qualifier': go_qualifier,
                      'date_assigned': date_assigned,
                      'date_created': date_created,
                      'created_by': created_by } 
                        
            if get_extension == 1 and field[10] != '':
                entry['goextension'] = field[10]
            if get_support == 1 and field[6] != '':
                entry['gosupport'] = field[6]

            data.append(entry)
       
    return data

def annot_prop_to_dict(annot_prop):

    annot_prop_dict = {}
    for annot_prop in annot_prop.split('|'):
        annot = annot_prop.split('=')
        annot_prop_dict[annot[0]] = annot[1]
    return annot_prop_dict
        
def read_gpi_file(filename):

    f = open(filename)

    uniprot_to_date_assigned = {}
    uniprot_to_sgdid_list = {}
    for line  in f:

        if line.startswith('!'):
            continue

        field = line.strip().split('\t')

        if len(field) < 10:
            continue

        # same uniprot ID for multiple RNA entries                                                  
        
        uniprotID = field[1]
        sgdid = field[8].replace('SGD:', '')
        sgdid_list = [] if uniprot_to_sgdid_list.get(uniprotID) is None else uniprot_to_sgdid_list.get(uniprotID)
        sgdid_list.append(sgdid)
        uniprot_to_sgdid_list[uniprotID] = sgdid_list

        for pair in field[9].split('|'):
            if not pair.startswith('go_annotation_complete'):
                continue
            property = pair.split('=')
            date = property[1]
            uniprot_to_date_assigned[uniprotID] = str(date[0:4]) + '-' + str(date[4:6]) + '-' + str(date[6:])

    f.close()

    return [uniprot_to_date_assigned, uniprot_to_sgdid_list]

def get_go_extension_link(dbxref_id):

    if dbxref_id.startswith('SGD:S'):
        sgdid = dbxref_id.replace('SGD:', '')
        return "/locus/" + sgdid + "/overview"
    if dbxref_id.startswith('GO:'):
        return "http://amigo.geneontology.org/amigo/term/" + dbxref_id
    if dbxref_id.startswith('UniProtKB:'):
        uniprotID = dbxref_id.replace('UniProtKB:', '')
        return "http://www.uniprot.org/uniprot/" + uniprotID
    if dbxref_id.startswith('CHEBI:'):
        return "http://www.ebi.ac.uk/chebi/searchId.do?chebiId=" + dbxref_id
    if dbxref_id.startswith('SO:'):
        return "http://www.sequenceontology.org/browser/current_svn/term/" + dbxref_id
    if dbxref_id.startswith('RNAcentral:'):
        id = dbxref_id.replace('RNAcentral:', '')
        return "http://rnacentral.org/rna/" + id
    if dbxref_id.startswith('UniProtKB-KW:'):
        id = dbxref_id.replace('UniProtKB-KW:', '')
        return "http://www.uniprot.org/keywords/" + id
    if dbxref_id.startswith('UniProtKB-SubCell:'):
        id = dbxref_id.replace('UniProtKB-SubCell:', '')
        return "http://www.uniprot.org/locations/" + id
    if dbxref_id.startswith('InterPro:'):
        id = dbxref_id.replace('InterPro:', '')
        return "http://www.ebi.ac.uk/interpro/entry/" + id
    if dbxref_id.startswith('EC:'):
        EC = dbxref_id.replace('EC:', ' ')
        return "http://enzyme.expasy.org/EC/" + EC
    if dbxref_id.startswith('UniPathway:'):
        id = dbxref_id.replace('UniPathway:', '')
        return "http://www.grenoble.prabi.fr/obiwarehouse/unipathway/upa?upid=" + id
    if dbxref_id.startswith('HAMAP:'):
        id = dbxref_id.replace('HAMAP:', '')
        return "http://hamap.expasy.org/unirule/" + id
    if dbxref_id.startswith('protein_id:'):
        id = dbxref_id.replace('protein_id:', '')
        return "http://www.ncbi.nlm.nih.gov/protein/" + id
    if dbxref_id.startswith('EMBL:'):
        id = dbxref_id.replace('EMBL:', '')
        return "http://www.ebi.ac.uk/Tools/dbfetch/emblfetch?style=html&id=" + id
    if dbxref_id.startswith('MGI:'):
        id = dbxref_id.replace('MGI:', '')
        return "http://uswest.ensembl.org/Drosophila_melanogaster/Gene/Summary?g=" + id
    if dbxref_id.startswith('PANTHER:'):
        id = dbxref_id.replace('PANTHER:', '')
        return "http://pantree.org/node/annotationNode.jsp?id=" + id
    return "Unknown"

def children_from_obo(filename, ancestor):
    f = open(filename, 'r')
    child = ''
    parent_to_children = {}
    id_to_rank = {}
    for line in f:
        line = line.strip()
        pieces = line.split(': ')
        if pieces[0] == 'id':
            child = pieces[1]
        if pieces[0] == 'is_a':
            parent = pieces[1].split(' ')[0]
            if parent not in parent_to_children:
                parent_to_children[parent] = []
            parent_to_children[parent].append(child)
        if pieces[0] == 'property_value' and pieces[1].startswith('has_rank NCBITaxon:'):
            id_to_rank[child] = pieces[1].replace("has_rank NCBITaxon:", "") 
            # id_to_rank[child] = pieces[1].replace("has_rank ", "")   

    # do breadth first search of parent_to_children
    # populate filtered_parent_set
    filtered_parent_set = []
    working_set = []
    working_set.append(ancestor)
    filtered_id_to_rank = {}
    while len(working_set) > 0:
        current = working_set[0]
        working_set = working_set[1:]
        filtered_parent_set.append(current)
        filtered_id_to_rank[current] = id_to_rank.get(current)
        if current in parent_to_children:
            for child in parent_to_children[current]:
                if child not in filtered_parent_set:
                    working_set.append(child)
        
    return [filtered_parent_set, filtered_id_to_rank]


def read_obo(ontology, filename, key_switch, parent_to_children, is_obsolete_id, source, alias_source=None):
    terms = []
    f = open(filename, 'r')    
    term = None
    id_name = key_switch.get('id')
    if id_name is None:
        id_name = key_switch.get('xref')
    is_obsolete_ecoid = {}
    id_to_id = {}
    parent_child_pair = {}
    found_alias = {}
    for line in f:
        line = line.strip()
        ## remove all back slashes
        line = line.replace("\\", "")
        if ontology != 'RO' and line == '[Typedef]':
            break
        if ontology == 'OBI' and (line.startswith('property_value:') or line.startswith('owl-')):
            continue
        if line == '[Term]' or line == '[Typedef]':
            if term is not None:
                terms.append(term)
            if alias_source is None:
                term = { 'source': { 'display_name': source } }
            else:
                term = { 'aliases': [],
                         'urls': [],
                         'source': { 'display_name': source } }

        elif term is not None:
            pieces = line.split(': ')
            if ontology == 'RO' and pieces[0] == 'id':
                id = pieces[1]
            if len(pieces) >= 2:
                if alias_source and pieces[0] == 'synonym':
                    if len(pieces) > 2:
                        pieces.pop(0)
                        synonym_line = ": ".join(pieces)
                    else:
                        synonym_line = pieces[1]
                    quotation_split = synonym_line.split('"')
                    alias_name = quotation_split[1]
                    type = quotation_split[2].split('[')[0].strip()
                    alias_type = type.split(' ')[0]
                    if ontology == 'CHEBI':
                        alias_type = type[:40]
                        if alias_type not in ('EXACT', 'RELATED', 'EXACT IUPAC_NAME'):
                            continue
                        if alias_type == 'EXACT IUPAC_NAME':
                            alias_type = 'IUPAC name'
                        if len(alias_name) >= 500 or (alias_name, alias_type) in [(x['display_name'], x['alias_type']) for x in term['aliases']]:
                            continue            
                    if ontology == 'DO' and alias_type not in ('EXACT', 'RELATED'):
                        continue
                    if (term[id_name], alias_name, alias_type) in found_alias:
                        continue
                    term['aliases'].append({'display_name': alias_name, "alias_type": alias_type, "source": {"display_name": alias_source}})
                    found_alias[(term[id_name], alias_name, alias_type)] = 1
                elif ontology == 'GO' and (pieces[0] == 'is_a' or pieces[0] == 'relationship'):
                    if term.get('display_name') is None:
                        continue
                    # is_a: GO:0051231 ! spindle elongation
                    # relationship: part_of GO:0015767 ! lactose transport
                    parent = pieces[1].split('!')[0].strip()
                    relation_type = 'is a'
                    if pieces[0] == 'relationship':
                        type_goid = parent.split(' ')
                        relation_type = type_goid[0].replace('_', ' ')
                        parent = type_goid[1].strip()
                    if (parent, term['goid']) in parent_child_pair:
                        continue
                    parent_child_pair[(parent, term['goid'])] = 1
                    ro_id = get_relation_to_ro_id(relation_type)
                    if ro_id is None:
                        print relation_type, " is not in RO table"
                        continue
                    if parent not in parent_to_children:
                        parent_to_children[parent] = []
                    parent_to_children[parent].append({id_name: term[id_name], 'display_name': term['display_name'], key_switch['namespace']: term[key_switch['namespace']],'source': {'display_name': source}, 'ro_id': ro_id})
                elif pieces[0] == 'is_a' and term.get('display_name') and term.get(id_name):
                    parent = pieces[1].split('!')[0].strip()
                    if parent not in parent_to_children:
                        parent_to_children[parent] = []
                    if id_name == 'roid':
                        parent_to_children[parent].append({id_name: term[id_name], 'display_name': term['display_name'], 'source': {'display_name': source}, 'relation_type': 'is a'})
                    elif key_switch.get('namespace'):
                        parent_to_children[parent].append({id_name: term[id_name], 'display_name': term['display_name'], key_switch['namespace']: term[key_switch['namespace']], 'source': {'display_name': source}, 'ro_id': get_relation_to_ro_id('is a')})
                    else:
                        parent_to_children[parent].append({id_name: term[id_name], 'display_name': term['display_name'], 'source': {'display_name': source}, 'ro_id': get_relation_to_ro_id('is a')})
                elif pieces[0] in key_switch:
                    text = pieces[1]
                    key = pieces[0]
                    if ontology == 'RO':
                        if pieces[0] == 'xref':
                            id_to_id[pieces[1]] = id
                            id = ''
                        elif pieces[0] == 'name':
                            text = text.replace("_", " ")
                    if ontology == 'GO' and pieces[0] == 'namespace':
                        text = text.replace("_", " ")
                    if pieces[0] == 'def':
                        defline = pieces[1]
                        if len(pieces) > 2:
                            pieces.pop(0)
                            defline = ": ".join(pieces) 
                        quotation_split = defline.split('" [')
                        text = quotation_split[0][1:]
                        text = text.replace("\\", "")
                    term[key_switch[key]] = text
                elif pieces[0] == 'is_obsolete':
                    is_obsolete_id[term[id_name]] = 1

    if term is not None:
        terms.append(term)

    f.close()
    if ontology == 'RO':
        return [terms, id_to_id]
    else:
        return terms


def clean_up_orphans(nex_session_maker, child_cls, parent_cls, class_type):
    nex_session = nex_session_maker()
    child_table_ids = nex_session.query(child_cls.id).subquery()
    query = nex_session.query(parent_cls).filter_by(class_type=class_type).filter(not_(parent_cls.id.in_(child_table_ids)))
    deleted_count = query.count()
    query.delete(synchronize_session=False)
    nex_session.commit()
    nex_session.close()
    return deleted_count

word_to_dbentity_id = None

number_to_roman = {'01': 'I', '1': 'I',
                   '02': 'II', '2': 'II',
                   '03': 'III', '3': 'III',
                   '04': 'IV', '4': 'IV',
                   '05': 'V', '5': 'V',
                   '06': 'VI', '6': 'VI',
                   '07': 'VII', '7': 'VII',
                   '08': 'VIII', '8': 'VIII',
                   '09': 'IX', '9': 'IX',
                   '10': 'X',
                   '11': 'XI',
                   '12': 'XII',
                   '13': 'XIII',
                   '14': 'XIV',
                   '15': 'XV',
                   '16': 'XVI',
                   '17': 'Mito',
                   }

def get_word_to_dbentity_id(word, nex_session):
    from models import Locusdbentity

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

def get_dbentity_by_name(dbentity_name, to_ignore, nex_session):
    from models import Locusdbentity
    if dbentity_name not in to_ignore:
        try:
            int(dbentity_name)
        except ValueError:
            dbentity_id = get_word_to_dbentity_id(dbentity_name, nex_session)
            return None if dbentity_id is None else nex_session.query(Locusdbentity).filter_by(dbentity_id=dbentity_id).first()
    return None

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
        print text
        return text

relation_to_ro_id = None

def get_relation_to_ro_id(relation_type, nex_session=None):
    from models import Ro
    global relation_to_ro_id
    if relation_to_ro_id is None:
        if nex_session is None:
            import config
            nex_session_maker = prepare_schema_connection(config.NEX_DBTYPE, config.NEX_HOST, config.NEX_DBNAME, config.NEX_SCHEMA, config.NEX_DBUSER, config.NEX_DBPASS)
            nex_session = nex_session_maker()
        relation_to_ro_id = {}
        for relation in nex_session.query(Ro).all():
            relation_to_ro_id[relation.display_name] = relation.id
    return None if relation_type not in relation_to_ro_id else relation_to_ro_id[relation_type]


def link_strain_names(text, to_ignore, nex_session):
    words = text.split(' ')
    new_chunks = []
    chunk_start = 0
    i = 0
    for word in words:
        strain_name = word
        if strain_name.endswith('.') or strain_name.endswith(',') or strain_name.endswith('?') or strain_name.endswith('-'):
            strain_name = strain_name[:-1]
        if strain_name.endswith(')'):
            strain_name = strain_name[:-1]
        if strain_name.startswith('('):
            strain_name = strain_name[1:]


        strain = get_strain_by_name(strain_name.upper(), to_ignore, nex_session)

        if strain is not None:
            new_chunks.append(text[chunk_start: i])
            chunk_start = i + len(word) + 1

            new_chunk = "<a href='" + strain.link + "'>" + strain_name + "</a>"
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
        print text
        return text


def sendmail(subject, body_text, receiver):
    import smtplib
    
    server = "localhost"
    sender = 'sgd-programmers@genome.stanford.edu'

    message = """\
From: %s
To: %s
Subject: %s

%s
    """ % (sender, ", ".join(receiver), subject, body_text)
    
    try:
        mailer = smtplib.SMTP(server)
        mailer.sendmail(sender, receiver, message)
    except (smtplib.SMTPConnectError):
        print >> stderr, "Error sending email"
        sys.exit(-1)
