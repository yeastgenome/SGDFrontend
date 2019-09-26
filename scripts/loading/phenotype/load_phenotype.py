import sys
import importlib
from src.models import Apo, Locusdbentity, Referencedbentity, Phenotypeannotation, \
    Source, PhenotypeannotationCond, Taxonomy, Chebi, Phenotype, Allele, Reporter, Chebi
from scripts.loading.database_session import get_session
from scripts.loading.util import get_strain_taxid_mapping

__author__ = 'sweng66'

cond_start_index = 12
cond_stop_index = 33
column_size = 36

cond_class = ['treatment', 'media', 'phase', 'temperature', 
              'chemical', 'assay', 'radiation']

# degree_file = "scripts/loading/phenotype/data/sample_line_with_degree.txt"

def load_phenotypes(infile, logfile):
 
    nex_session = get_session()
    
    name_to_locus_id = {}
    for x in nex_session.query(Locusdbentity).all():
        name_to_locus_id[x.systematic_name] = x.dbentity_id
        if x.gene_name:
            name_to_locus_id[x.gene_name] = x.dbentity_id

    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id
    
    pmid_to_reference_id =  dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])

    experiment_to_id = {}
    mutant_to_id = {}
    for x in nex_session.query(Apo).all():
        if x.apo_namespace == 'experiment_type':
            experiment_to_id[x.display_name] = x.apo_id
        if x.apo_namespace == 'mutant_type':
            mutant_to_id[x.display_name] = x.apo_id
    
    annotation_id_to_last_group_id = {}
    for x in nex_session.query(PhenotypeannotationCond).all():
        last_group_id = 1
        if x.annotation_id in annotation_id_to_last_group_id:
            last_group_id = annotation_id_to_last_group_id[x.annotation_id]
        if x.group_id > last_group_id:
            last_group_id = x.group_id
        annotation_id_to_last_group_id[x.annotation_id] = last_group_id 

    phenotype_to_id = dict([(x.display_name, x.phenotype_id) for x in nex_session.query(Phenotype).all()])
    taxid_to_taxonomy_id =  dict([(x.taxid, x.taxonomy_id) for x in nex_session.query(Taxonomy).all()])        
    allele_to_id =  dict([(x.display_name, x.allele_id) for x in nex_session.query(Allele).all()])
    reporter_to_id =  dict([(x.display_name, x.reporter_id) for x in nex_session.query(Reporter).all()])
    chebiid_to_name =  dict([(x.chebiid, x.display_name) for x in nex_session.query(Chebi).all()])

    fw = open(logfile, "w")

    key_to_annotation_id = dict([((x.dbentity_id, x.taxonomy_id, x.reference_id, x.phenotype_id, x.experiment_id, x.mutant_id, x.allele_id, x.reporter_id, x.strain_name, x.details), x.annotation_id) for x in nex_session.query(Phenotypeannotation).all()])
        
    strain_taxid_mapping = get_strain_taxid_mapping()

    # f0 = open(degree_file)
    # degree = None
    # for line in f0:
    #    field = line.split("\t")
    #    degree = field[26]
    # f0.close()

    f = open(infile)
    
    header = []

    i = 0
    superheader = []
    header = []
    cond_header = []
    for line in f:
        i = i + 1
        pieces = line.strip().split("\t")

        if i == 1:
            superheader = pieces
            continue

        if i == 2:
            j = 0
            for x in pieces:
                if x in ['required', 'Required'] or x == '':
                    x = superheader[j]
                if x == "ChEBI ID":
                    x = "chemical_name"
                header.append(x)
                j = j + 1
            header.append("details")
            cond_header = header[cond_start_index:cond_stop_index]
            continue
        
        # if len(header) < column_size:
        #    for r in range(len(header), column_size-1):
        #        header.append("")
        
        if len(pieces) < column_size:
            for r in range(len(pieces), column_size-1):
                pieces.append("")

        conds = {}
        created_by = None
        dbentity_id = None
        reference_id = None
        taxonomy_id = None
        experiment_id = None
        mutant_id = None
        allele_id = None
        allele_comment = ""
        reporter_id = None
        reporter_comment = ""
        details = ""
        observable = ""
        qualifier = ""
        phenotype_id = None
        strain_name = ""
        bad_row = 0
        conds = pieces[cond_start_index:cond_stop_index]




        ### testing
        # print ("length of header=", len(header))
        # print ("pieces33: ", header[33], pieces[33])
        # print ("pieces34: ", header[34], pieces[34])
        # print ("pieces35: ", header[35], pieces[35])
        # continue
        ### end of testing




        k = 0
        for x in pieces:
            if k < len(header):
                field_name = header[k].strip()
            else:
                continue
            if k < cond_stop_index and k >= cond_start_index:
                k = k + 1
                continue
            k = k + 1
            if x is "":
                continue

            ## the rest is for phenotypeannotation table

            if field_name.startswith('curator'):
                created_by = x.strip()

            if field_name == 'feature_name':
                dbentity_id = name_to_locus_id.get(x.strip())
                if dbentity_id is None:
                    print("The feature_name:", x, " is not in the database.")
                    bad_row = 1
                    break

            if field_name == 'PMID':
                reference_id = pmid_to_reference_id.get(int(x.strip()))
                if reference_id is None:
                    print("The PMID: ", x, " is not in the database.")
                    bad_row = 1
                    break

            if field_name == "experiment_type":
                experiment_id = experiment_to_id.get(x.strip().replace('"', ''))
                if experiment_id is None:
                    print("The experiment_type:", x, " is not in the APO table.")
                    bad_row = 1
                    break

            if field_name == "mutant_type":
                mutant_id = mutant_to_id.get(x.strip())
                if mutant_id is None:
                    print("The mutant_type:", x, " is not in the APO table.")
                    bad_row = 1
                    continue

            if field_name == "observable":
                observable = x.strip()

            if field_name == "qualifier":
                qualifier = x.strip()

            if field_name == "strain_background":
                taxid = strain_taxid_mapping.get(x.strip())
                if taxid is None:
                    print("The strain_background:", x, " is not in the mapping.")
                    bad_row = 1
                    continue
                taxonomy_id = taxid_to_taxonomy_id.get(taxid)
                if taxonomy_id is None:
                    print("The TAXON ID: ", taxid, " is not in the database.")
                    bad_row = 1
                    continue

            if field_name == "strain_name":
                strain_name = x.strip()
            
            if field_name == "allele_name":
                allele_id = allele_to_id.get(x.strip())
                if allele_id is None:
                    allele_id = insert_allele(nex_session, fw, source_id,
                                              created_by, x.strip())
                    allele_to_id[x.strip()] = allele_id
                    
            if field_name == "allele_description":
                allele_comment = x
            
            if field_name == "reporter_name":
                reporter_id = reporter_to_id.get(x.strip())
                if reporter_id is None:
                    reporter_id = insert_reporter(nex_session, fw, source_id,
                                                  created_by, x.strip())
                    reporter_to_id[x.strip()] = reporter_id

            if field_name == "reporter_description":
                reporter_comment = x
        
            if field_name == "details":
                details = x

        if bad_row == 1:
            continue

        if created_by is None and observable == "":
            continue

        if observable != "":
            phenotype = observable
            if qualifier != "":
                phenotype = observable + ": " + qualifier
            phenotype_id = phenotype_to_id.get(phenotype)
            if phenotype_id is None:
                print("The phenotype:", phenotype, " is not in the database.")
                continue
        else:
            print("No observable is provided for line:", line)
            continue
        
        if dbentity_id is None:
            print("No feature_name is provided for line:", line)
            continue

        if taxonomy_id is None:
            print("No strain_background is provided for line:", line)
            continue

        if reference_id is None:
            print("No PMID is provided for line:",line)
            continue

        if created_by is None:
            print("No curator ID is provided for line:", line)
            continue

        # print "dbentity_id=", dbentity_id, ", source_id=", source_id, ", taxonomy_id=", taxonomy_id, ", reference_id=", reference_id, ", phenotype_id=", phenotype_id, ", allele_id=", allele_id, ", allele_comment=", allele_comment, ", reporter_id=", reporter_id
        
        key = (dbentity_id, taxonomy_id, reference_id, phenotype_id, experiment_id, mutant_id, allele_id, reporter_id, strain_name, details)

        annotation_id = key_to_annotation_id.get(key)

        group_id = 1
        if annotation_id is None:
            annotation_id = insert_phenotypeannotation(nex_session, fw, 
                                                       source_id, created_by,
                                                       dbentity_id, taxonomy_id, 
                                                       reference_id, phenotype_id, 
                                                       experiment_id, mutant_id, 
                                                       allele_id, allele_comment, 
                                                       reporter_id, reporter_comment, 
                                                       strain_name, details)
            key_to_annotation_id[key] = annotation_id
        else:
            group_id = annotation_id_to_last_group_id.get(annotation_id)
            if group_id is None:
                group_id = 1
            else:
                group_id = group_id + 1

        ## insert conditions here

        m = 0
        
        for r in range(0, int(len(cond_header)/3)):
            cond_name  = conds[m]
            cond_value = conds[m+1]
            cond_unit  = conds[m+2]
            cond_class = cond_header[m].split("_")[0]
            m = m + 3
            if cond_name == "":
                continue
            if cond_class == "chemical":
                chemical_names = cond_name.split(',')
                chemical_values = cond_value.split(',')
                chemical_units = cond_unit.split(',')
                
                print("chemical_names=", chemical_names)
                print("chemical_values=", chemical_values)
                print("chemical_units=", chemical_units)

                n = 0
                for chemical_name in chemical_names:
                    chebiid = None
                    if chemical_name.startswith("CHEBI:"):
                        chebiid = chemical_name
                    else:
                        chebiid = "CHEBI:" + chemical_name
                    chebiid = chebiid.replace(" ", "")
                    cond_name = chebiid_to_name.get(chebiid)
                    cond_value = chemical_values[n]
                    cond_unit = chemical_units[n]

                    print("cond_name=", cond_name)
                    print("cond_value=", cond_value)
                    print("cond_unit=", cond_unit)

                    n = n + 1
                    if cond_name is None:
                        print("The ChEBI ID", chebiid, " is not in the database.")
                        continue
                    insert_phenotypeannotation_cond(nex_session, fw, created_by,
                                                    annotation_id, group_id,
                                                    cond_class, cond_name,
                                                    cond_value, cond_unit)
            else:
                
                # if cond_class in ['temperature', 'treatment'] and cond_unit.endswith('C'):
                #    cond_unit = degree
                
                insert_phenotypeannotation_cond(nex_session, fw, created_by, 
                                                annotation_id, group_id,
                                                cond_class, cond_name, 
                                                cond_value, cond_unit)

        annotation_id_to_last_group_id[annotation_id] = group_id

    ########## 
    # nex_session.rollback()
    nex_session.commit()
    
    fw.close()
    f.close()


