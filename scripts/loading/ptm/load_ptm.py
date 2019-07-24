import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
sys.setdefaultencoding('UTF8')
sys.path.insert(0, '../../../src/')
from models import Posttranslationannotation, Locusdbentity, Referencedbentity, Psimod, Taxonomy, \
                   Source
sys.path.insert(0, '../')
from database_session import get_nex_session as get_session
from config import CREATED_BY

__author__ = 'sweng66'

log_file = "logs/load_ptm.log"
taxon_id = "TAX:4932"

files_to_load = ['data/methylationSitesPMID25109467.txt',
                 'data/ubiquitinationSites090314.txt',
                 'data/phosphorylationUbiquitinationPMID23749301.txt',
                 'data/succinylationAcetylation090914.txt',
                 'data/gap1_Ub_PMID11500494.txt',
                 'data/PTMsitesPMID25344756.txt',
                 'data/PTMs_20150623.txt',
                 'data/PTMsites062615.txt',
                 'data/PTMsites091715.txt',
                 'data/PTMsites102315.txt',
                 'data/PTMsites112115.txt',
                 'data/PTMsites011516.txt',
                 'data/Phosphosites031516.txt',
                 'data/PTMdata062416.txt',
                 'data/PTMdata080316PMID17761666.txt',
                 'data/PTMdata19779198_092616.txt',
                 'data/PTMdata102116.txt',
                 'data/PTMdata121516.txt']


def load_data():

    nex_session = get_session()

    pmid_to_reference_id = dict([(x.pmid, x.dbentity_id) for x in nex_session.query(Referencedbentity).all()])     
    term_to_psimod_id = dict([(x.display_name, x.psimod_id) for x in nex_session.query(Psimod).all()])
    sgd = nex_session.query(Source).filter_by(format_name='SGD').one_or_none()
    source_id = sgd.source_id

    taxonomy = nex_session.query(Taxonomy).filter_by(taxid=taxon_id).one_or_none()
    taxonomy_id = taxonomy.taxonomy_id

    name_to_dbentity_id = {}
    for x in nex_session.query(Locusdbentity).all():
        name_to_dbentity_id[x.systematic_name] = x.dbentity_id
        if x.gene_name:
            name_to_dbentity_id[x.gene_name] = x.dbentity_id

    key_to_id = {}
    for x in nex_session.query(Posttranslationannotation).all():
        modifier_id = ""
        if x.modifier_id is not None:
            modifier_id = x.modifier_id
        key = (x.dbentity_id, x.reference_id, x.site_index, x.site_residue, x.psimod_id, modifier_id)
        key_to_id[key] = x.annotation_id


    modification_to_psimod_term_mapping = get_psimod_mapping()

    fw = open(log_file, "w")

    for file_name in files_to_load:

        print("LOADING DATA from: ", file_name)

        f = open(file_name)
        
        for line in f:
            if line.startswith('feature_name') or line.startswith('ORF'):
                continue
            pieces = line.split('\t')
            if pieces[0] is None or line == '\n':
                continue
            dbentity_id = name_to_dbentity_id.get(pieces[0])
            if dbentity_id is None:
                print("The ", pieces[0], " is not in the DBENTITY table.")
                continue
            site = pieces[1].strip()
            site_residue = site[0]
            site_index = int(site[1:])
            modification_type = ""
            modifiers = ""
            pmid = ""
            if file_name.endswith('16.txt'):
                modification_type = pieces[2].strip()
                modifiers = pieces[3]
                pmid = int(pieces[4].replace('PMID:', ''))
            elif file_name.endswith('PMID17761666.txt'):
                modification_type = pieces[2].strip()
                modifiers = pieces[3]
                pmid = 17761666
            else:
                ## old files
                modification_type = pieces[3].strip()
                modifiers = pieces[4]
                source = pieces[5]
                pmid = int(pieces[6].replace('PMID:', ''))

            psimod_term = modification_to_psimod_term_mapping.get(modification_type)
            if psimod_term is None:
                psimod_term = modification_type
            psimod_id = term_to_psimod_id.get(psimod_term)
            if psimod_id is None:
                print("The PSIMOD term ", psimod_term, " is not in PSIMOD table.")
                continue
            reference_id = pmid_to_reference_id.get(pmid)
            if reference_id is None:
                print("The PMID=", pmid, " is not in REFERENCEDBENTITY table.")
                continue

            modifiers = modifiers.strip().replace(" | ", "|")
            if modifiers:
                for modifier in modifiers.upper().split('|'):
                    modifier_id = name_to_dbentity_id.get(modifier)
                    if modifier_id is None:
                        print("The modifier: ", modifier, " is not in LOCUSDBENTITY table.")
                        continue
                    key = (dbentity_id, reference_id, site_index, site_residue, psimod_id, modifier_id)
                    if key in key_to_id:
                        continue
                    insert_into_database(nex_session, fw, taxonomy_id, source_id, 
                                         dbentity_id, reference_id, site_index, 
                                         site_residue, psimod_id, modifier_id, line)
                    # if dbentity_id == 1268752:
                    #    print "NEW-HHF1:", line
            else:
                key = (dbentity_id, reference_id, site_index, site_residue, psimod_id, "")
                if key in key_to_id:
                    continue
                insert_into_database(nex_session, fw, taxonomy_id, source_id,
                                     dbentity_id, reference_id, site_index, 
                                     site_residue, psimod_id, "", line)

                # if dbentity_id == 1268752:
                #    print "NEW-HHF1:", line

        f.close()

    fw.close()

