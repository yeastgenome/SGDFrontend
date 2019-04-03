from datetime import datetime
import logging
import os
import sys
reload(sys)  
sys.setdefaultencoding('UTF8')
from src.models import Taxonomy, Source, Contig, Edam, Path, FilePath, So, \
                       Dnasequenceannotation, Dnasubsequence, Locusdbentity, \
                       Dbentity, Go, EcoAlias, Goannotation, LocusAlias, \
                       Referencedbentity, Ec
from scripts.loading.database_session import get_session
from src.helpers import upload_file

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

CREATED_BY = os.environ['DEFAULT_USER']

data_dir = "scripts/dumping/ncbi/data/"

TAXON = "TAX:559292"

TABS = "\t\t\t"

namespace_mapping = { 'biological process' : 'go_process',
                      'cellular component' : 'go_component',
                      'molecular function' : 'go_function' }

def dump_data():
 
    nex_session = get_session()

    datestamp = str(datetime.now()).split(" ")[0].replace("-", "")

    log.info(str(datetime.now()))
    log.info("Getting basic data from the database...")
    
    taxon = nex_session.query(Taxonomy).filter_by(taxid = TAXON).one_or_none()
    taxonomy_id = taxon.taxonomy_id
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()]) 
    so_id_to_display_name = dict([(x.so_id, x.display_name) for x in nex_session.query(So).all()])
    dbentity_id_to_locus = dict([(x.dbentity_id, x) for x in nex_session.query(Locusdbentity).all()])
    edam_to_id = dict([(x.format_name, x.edam_id) for x in nex_session.query(Edam).all()])
    reference_id_to_pmid = dict([(x.dbentity_id, x.pmid) for x in nex_session.query(Referencedbentity).all()])
    dbentity_id_to_sgdid = dict([(x.dbentity_id, x.sgdid) for x in nex_session.query(Dbentity).filter_by(subclass='LOCUS').all()])
    dbentity_id_to_status = dict([(x.dbentity_id, x.dbentity_status) for x in nex_session.query(Dbentity).filter_by(subclass='LOCUS').all()])
    go_id_to_go = dict([(x.go_id, x) for x in nex_session.query(Go).all()])
    ec_id_to_display_name = dict([(x.ec_id, x.display_name) for x in nex_session.query(Ec).all()])
    
    log.info(str(datetime.now()))
    log.info("Getting aliases from the database...")

    locus_id_to_uniform_names = {}
    locus_id_to_ncbi_protein_name = {}
    locus_id_to_protein_id = {}
    locus_id_to_ecnumbers = {}

    for x in  nex_session.query(LocusAlias).filter(LocusAlias.alias_type.in_(['Uniform', 'TPA protein version ID', 'NCBI protein name', 'EC number'])).all():

        if x.alias_type == 'EC number':
            ecnumbers = []
            if x.locus_id in locus_id_to_ecnumbers:
                ecnumbers = locus_id_to_ecnumbers[x.locus_id]
            ecnumbers.append(x.display_name)
            locus_id_to_ecnumbers[x.locus_id] = ecnumbers
            continue

        if x.alias_type == 'Uniform':
            uniform_names = []
            if x.locus_id in locus_id_to_uniform_names:
                uniform_names = locus_id_to_uniform_names[x.locus_id]
            uniform_names.append(TABS + "gene_syn\t" + x.display_name)
            locus_id_to_uniform_names[x.locus_id] = uniform_names
        elif x.alias_type == 'NCBI protein name':
            locus_id_to_ncbi_protein_name[x.locus_id] = TABS + "product\t" + x.display_name
        elif x.alias_type == 'TPA protein version ID':
            locus_id_to_protein_id[x.locus_id] = TABS + "protein_id\t" + x.display_name
    
            
    log.info(str(datetime.now()))
    log.info("Getting GO data from the database...")

    [locus_id_to_go_section, go_to_eco_list] = get_go_data(nex_session)

    ## open file handles for each chromosome
    files = open_file_handles()

    ## map chromosome roman numeral to chromosome number
    chr2num = get_chr_to_num_mapping()    
    
    log.info(str(datetime.now()))
    log.info("Getting genbank accessions from the database...")

    ## get genbank_accession for each chromosome number
    contig_id_to_chrnum = {}
    for x in nex_session.query(Contig).filter_by(taxonomy_id = taxonomy_id).all():
        if x.format_name.startswith("Chromosome_"): 
            chr = x.format_name.replace("Chromosome_", "")
            chrnum = chr2num[chr]
            contig_id_to_chrnum[x.contig_id] = chrnum
            if chrnum == 17:
                files[chrnum].write(">Feature ref|NC_001224|\n")
            else:
                files[chrnum].write(">Feature tpg|" + x.genbank_accession + "|\n")

    ## get protein IDs for duplicate genes
    duplicate_gene_to_protein_id = get_protein_id_for_duplicate_gene()
    
    log.info(str(datetime.now()))
    log.info("Getting all features from the database...")

    ## get all features with 'GENOMIC' sequence in S288C
    main_data = [] 
    annotation_id_to_strand = {}
    for x in nex_session.query(Dnasequenceannotation).filter_by(taxonomy_id = taxonomy_id, dna_type='GENOMIC').all():
        if x.contig_id not in contig_id_to_chrnum:
            continue
        locus = dbentity_id_to_locus[x.dbentity_id]
        if dbentity_id_to_status[x.dbentity_id] != 'Active':
            continue
        if locus.qualifier == 'Dubious':
            # or locus.headline.startswith('Deleted ')  or locus.headline.startswith('Merged '): 
            continue
        # print contig_id_to_chrnum[x.contig_id], locus.systematic_name, locus.gene_name, so_id_to_display_name[x.so_id], x.start_index, x.end_index, x.strand, locus.description
        main_data.append((x.annotation_id, x.dbentity_id, contig_id_to_chrnum[x.contig_id], locus.systematic_name, locus.gene_name, so_id_to_display_name[x.so_id], x.start_index, x.end_index, x.strand, locus.description))
        annotation_id_to_strand[x.annotation_id] = x.strand    
    
    log.info(str(datetime.now()))
    log.info("Getting subfeatures from the database...")

    type_mapping = type_to_show()

    [annotation_id_to_cds_data, annotation_id_to_frameshift, annotation_id_to_cde_data] = get_cds_data(nex_session, annotation_id_to_strand, type_mapping)

    log.info(str(datetime.now()))
    log.info("Creating tbl files...")

    for row in main_data:

        # print row 
        (annotation_id, locus_id, chrnum, systematic_name, gene_name, feature_type, start, stop, strand, desc) = row

        desc = clean_up_desc(desc)

        # unless gene_name is not None or "RNA" in feature_type or feature_type in ['LTR_retrotransposon', 'long_terminal_repeat']:
        # gene_name = systematic_name
        
        if strand == '-':
            (start, stop) = (stop, start)

        sgdid = dbentity_id_to_sgdid[locus_id]

        type = feature_type
        if type in type_mapping:
            type = type_mapping[type]
        if "RDN37-" in systematic_name:
            type = "misc_RNA"
        
        if feature_type in ['ORF', 'transposable_element_gene']:

            add_ORF_features(files, annotation_id, locus_id, sgdid, chrnum, systematic_name, 
                             gene_name, start, stop, desc, annotation_id_to_cds_data,
                             annotation_id_to_frameshift, locus_id_to_uniform_names, 
                             locus_id_to_ncbi_protein_name, duplicate_gene_to_protein_id, 
                             locus_id_to_protein_id, locus_id_to_go_section, go_to_eco_list, 
                             locus_id_to_ecnumbers, type)
            continue

        if feature_type in ['pseudogene', 'blocked_reading_frame']:

            add_pseudogenes(files, annotation_id, locus_id, sgdid, chrnum, 
                            systematic_name, gene_name, start, stop, desc, 
                            annotation_id_to_cds_data, locus_id_to_uniform_names, 
                            type, feature_type)
            continue

        if systematic_name.startswith('NTS'):

            ## only four of them: NTS1-2, NTS2-1, NTS2-2, NTS1-1
            add_NTS_features(files, chrnum, systematic_name, sgdid, start, stop, desc)
            continue

        if feature_type.endswith('RNA_gene'):
            
            add_RNA_genes(files, annotation_id, locus_id, sgdid, chrnum, systematic_name, 
                          gene_name, start, stop, desc, annotation_id_to_cds_data, 
                          locus_id_to_go_section, go_to_eco_list, type, feature_type)
            continue

        if feature_type == 'centromere':
            
            add_centromeres(files, locus_id, sgdid, chrnum, systematic_name,
                            gene_name, start, stop, desc, type,
                            annotation_id_to_cde_data.get(annotation_id))
            continue

        if feature_type == 'LTR_retrotransposon':

            add_retrotransposons(files, sgdid, chrnum, systematic_name, start, stop, desc, type)
            continue

        if feature_type == 'telomere':

            add_telomeres(files, sgdid, chrnum, systematic_name, start, stop, desc, type)
            continue

        if feature_type == 'long_terminal_repeat':

            add_LTR(files, sgdid, chrnum, start, stop, desc, type)
            continue

        if feature_type in ['ARS', 'origin_of_replication', 'silent_mating_type_cassette_array', 'mating_type_region', 'matrix_attachment_site']:
            
            add_ARS_etc(files, sgdid, chrnum, systematic_name, gene_name, start, stop, desc, type)
        

    for i in range(18):
        files[i].close()

    # log.info("Uploading GAF file to S3...")

    # update_database_load_file_to_s3(nex_session, gaf_file, '1', source_to_id, edam_to_id, datestamp)

    nex_session.close()

    log.info(str(datetime.now()))
    log.info("Done!")