def insert_phenotypeannotation_cond(nex_session, fw, created_by, annotation_id, group_id, cond_class, cond_name, cond_value, cond_unit):

    print("New phenotypeannotation_cond:", created_by, annotation_id, group_id, cond_class, cond_name,cond_value, cond_unit)

    x = PhenotypeannotationCond(annotation_id = annotation_id, 
                                group_id = group_id,
                                condition_class = cond_class, 
                                condition_name = cond_name, 
                                condition_value = cond_value,
                                condition_unit = cond_unit,
                                created_by = created_by)
    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)                            
    

def insert_reporter(nex_session, fw, source_id, created_by, reporter_name):

    reporter_name= reporter_name.replace('"', '')

    print("NEW Reporter:", created_by, reporter_name)

    format_name = reporter_name.replace(" ", "_").replace("/", "-")
    obj_url = "/reporter/" + format_name

    x = Reporter(format_name = format_name,
                 display_name = reporter_name,
                 obj_url = obj_url,
                 source_id = source_id,
                 created_by = created_by)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

    fw.write("Insert a new reporter: display_name=" + reporter_name + "\n")

    return x.reporter_id


def insert_allele(nex_session, fw, source_id, created_by, allele_name): 

    allele_name = allele_name.replace('"', '')

    print("NEW Allele:", created_by, allele_name)
    
    format_name = allele_name.replace(" ", "_").replace("/", "-")
    obj_url = "/allele/" + format_name

    x = Allele(format_name = format_name,
               display_name = allele_name,
               obj_url = obj_url,
               source_id = source_id,
               created_by = created_by)
    
    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)

    fw.write("Insert a new allele: display_name=" + allele_name + "\n")

    return x.allele_id