def insert_into_database(nex_session, fw, taxonomy_id, source_id, dbentity_id, reference_id, site_index, site_residue, psimod_id, modifier_id, line):

    print("NEW:", dbentity_id, reference_id, site_index, site_residue, psimod_id, modifier_id)

    y = None
    if modifier_id:
        y = Posttranslationannotation(taxonomy_id = taxonomy_id, 
                                      source_id = source_id,
                                      dbentity_id = dbentity_id,
                                      reference_id = reference_id,
                                      site_index = site_index,
                                      site_residue = site_residue,
                                      psimod_id = psimod_id,
                                      modifier_id = modifier_id,
                                      created_by = CREATED_BY)
    else:
        y = Posttranslationannotation(taxonomy_id = taxonomy_id,
                                      source_id = source_id,
                                      dbentity_id = dbentity_id,
                                      reference_id = reference_id,
                                      site_index = site_index,
                                      site_residue = site_residue,
                                      psimod_id= psimod_id,
                                      created_by = CREATED_BY)
    nex_session.add(y)
    nex_session.commit()

    fw.write("Insert NEW Posttranslationannotation for line: " + line)

def get_psimod_mapping():

    return { "2-amino-3-oxo-butanoic acid": "2-amino-3-oxobutanoic acid",
             "acetylation": "acetylated residue",
             "butyrylation": "butanoylated residue",
             "carbamidomethylation": "carbamoylated residue",
             "deacetylation": "deacetylation residue",
             "deamidation": "deamidation residue",
             "demethylation": "demethylation residue",
             "di-methylation": "dimethylated residue",
             "dimethylation": "dimethylated residue",
             "ethylation": "ethylated residue",
             "farnesylation": "farnesylated residue",
             "N-glycosylation": "glycosylated residue",
             "glycosylation": "glycosylated residue",
             "methylation": "methylated residue",
             "mono-methylation": "monomethylated residue",
             "monomethylation": "monomethylated residue",
             "monoubiquitination": "ubiquitinylated lysine",
             "neddylation": "neddylated lysine",
             "oxidation": "methionine oxidation with neutral loss of 64 Da",
             "palmitoylation": "palmitoylated residue",
             "phosphorylation": "phosphorylated residue",
             "piperidination": "piperidination residue",
             "propionylation": "propanoylated residue",
             "succinylation": "succinylated residue",
             "sumoylation": "sumoylated lysine",
             "thiophosphorylation": "thiophosphorylated residue",
             "trimethylation": "trimethylated residue",
             "ubiquitination": "ubiquitinylated lysine" }



if __name__ == '__main__':

    load_data()