def add_LTR(files, sgdid, chrnum, start, stop, desc, type):

    files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")
    files[chrnum].write(TABS + "note\t" + desc + "\n")
    files[chrnum].write(TABS + "evidence\tnot_experimental\n")
    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")


def add_telomeres(files, sgdid, chrnum, systematic_name, start, stop, desc, type):
    
    files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")
    files[chrnum].write(TABS + "note\t" + systematic_name + "; " + desc + "\n")
    files[chrnum].write(TABS + "evidence\tnot_experimental\n")
    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")


def add_retrotransposons(files, sgdid, chrnum, systematic_name, start, stop, desc, type):

    files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")
    files[chrnum].write(TABS + "mobile_element_type\tretrotransposon:" + systematic_name + "\n")
    files[chrnum].write(TABS + "note\t" + systematic_name + "; " + desc + "\n")
    files[chrnum].write(TABS + "evidence\tnot_experimental\n")
    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")


def add_ARS_etc(files, sgdid, chrnum, systematic_name, gene_name, start, stop, desc, type):

    files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")
    name = systematic_name
    if gene_name and gene_name != systematic_name:
        name = gene_name
    files[chrnum].write(TABS + "note\t" + name + "\n")
    files[chrnum].write(TABS + "note\t" + desc + "\n")
    if gene_name and gene_name != systematic_name:
        files[chrnum].write(TABS + "evidence\texperimental\n")
    else:
        files[chrnum].write(TABS + "evidence\tnot_experimental\n")
    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")