def insert_phenotypeannotation(nex_session, fw, source_id, created_by, dbentity_id, taxonomy_id, reference_id, phenotype_id, experiment_id, mutant_id, allele_id, allele_comment, reporter_id, reporter_comment, strain_name, details):

    print("NEW phenotypeannotation: ", created_by, dbentity_id, taxonomy_id, reference_id, phenotype_id, experiment_id, mutant_id, allele_id, allele_comment, reporter_id, reporter_comment, strain_name, details)

    allele_comment = allele_comment.replace('"', '')
    reporter_comment = reporter_comment.replace('"', '')
    # details = details.replace('"', '').decode('utf8')
    details = details.replace('"', '')
    

    x = Phenotypeannotation(source_id = source_id,
                            dbentity_id = dbentity_id, 
                            taxonomy_id = taxonomy_id, 
                            reference_id = reference_id, 
                            phenotype_id = phenotype_id, 
                            experiment_id = experiment_id, 
                            mutant_id = mutant_id, 
                            allele_id = allele_id, 
                            allele_comment = allele_comment, 
                            reporter_id = reporter_id, 
                            reporter_comment = reporter_comment, 
                            strain_name = strain_name, 
                            details = details,
                            created_by = created_by)

    nex_session.add(x)
    nex_session.flush()
    nex_session.refresh(x)
    
    fw.write("Insert a new phenotypeannotation: dbentity_id=" + str(dbentity_id) + " reference_id=" + str(reference_id) + " phenotype_id=" + str(phenotype_id) + " experiment_id=" + str(experiment_id) + " mutant_id=" + str(mutant_id) + "\n")
    
    return x.annotation_id


if __name__ == '__main__':

    infile = None
    if len(sys.argv) >= 2:
         infile = sys.argv[1]
    else:
        print("Usage:         python load_phenotype.py datafile")
        print("Usage example: python load_phenotype.py scripts/loading/phenotype/data/phenotype_dataCuration091717.tsv")
        exit()
    
    logfile = "scripts/loading/phenotype/logs/" + infile.split('/')[4].replace(".txt", ".log")
    
    load_phenotypes(infile, logfile)



