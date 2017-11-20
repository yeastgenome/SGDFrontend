import logging
import os
import sys
from src.models import Dbentity, Locusdbentity, Referencedbentity, Taxonomy, \
                       Go, Ro, EcoAlias, Source, Goannotation, Goextension, \
                       Gosupportingevidence, LocusAlias
from scripts.loading.database_session import get_session

__author__ = 'sweng66'

logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.INFO)

outfile = "scripts/dumping/curation/data/gene_association.sgd"
outfile4yeastmine = "scripts/dumping/curation/data/gene_association.sgd-yeastmine"

namespace_to_code = { "biological process": 'P',
                      "molecular function": 'F',
                      "cellular component": 'C' }

DBID = 0
NAME = 1
QUALIFIER = 2
GOID = 3
REFERENCE = 4
EVIDENCE = 5
SUPPORT_EVIDENCE = 6
ASPECT = 7
HEADLINE = 8
ALIAS = 9
TAG = 10
TAXON = 11
DATE = 12
SOURCE = 13
ANNOT_TYPE = 14 ## for yeastmine
LAST_FIELD = 13

DATABASE = 'Saccharomyces Genome Database (SGD)'
URL = 'http://www.yeastgenome.org/'
EMAIL = 'sgd-helpdesk@lists.stanford.edu'
FUNDING = 'NHGRI at US NIH, grant number 5-P41-HG001315'
DB = 'SGD'
TAXON_ID = '559292'
NAME_TYPE = 'gene'