def add_centromeres(files, locus_id, sgdid, chrnum, systematic_name, gene_name, start, stop, desc, type, cde_data):

    files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")
    files[chrnum].write(TABS + "note\t" + systematic_name + "; " + desc + "\n")
    files[chrnum].write(TABS + "evidence\texperimental\n")
    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")
    
    if cde_data is None:
        return

    for cde in cde_data:
        cde = cde.replace("REPLACE_THIS", systematic_name)
        files[chrnum].write(cde+"\n")


def add_pseudogenes(files, annotation_id, locus_id, sgdid, chrnum, systematic_name, gene_name, start, stop, desc, annotation_id_to_cds_data, locus_id_to_uniform_names, type, feature_type):

    files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")

    mRNA_lines = ""

    if feature_type == 'pseudogene':
        mRNA_lines = str(start)+"\t"+str(stop)+"\tmRNA\n"

    if gene_name:
        files[chrnum].write(TABS + type + "\t" + gene_name + "\n")
        mRNA_lines += TABS + type + "\t"+ gene_name + "\n"

    if locus_id in locus_id_to_uniform_names:
        for uniform_name in locus_id_to_uniform_names[locus_id]:
            files[chrnum].write(uniform_name+"\n")
            mRNA_lines += uniform_name+"\n"
    files[chrnum].write(TABS + "locus_tag\t" + systematic_name + "\n")
    mRNA_lines += TABS + "locus_tag\t" + systematic_name + "\n"

    files[chrnum].write(TABS + "pseudo\n")

    if feature_type != 'pseudogene':
        for cds in  annotation_id_to_cds_data[annotation_id]:
            files[chrnum].write(cds + "\n")

    if gene_name:
        files[chrnum].write(TABS + "evidence\texperimental\n")
    else:
        files[chrnum].write(TABS + "evidence\tnot_experimental\n")

    if desc:
        files[chrnum].write(TABS + "note\t" + desc + "\n")

    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")

    if feature_type == 'pseudogene':
        files[chrnum].write(mRNA_lines)


