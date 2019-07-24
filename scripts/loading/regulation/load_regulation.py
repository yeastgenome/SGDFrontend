from datetime import datetime
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.path.insert(0, '../../../src/')
from models import Referencedbentity, Locusdbentity, Taxonomy, Eco, Go, Regulationannotation, Source
sys.path.insert(0, '../')
from database_session import get_nex_session
# from config import CREATED_BY
from util import get_strain_taxid_mapping

__author__ = 'sweng66'

allowable_regulator_type = ['transcription factor', 'chromatin modifier', 'protein modifier']
allowable_regulation_direction = ['positive', 'negative']
allowable_regulation_type = ['transcription', 'protein activity']
allowable_annotation_type = ['manually curated', 'high-throughput']

def load_data(data_file, log_file):
 
    nex_session = get_nex_session()

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id
    pmid_to_reference_id =  dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])
    name_to_locus_id =  dict([(x.systematic_name, x.dbentity_id) for x in nex_session.query(Locusdbentity).all()])
    taxid_to_taxonomy_id = dict([(x.taxid, x.taxonomy_id) for x in nex_session.query(Taxonomy).all()])
    eco_to_id = dict([(x.ecoid, x.eco_id) for x in nex_session.query(Eco).all()])
    goid_to_id = dict([(x.goid, x.go_id) for x in nex_session.query(Go).all()])
    
    key_to_annotation = {}
    
    for x in nex_session.query(Regulationannotation).all():
        happens_during = x.happens_during if x.happens_during is not None else ''
        key = (x.target_id, x.regulator_id, x.taxonomy_id, x.reference_id, x.eco_id, x.regulator_type, x.regulation_type, x.annotation_type, happens_during)
        key_to_annotation[key] = x

    strain_to_taxid = get_strain_taxid_mapping()
    
    fw = open(log_file, "w")

    loaded = {}

    f = open(data_file)
    for line in f:
        if line.startswith('Regulator'):
            continue
        pieces = line.strip().split("\t")

        regulator_id = name_to_locus_id.get(pieces[0].strip())
        if regulator_id is None:
            print("The regulator name: ", pieces[0], " is not in the database.")
            continue

        target_id = name_to_locus_id.get(pieces[3].strip())
        if target_id is None:
            print("The target name: ", pieces[3], " is not in the database.")
            continue

        strain = pieces[5].strip()
        if strain == 'CEN.PK':
            strain = 'CENPK'
        taxid = strain_to_taxid.get(strain)
        if taxid is None:
            print("The strain name: ", pieces[5], " is not in the mapping module.")
            continue
        taxonomy_id = taxid_to_taxonomy_id.get(taxid)
        if taxonomy_id is None:
            print("The taxid: ", taxid, " is not in the database.")
            continue

        happens_during = ''
        if pieces[8]:
            happens_during = goid_to_id.get(pieces[8].strip().split(' ')[0])
            if happens_during is None:
                print("Unknown GOID: ", pieces[8].strip().split(' ')[0])
                continue

        reference_id = pmid_to_reference_id.get(int(pieces[10]))
        if reference_id is None:
            print("The pmid: ", pieces[10], " is not in the database")
            continue

        regulator_type = pieces[2].strip()
        direction = pieces[6].strip()
        regulation_type = pieces[7].strip()
        annotation_type = pieces[11].strip()
        created_by = pieces[12].strip()

        if regulator_type not in allowable_regulator_type:
            print("Unknown regulator_type: ", regulator_type)
            continue
        if regulation_type not in allowable_regulation_type:
            print("Unknown regulation_type: ", regulation_type)
            continue
        if direction and direction not in allowable_regulation_direction:
            print("Unknown regulation_direction: ", direction)
            continue
        if annotation_type not in allowable_annotation_type:
            print("Unknown annotation_type: ", annotation_type)

        if regulation_type == 'protein activity' and regulator_type in ['transcription factor', 'chromatin modifier']:
            print("regulator_type in (transcription factor, chromatin modifier) cannot be used with regulation_type = 'protein activity'. See line below:")
            print(line)
            continue
                
        if regulator_type == 'protein modifier' and regulation_type == 'regulation of transcription':
            print("regulator_type = 'protein modifier' cannot be used with regulation_type = 'regulation of transcription'. See line below:")
            print(line)
            continue

        eco_items = pieces[9].strip().split(',')
        for eco_item in eco_items:
            eco_id = eco_to_id.get(eco_item.strip().split(' ')[0])
            if eco_id is None:
                print("The ECO code: ", pieces[9], " is not in the database.")
                continue

            key = (target_id, regulator_id, taxonomy_id, reference_id, eco_id, regulator_type, regulation_type, annotation_type, happens_during)

            if key in loaded:
                print("Same row exists: ", loaded[key])
                print("Same row exists: ", line)
                continue
            loaded[key] = line

            if key in key_to_annotation:
                x = key_to_annotation[key]
                direction_DB = x.direction
                if direction_DB is None:
                    direction_DB = ''
                if direction_DB == direction:
                    fw.write("IN database: " + line.strip() +  " KEY=" + str(key) +  " direction_in_db=" + str(x.direction) + "\n")
                    continue
                
                ## update
                if x.direction is None:
                    if direction:
                        x.direction = direction
                elif x.direction != direction:
                    x.direction = direction
                nex_session.add(x)
                nex_session.commit()
                fw.write("The direction has been updated for key=" + str(key) + "\n")
            else:    
                insert_a_row(nex_session, fw, source_id, target_id, regulator_id, eco_id, reference_id, taxonomy_id, regulator_type, regulation_type, annotation_type, direction, happens_during, created_by)
            