def dump_data():
 
    nex_session = get_session()

    fw = open(outfile, "w")
    fw2 = open(outfile4yeastmine, "w")

    log.info("Getting data from the database...")

    id_to_source = dict([(x.source_id, x.display_name) for x in nex_session.query(Source).all()])
    id_to_gene = dict([(x.dbentity_id, (x.systematic_name, x.gene_name, x.headline, x.qualifier)) for x in nex_session.query(Locusdbentity).all()])
    id_to_go = dict([(x.go_id, (x.goid, x.display_name, x.go_namespace)) for x in nex_session.query(Go).all()])
    id_to_pmid = dict([(x.dbentity_id, x.pmid) for x in nex_session.query(Referencedbentity).all()])
    id_to_sgdid = dict([(x.dbentity_id, x.sgdid) for x in nex_session.query(Dbentity).filter(Dbentity.subclass.in_(['REFERENCE', 'LOCUS'])).all()])
    id_to_taxon = dict([(x.taxonomy_id, x.taxid) for x in nex_session.query(Taxonomy).all()])
    id_to_ro = dict([(x.ro_id, x.display_name) for x in nex_session.query(Ro).all()])

    id_to_eco = {}
    for x in nex_session.query(EcoAlias).all():
        if len(x.display_name) > 5:
            continue
        id_to_eco[x.eco_id] = x.display_name

    id_to_alias_list = {}
    for x in nex_session.query(LocusAlias).filter(LocusAlias.alias_type.in_(['Uniform', 'Non-uniform', 'NCBI protein name'])).all():
        alias_list = ''
        if x.locus_id in id_to_alias_list:
            alias_list = id_to_alias_list[x.locus_id] + "|" + x.display_name
        else:
            alias_list = x.display_name
        id_to_alias_list[x.locus_id] = alias_list

    annotation_id_to_extensions = {}
    group_id_to_extensions = {}
    pre_annot_id = 0
    for x in nex_session.query(Goextension).order_by(Goextension.annotation_id, Goextension.group_id.asc()).all():
        if pre_annot_id != x.annotation_id and pre_annot_id !=0:
            annotation_id_to_extensions[pre_annot_id] = group_id_to_extensions
            group_id_to_extensions = {}
        extensions = []
        if x.group_id in group_id_to_extensions:
            extensions = group_id_to_extensions[x.group_id]
        extensions.append(id_to_ro[x.ro_id]+'(' + x.dbxref_id + ')')
        group_id_to_extensions[x.group_id] = extensions
        pre_annot_id = x.annotation_id

    annotation_id_to_evidences = {}
    group_id_to_evidences = {}
    pre_annot_id = 0
    for x in nex_session.query(Gosupportingevidence).order_by(Gosupportingevidence.annotation_id, Gosupportingevidence.group_id.asc()).all():
        if pre_annot_id != x.annotation_id and pre_annot_id !=0:
            annotation_id_to_evidences[pre_annot_id] = group_id_to_evidences
            group_id_to_evidences = {}
        evidences = []
        if x.group_id in group_id_to_evidences:
            evidences = group_id_to_evidences[x.group_id]
        evidences.append(x.dbxref_id)
        group_id_to_evidences[x.group_id] = evidences
        pre_annot_id = x.annotation_id

    loaded = {}

    for x in nex_session.query(Goannotation).all():

        row = [None] * (LAST_FIELD+1)

        (feature_name, gene_name, headline, qualifier) = id_to_gene[x.dbentity_id]

        if qualifier == 'Dubious':
            continue

        if gene_name is None:
            gene_name = feature_name
        if headline:
            headline = headline.strip()
        row[NAME] = gene_name
        row[HEADLINE] = headline
        row[DBID] = id_to_sgdid[x.dbentity_id]
        
        alias_list = id_to_alias_list.get(x.dbentity_id)
        if alias_list is None:
            alias_list = feature_name
        else:
            alias_list = feature_name + "|" + alias_list
        row[ALIAS] = alias_list

        (goid, go_term, go_aspect) = id_to_go[x.go_id]
        row[GOID] = goid

        reference = "SGD_REF:" + id_to_sgdid[x.reference_id]
        if id_to_pmid.get(x.reference_id) is not None:
            reference = reference + "|" + "PMID:" + str(id_to_pmid.get(x.reference_id))
        row[REFERENCE] = reference

        go_qualifier = ""
        if x.go_qualifier in ['NOT', 'contributes_to', 'colocalizes_with']:
            go_qualifier = x.go_qualifier

        row[QUALIFIER] = go_qualifier
        row[ASPECT] = namespace_to_code[go_aspect]

        eco_code = id_to_eco[x.eco_id]
        row[EVIDENCE] = eco_code

        source = id_to_source[x.source_id]
        row[SOURCE] = source

        date_created = x.date_created
        if eco_code == 'IEA' or (eco_code in ['IBA', 'IRD', 'IKR'] and source == 'GO_Central'):
            date_created = x.date_assigned
        row[DATE] = str(date_created).split(' ')[0].replace("-", "")
        row[TAXON] = "taxon:" + TAXON_ID
        row[TAG] = NAME_TYPE

        all_support_evidences = {"1": []}
        if x.annotation_id in annotation_id_to_evidences:
            all_support_evidences = annotation_id_to_evidences[x.annotation_id]
        
        all_extensions = {"1": []}
        if x.annotation_id in annotation_id_to_extensions:
            all_extensions = annotation_id_to_extensions[x.annotation_id]

        found = {}
    
        for evid_group_id in sorted(all_support_evidences.iterkeys()):
            support_evidences = ",".join(all_support_evidences[evid_group_id])
            for ext_group_id in sorted(all_extensions.iterkeys()):
                extensions = ",".join(all_extensions[ext_group_id])
                if (support_evidences, extensions) in found:
                    continue
                found[(support_evidences, extensions)] = 1
                fw.write(DB + "\t")
                fw2.write(DB + "\t")
                for i in range(0, LAST_FIELD+1):
                    if i == 6:
                        fw.write(support_evidences + "\t")
                        fw2.write(support_evidences + "\t")
                    else:
                        fw.write(str(row[i]) + "\t")
                        fw2.write(str(row[i]) + "\t")

                    if i == LAST_FIELD:
                        fw.write(extensions + "\n")
                        fw2.write(extensions + "\t" + x.annotation_type + "\n")

    nex_session.close()
    fw.close()
    fw2.close()

    log.info("Done!")


if __name__ == '__main__':
    
    dump_data()

    