def add_NTS_features(files, chrnum, systematic_name, sgdid, start, stop, desc):
    
    files[chrnum].write(str(start)+"\t"+str(stop)+"\tmisc_feature\n")
    files[chrnum].write(TABS + "note\t" + systematic_name + "\n") 
    if desc:
        files[chrnum].write(TABS + "note\t"+ desc + "\n")
    files[chrnum].write(TABS + "evidence\tnot_experimental\n")
    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")

def add_RNA_genes(files, annotation_id, locus_id, sgdid, chrnum, systematic_name, gene_name, start, stop, desc, annotation_id_to_cds_data, locus_id_to_go_section, go_to_eco_list, type, feature_type):
    
    files[chrnum].write(str(start)+"\t"+str(stop)+"\tgene\n")

    if gene_name and gene_name.upper() != systematic_name.upper():
        files[chrnum].write(TABS + "gene\t" + gene_name + "\n")
        
    files[chrnum].write(TABS + "locus_tag\t" + systematic_name + "\n")

    product = systematic_name
    if feature_type != 'tRNA_gene':
        if systematic_name.startswith('ETS') or systematic_name.startswith('ITS'):
            type = 'misc_RNA'
        files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")
    else:
        if annotation_id not in annotation_id_to_cds_data:
            files[chrnum].write(str(start)+"\t"+str(stop)+"\ttRNA\n")
        else:
            for row in annotation_id_to_cds_data[annotation_id]:
                files[chrnum].write(row + "\n")

    if type == 'ncRNA':
        type = feature_type.replace("_gene", "")
        # class = ncRNA_class_mapping.get(gene_name, 'other')
        files[chrnum].write(TABS + "ncRNA_class\t" + type + "\n")
        product = gene_name if gene_name else systematic_name

    files[chrnum].write(TABS + "product\t" + product + "\n")

    if desc:
        files[chrnum].write(TABS + "note\t" + desc + "\n")

    if gene_name and gene_name.upper() != systematic_name.upper():
        files[chrnum].write(TABS + "evidence\texperimental\n")
    else:
        files[chrnum].write(TABS + "evidence\tnot_experimental\n")

    go_section = locus_id_to_go_section.get(locus_id, [])
    go_session = go_section.sort()
    for go_line in go_section:
        eco_list = go_to_eco_list[go_line]
        eco_list.sort()
        files[chrnum].write(go_line + "|" + ",".join(eco_list) + "\n")

    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")