def insert_a_row(nex_session, fw, source_id, target_id, regulator_id, eco_id, reference_id, taxonomy_id, regulator_type, regulation_type, annotation_type, direction, happens_during, created_by):


    x = None
    if happens_during and direction:
        x = Regulationannotation(source_id = source_id,
                                 target_id = target_id,
                                 regulator_id = regulator_id,
                                 eco_id = eco_id,
                                 reference_id = reference_id,
                                 taxonomy_id = taxonomy_id,
                                 regulator_type = regulator_type, 
                                 regulation_type = regulation_type, 
                                 direction = direction,
                                 annotation_type = annotation_type,
                                 happens_during = happens_during,
                                 created_by = created_by)
    elif direction:
        x = Regulationannotation(source_id = source_id,
                                 target_id = target_id,
                                 regulator_id = regulator_id,
                                 eco_id = eco_id,
                                 reference_id = reference_id,
                                 taxonomy_id = taxonomy_id,
                                 regulator_type = regulator_type,
                                 regulation_type = regulation_type,
                                 annotation_type = annotation_type,
                                 direction = direction,
                                 created_by = created_by)
    elif happens_during:
        x = Regulationannotation(source_id = source_id,
                                 target_id = target_id,
                                 regulator_id = regulator_id,
                                 eco_id = eco_id,
                                 reference_id = reference_id,
                                 taxonomy_id = taxonomy_id,
                                 regulator_type = regulator_type,
                                 regulation_type = regulation_type,
                                 annotation_type = annotation_type,
                                 happens_during = happens_during,
                                 created_by = created_by)
    else:
        x = Regulationannotation(source_id = source_id,
                                 target_id = target_id,
                                 regulator_id = regulator_id,
                                 eco_id = eco_id,
                                 reference_id = reference_id,
                                 taxonomy_id = taxonomy_id,
                                 regulator_type = regulator_type,
                                 regulation_type = regulation_type,
                                 annotation_type = annotation_type,
                                 created_by = created_by)

    nex_session.add(x)
    nex_session.commit()

    fw.write("Insert new row: target_id = " + str(target_id) + " regulator_id = " + str(regulator_id) + " eco_id = " + str(eco_id) + " reference_id = " + str(reference_id) + " taxonomy_id = " + str(taxonomy_id) + " regulator_type = " + regulator_type + " regulation_type = " + regulation_type + " annotation_type = " + annotation_type + " direction = " + direction + " happens_during = " + str(happens_during) + "\n")
    
if __name__ == '__main__':

    log_file = "logs/load_regulation.log"

    data_file = None
    if len(sys.argv) >= 2:
        data_file = sys.argv[1]
    else:
        print("Usage: load_regulation.py data_file")
        print("Example: load_regulation.py data/regulationData062017.txt")
        exit()
    
    load_data(data_file, log_file)