def add_ORF_features(files, annotation_id, locus_id, sgdid, chrnum, systematic_name, gene_name, start, stop, desc, annotation_id_to_cds_data, annotation_id_to_frameshift, locus_id_to_uniform_names, locus_id_to_ncbi_protein_name, duplicate_gene_to_protein_id, locus_id_to_protein_id, locus_id_to_go_section, go_to_eco_list, locus_id_to_ecnumbers, type):

    files[chrnum].write(str(start)+"\t"+str(stop)+"\t" + type + "\n")

    mRNA_lines = ""
 
    if annotation_id in annotation_id_to_frameshift:
        mRNA_lines += str(start)+"\t"+str(stop)+"\tmRNA\n"
    else:
        for cds in  annotation_id_to_cds_data[annotation_id]:
            mRNA_lines += cds.replace('CDS', 'mRNA') +"\n"
    
    if gene_name:
        files[chrnum].write(TABS + type + "\t" + gene_name + "\n")
        mRNA_lines += TABS + type + "\t"+ gene_name + "\n"

    if locus_id in locus_id_to_uniform_names:
        for uniform_name in locus_id_to_uniform_names[locus_id]:
            files[chrnum].write(uniform_name+"\n")
            mRNA_lines += uniform_name+"\n"
    files[chrnum].write(TABS + "locus_tag\t" + systematic_name + "\n")
    mRNA_lines += TABS + "locus_tag\t" + systematic_name + "\n"

    for cds in  annotation_id_to_cds_data[annotation_id]:
        files[chrnum].write(cds + "\n")

    if annotation_id in annotation_id_to_frameshift:
        files[chrnum].write(TABS + "exception\tribosomal slippage\n")

    if locus_id in locus_id_to_ncbi_protein_name:
        files[chrnum].write(locus_id_to_ncbi_protein_name[locus_id]+"\n")
        mRNA_lines += locus_id_to_ncbi_protein_name[locus_id]+"\n"
    elif gene_name is None:
        files[chrnum].write(TABS + "product\thypothetical protein\n")
        mRNA_lines += TABS + "product\thypothetical protein\n"
    else:
        files[chrnum].write(TABS + "product\t" + gene_name.title() + "p\n")
        mRNA_lines += TABS + "product\t" + gene_name.title() + "p\n"

    protein_id = duplicate_gene_to_protein_id.get(sgdid)
    if protein_id is None:
        protein_id = locus_id_to_protein_id.get(locus_id)
    else:
        protein_id = TABS + "protein_id\t" + protein_id
    if protein_id:
        files[chrnum].write(protein_id+"\n")

    if locus_id in locus_id_to_ecnumbers:
        for ec in locus_id_to_ecnumbers[locus_id]:
            ec = ec.replace("EC:", "")
            files[chrnum].write(TABS + "EC_number\t" + ec + "\n")

    if desc:
        files[chrnum].write(TABS + "note\t" + desc + "\n")

    if gene_name:
        files[chrnum].write(TABS + "evidence\texperimental\n")
    else:
        files[chrnum].write(TABS + "evidence\tnot_experimental\n")

    go_section = locus_id_to_go_section.get(locus_id, [])
    go_session = go_section.sort()
    for go_line in go_section:
        eco_list = go_to_eco_list[go_line]
        eco_list.sort()
        files[chrnum].write(go_line + "|" + ",".join(eco_list) + "\n")

    files[chrnum].write(TABS + "db_xref\tSGD:" + sgdid + "\n")

    files[chrnum].write(mRNA_lines)


def type_to_show():

    return { 'ORF'                               : 'gene',
             'ARS'                               : 'rep_origin',
             'origin_of_replication'             : 'rep_origin',
             'ARS_consensus_sequence'            : 'rep_origin',
             'CDS'                               : 'CDS',
             'telomeric_repeat'                  : 'repeat_region',
             'X_element_combinatorial_repeat'    : 'repeat_region',
             'X_element'                         : 'repeat_region',
             'Y_prime_element'                   : 'repeat_region',
             'telomere'                          : 'telomere',
             'centromere'                        : 'centromere',
             'centromere_DNA_Element_I'          : 'centromere',
             'centromere_DNA_Element_II'         : 'centromere',
             'centromere_DNA_Element_III'        : 'centromere',
             'silent_mating_type_cassette_array' : 'misc_feature',
             'mating_type_region'                : 'misc_feature',
             'matrix_attachment_site'            : 'misc_feature',
             'long_terminal_repeat'              : 'LTR',
             'LTR_retrotransposon'               : 'mobile_element',
             'snoRNA_gene'                       : 'ncRNA',
             'snRNA_gene'                        : 'ncRNA',
             'ncRNA_gene'                        : 'ncRNA',
             'rRNA_gene'                         : 'rRNA',
             'telomerase_RNA_gene'               : 'ncRNA',
             'transposable_element_gene'         : 'gene',
             'pseudogene'                        : 'gene',
             'blocked_reading_frame'             : 'gene',
             'tRNA_gene'                         : 'tRNA',
             'noncoding_exon'                    : 'tRNA' }


def rpt_to_show():
    
    return { 'telomeric_repeat'                : 'Telomeric Repeat',
             'X_element_combinatorial_repeat'  : 'X element Combinatorial Repeat',
             'X_element'                       : 'X element',
             'Y_prime_element'                 : "Y_prime_element",
             'telomere'                        : 'Telomeric Region',
             'LTR_retrotransposon'             : 'Transposon' }


# def ncRNA_class():
#
#    return { 'TLC1' : 'telomerase_RNA',
#             'RPR1' : 'RNase_P_RNA',
#             'SCR1' : 'SRP_RNA',
#             'RPM1' : 'RNase_MRP_RNA' }


def open_file_handles():

    chrom = []
    for i in range (18):
        if i < 10:
            chrom.append("0" + str(i))
        else:
            chrom.append(str(i))
            
    print chrom

    files = [open(data_dir + "chr" + chr + ".tbl", "w") for chr in chrom]
    
    return files


def get_cds_data(nex_session, annotation_id_to_strand, type_mapping):
    
    annotation_id_to_cds_data = {}
    annotation_id_to_frameshift = {}
    annotation_id_to_cde_data = {}

    annotation_id_to_display_name = {}

    for x in nex_session.query(Dnasubsequence).all():

        if x.annotation_id not in annotation_id_to_strand:
            continue

        if x.display_name == 'plus_1_translational_frameshift':
            annotation_id_to_frameshift[x.annotation_id] = 1
            continue

        if x.display_name in ['intron', 'intein_encoding_region', 'uORF', 'five_prime_UTR_intron', 'telomeric_repeat']:
            continue

        annotation_id_to_display_name[x.annotation_id] = x.display_name

        (start, end) = (x.contig_start_index, x.contig_end_index)
        if annotation_id_to_strand[x.annotation_id] == '-':
            (start, end) = (end, start)

        if x.display_name.startswith('centromere'):
            cde_data = []
            if x.annotation_id in annotation_id_to_cde_data:
                cde_data = annotation_id_to_cde_data[x.annotation_id]
            cde_data.append(str(start)+"\t"+str(end)+"\tcentromere")
            display_name = "REPLACE_THIS_CDE" + x.display_name.replace("centromere_DNA_Element_", "") + " of REPLACE_THIS"
            cde_data.append(TABS + "note\t" + display_name)
            cde_data.append(TABS + "evidence\tnot_experimental")
            annotation_id_to_cde_data[x.annotation_id] = cde_data

        # if x.display_name not in ['CDS']:
        #    continue

        cds_data = []
        if x.annotation_id in annotation_id_to_cds_data:
            cds_data = annotation_id_to_cds_data[x.annotation_id]
        cds_data.append(str(start)+"\t"+str(end))
        annotation_id_to_cds_data[x.annotation_id] = cds_data

    annotation_id_to_cds_data_sorted = {}
    
    for annotation_id in annotation_id_to_cds_data:
        cds_data = annotation_id_to_cds_data[annotation_id]
        cds_data.sort()
        if annotation_id_to_strand.get(annotation_id) is not None and annotation_id_to_strand.get(annotation_id) == '-':
            cds_data = list(reversed(cds_data))

        new_cds_data = []    
        i = 0
        for row in cds_data:
            if i == 0:
                display_name = annotation_id_to_display_name[annotation_id]
                if display_name in type_mapping:
                    display_name = type_mapping[display_name]
                new_cds_data.append(row + "\t" + display_name)
            else:
                new_cds_data.append(row)
            i = i + 1

        annotation_id_to_cds_data_sorted[annotation_id] = new_cds_data

    return [annotation_id_to_cds_data_sorted, annotation_id_to_frameshift, annotation_id_to_cde_data]


def get_go_data(nex_session):

    reference_id_to_pmid = dict([(x.dbentity_id, x.pmid) for x in nex_session.query(Referencedbentity).all()])
    go_id_to_go = dict([(x.go_id, x) for x in nex_session.query(Go).all()])

    eco_id_to_eco = {}
    for x in nex_session.query(EcoAlias).all():
        if len(x.display_name) > 5:
            continue
        eco_id_to_eco[x.eco_id] = x.display_name

    locus_id_to_go_section = {}

    go_to_eco_list = {}

    for x in nex_session.query(Goannotation).all():

        pmid = reference_id_to_pmid.get(x.reference_id)
        if pmid is None:
            pmid = ''
        eco = eco_id_to_eco[x.eco_id]
        go = go_id_to_go[x.go_id]

        # if eco in ['ND', 'IEA'] or go.display_name == go.go_namespace:
        #    continue

        goline = TABS + namespace_mapping[go.go_namespace] + "\t" + go.display_name + "|" + go.goid + "|" + str(pmid)
        eco_list = []
        if goline in go_to_eco_list:
            eco_list = go_to_eco_list[goline]
        if eco not in eco_list:
            eco_list.append(eco)
        go_to_eco_list[goline] = eco_list
        
        # print goline

        go_section = []
        if x.dbentity_id in locus_id_to_go_section:
            go_section = locus_id_to_go_section[x.dbentity_id]
        if goline not in go_section:
            go_section.append(goline)
        locus_id_to_go_section[x.dbentity_id] = go_section

    return [locus_id_to_go_section, go_to_eco_list]


def get_protein_id_for_duplicate_gene():

    return { 'S000000214' : 'DAA07131.1', # HHT1                   
             'S000004976' : 'DAA10514.1', # HHT2                   
             'S000000213' : 'DAA07130.1', # HHF1                   
             'S000004975' : 'DAA10515.1', # HHF2                   
             'S000000322' : 'DAA07236.1', # TEF2                   
             'S000006284' : 'DAA11498.1', # TEF1                   
             'S000003674' : 'DAA08662.1', # TIF2                   
             'S000001767' : 'DAA09210.1', # TIF1                   
             'S000002793' : 'DAA12229.1', # EFT2                   
             'S000005659' : 'DAA10907.1' }  # EFT1                   

    
def get_chr_to_num_mapping():

    return { "I":     1,
             "II":    2,
             "III":   3,
             "IV":    4,
             "V":     5,
             "VI":    6,
             "VII":   7,
             "VIII":  8,
             "IX":    9,
             "X":     10,
             "XI":    11,
             "XII":   12,
             "XIII":  13,
             "XIV":   14,
             "XV":    15,
             "XVI":   16,
             "Mito":  17 }

def clean_up_desc(desc):

    desc = desc.replace("<i>", "").replace("</i>", "")

    return desc.replace("Putative protein of unknown function", "hypothetical protein").replace("Protein of unknown function", "hypothetical protein").replace("protein of unknown function", "hypothetical protein").replace("Hypothetical protein", "hypothetical protein")
          
   
def update_database_load_file_to_s3(nex_session, gaf_file, is_public, source_to_id, edam_to_id, datestamp):

    gzip_file = gaf_file + "." + datestamp + ".gz"
    import gzip
    import shutil
    with open(gaf_file, 'rb') as f_in, gzip.open(gzip_file, 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)

    local_file = open(gzip_file)

    import hashlib
    gaf_md5sum = hashlib.md5(local_file.read()).hexdigest()
    row = nex_session.query(Filedbentity).filter_by(md5sum = gaf_md5sum).one_or_none()

    if row is not None:
        return

    gzip_file = gzip_file.replace("scripts/dumping/curation/data/", "")

    nex_session.query(Dbentity).filter_by(display_name=gzip_file, dbentity_status='Active').update({"dbentity_status": 'Archived'})
    nex_session.commit()

    data_id = edam_to_id.get('EDAM:2048')   ## data:2048 Report
    topic_id = edam_to_id.get('EDAM:0085')  ## topic:0085 Functional genomics
    format_id = edam_to_id.get('EDAM:3475') ## format:3475 TSV

    if "yeastmine" not in gaf_file:
        from sqlalchemy import create_engine
        from src.models import DBSession
        engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
        DBSession.configure(bind=engine)
    
    readme = nex_session.query(Dbentity).filter_by(display_name="gene_association.README", dbentity_status='Active').one_or_none()
    if readme is None:
        log.info("gene_association.README is not in the database.")
        return
    readme_file_id = readme.dbentity_id
 
    # path.path = /reports/function

    upload_file(CREATED_BY, local_file,
                filename=gzip_file,
                file_extension='gz',
                description='All GO annotations for yeast genes (protein and RNA) in GAF file format',
                display_name=gzip_file,
                data_id=data_id,
                format_id=format_id,
                topic_id=topic_id,
                status='Active',
                readme_file_id=readme_file_id,
                is_public=is_public,
                is_in_spell='0',
                is_in_browser='0',
                file_date=datetime.now(),
                source_id=source_to_id['SGD'])

    gaf = nex_session.query(Dbentity).filter_by(display_name=gzip_file, dbentity_status='Active').one_or_none()
    if gaf is None:
        log.info("The " + gzip_file + " is not in the database.")
        return
    file_id = gaf.dbentity_id

    path = nex_session.query(Path).filter_by(path="/reports/function").one_or_none()
    if path is None:
        log.info("The path /reports/function is not in the database.")
        return
    path_id = path.path_id

    x = FilePath(file_id = file_id,
                 path_id = path_id,
                 source_id = source_to_id['SGD'],
                 created_by = CREATED_BY)

    nex_session.add(x)
    nex_session.commit()


if __name__ == '__main__':
    
    dump_data()

    


