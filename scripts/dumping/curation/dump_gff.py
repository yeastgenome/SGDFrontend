from datetime import datetime
import logging
import os
import sys
import importlib
importlib.reload(sys)  # Reload does the trick!
# sys.setdefaultencoding('UTF8') # only for python2
import boto
from boto.s3.key import Key
import transaction
import gzip
import shutil
from src.models import Dbentity, Locusdbentity, LocusAlias, Dnasequenceannotation, \
                       Dnasubsequence, So, Contig, Go, Goannotation, Edam, Path, \
                       FilePath, Filedbentity, Source
from scripts.loading.database_session import get_session
from src.helpers import upload_file

__author__ = 'sweng66'

logging.basicConfig(format='%(message)s')
log = logging.getLogger()
log.setLevel(logging.INFO)

S3_ACCESS_KEY = os.environ['S3_ACCESS_KEY']
S3_SECRET_KEY = os.environ['S3_SECRET_KEY']
S3_BUCKET = os.environ['S3_BUCKET']

CREATED_BY = os.environ['DEFAULT_USER']
 
gff_file = "scripts/dumping/curation/data/saccharomyces_cerevisiae.gff"
landmark_file = "scripts/dumping/curation/data/landmark_gene.txt"

chromosomes = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX',
               'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'Mito']

def dump_data():
 
    nex_session = get_session()

    fw = open(gff_file, "w")

    datestamp = str(datetime.now()).split(" ")[0].replace("-", "")

    write_header(fw, str(datetime.now()))

    log.info(str(datetime.now()))
    log.info("Getting edam, so, source, & sgdid  data from the database...")

    edam_to_id = dict([(x.format_name, x.edam_id) for x in nex_session.query(Edam).all()])
    source_to_id = dict([(x.display_name, x.source_id) for x in nex_session.query(Source).all()])
    so_id_to_display_name = dict([(x.so_id, x.display_name) for x in nex_session.query(So).all()])
    locus_id_to_sgdid = dict([(x.dbentity_id, x.sgdid) for x in nex_session.query(Dbentity).filter_by(subclass='LOCUS', dbentity_status='Active').all()])
    
    log.info(str(datetime.now()))
    log.info("Getting alias data from the database...")

    alias_data = nex_session.query(LocusAlias).filter(LocusAlias.alias_type.in_(['Uniform', 'Non-uniform', 'NCBI protein name'])).all()

    locus_id_to_aliases = {}
    for x in alias_data:
        aliases = []
        if x.locus_id in locus_id_to_aliases:
            aliases = locus_id_to_aliases[x.locus_id]
        aliases.append(do_escape(x.display_name))
        locus_id_to_aliases[x.locus_id] = aliases
        
    log.info(str(datetime.now()))
    log.info("Getting locus data from the database...")

    locus_id_to_info = dict([(x.dbentity_id, (x.systematic_name, x.gene_name, x.qualifier, x.headline, x.description)) for x in nex_session.query(Locusdbentity).filter_by(has_summary='1').all()])
    
    log.info(str(datetime.now()))
    log.info("Getting go annotation data from the database...")
    
    go_id_to_goid = dict([(x.go_id, x.goid) for x in nex_session.query(Go).all()])

    go_data = nex_session.query(Goannotation).filter(Goannotation.annotation_type != 'computational').all()

    locus_id_to_goids = {}
    for x in go_data:
        goid = go_id_to_goid[x.go_id]
        goids = []
        if x.dbentity_id in locus_id_to_goids:
            goids = locus_id_to_goids[x.dbentity_id]
        goids.append(goid)
        locus_id_to_goids[x.dbentity_id] = goids

    log.info(str(datetime.now()))
    log.info("Getting chromosome data from the database...")
    
    ## check curators to see what should we set for chr dbxref ID? SGDID or
    ## GenBank Accession (eg, BK006935.2) or RefSeq ID (eg, NC_001133.9)  
    format_name_list = ["Chromosome_" + x for x in chromosomes]
    chr_to_contig = dict([(x.format_name.replace("Chromosome_", ""), (x.contig_id, x.genbank_accession, len(x.residues))) for x in nex_session.query(Contig).filter(Contig.format_name.in_(format_name_list)).all()])
    chr_to_seq = dict([(x.format_name.replace("Chromosome_", ""), x.residues) for x in nex_session.query(Contig).filter(Contig.format_name.in_(format_name_list)).all()])

    log.info(str(datetime.now()))
    log.info("Getting dnasequenceannotation/dnasubsequence data from the database...")

    subfeature_data = nex_session.query(Dnasubsequence).order_by(Dnasubsequence.contig_start_index, Dnasubsequence.contig_end_index).all()

    landmark_gene = get_landmark_genes()

    for chr in chromosomes:

        (contig_id, accession_id, length) = chr_to_contig[chr]

        if chr == 'Mito':
            chr = 'mt'

        fw.write("chr" + chr + "\tSGD\tchromosome\t1\t" + str(length) + "\t.\t.\t.\tID=chr" + chr + ";dbxref=NCBI:" + accession_id + ";Name=chr" + chr + "\n")

        # get features for each contig_id
        # print features in the order of chromosome and coord
    
        gene_data = nex_session.query(Dnasequenceannotation).filter_by(contig_id=contig_id, dna_type='GENOMIC').order_by(Dnasequenceannotation.start_index, Dnasequenceannotation.end_index).all()
        
        annotation_id_to_subfeatures = {}
        UTRs = {}
        for x in subfeature_data:
            subfeatures = []
            if x.annotation_id in annotation_id_to_subfeatures:
                subfeatures = annotation_id_to_subfeatures[x.annotation_id]
            subfeatures.append((x.display_name, x.contig_start_index, x.contig_end_index))
            annotation_id_to_subfeatures[x.annotation_id] = subfeatures
            if x.display_name == 'five_prime_UTR_intron':
                UTRs[x.annotation_id] = (x.contig_start_index, x.contig_end_index)

        for x in gene_data:
            
            if x.dbentity_id not in locus_id_to_sgdid:
                # deleted or merged
                continue

            sgdid = "SGD:" + locus_id_to_sgdid[x.dbentity_id]

            type = so_id_to_display_name[x.so_id]
            if type == 'ORF':
                type = 'gene'
            if type == 'gene_group':
                continue

            (systematic_name, gene_name, qualifier, headline, description) = locus_id_to_info[x.dbentity_id]

            if systematic_name in landmark_gene:
                fw.write("chr" + chr + "\tlandmark\tregion\t" + str(x.start_index) + "\t" + str(x.end_index) + "\t.\t" + x.strand + "\t.\tID=" + landmark_gene[systematic_name] + "\n")

            alias_list = None
            if x.dbentity_id in locus_id_to_aliases:
                aliases = sorted(locus_id_to_aliases[x.dbentity_id])
                alias_list = ",".join(aliases) 
            if gene_name:
                gene_name = do_escape(gene_name)
                if alias_list:
                    alias_list = gene_name + "," + alias_list
                else:
                    alias_list = gene_name
            systematic_name = do_escape(systematic_name)
            strand = x.strand
            if strand == '0':
                strand = '.'
            start_index = x.start_index
            end_index = x.end_index
            if x.annotation_id in UTRs:
                (utrStart, utrEnd) = UTRs[x.annotation_id]
                if utrStart < start_index:
                    start_index = utrStart
                else:
                    end_index = utrEnd
                    
            fw.write("chr" + chr + "\tSGD\t" + type + "\t" + str(start_index) + "\t" + str(end_index) + "\t.\t" + strand + "\t.\tID=" + systematic_name + ";Name=" + systematic_name)

            if gene_name:
                fw.write(";gene=" + gene_name)
            if alias_list:
                fw.write(";Alias=" + alias_list)
            if x.dbentity_id in locus_id_to_goids:
                goids = sorted(locus_id_to_goids[x.dbentity_id])
                goid_list = ",".join(goids)
                fw.write(";Ontology_term=" + goid_list)
            if description:
                fw.write(";Note=" + do_escape(description))
            if headline:
                fw.write(";display=" + do_escape(headline))

            fw.write(";dbxref=" + sgdid)

            if qualifier:
                fw.write(";orf_classification=" + qualifier)

            fw.write(";curie=" + sgdid + "\n")

            if x.annotation_id not in annotation_id_to_subfeatures or type in ['pseudogene']:
                continue

            subfeatures = annotation_id_to_subfeatures.get(x.annotation_id)

            start2phase = get_phase(subfeatures, x.strand)

            telomeric_repeat_index = {}

            for (display_name, contig_start_index, contig_end_index) in subfeatures:

                if display_name == 'non_transcribed_region':
                    continue

                name = systematic_name + "_" + display_name

                if systematic_name.startswith("TEL") and display_name == 'telomeric_repeat':
                    index = 1
                    if name in telomeric_repeat_index:
                        index = telomeric_repeat_index[name] + 1
                    telomeric_repeat_index[name] = index
                    name = name + "_" + str(index)

                phase = "."
                if display_name == 'CDS':
                    phase = start2phase[contig_start_index]

                if type == 'gene':
                    parent = systematic_name + "_mRNA" 
                    fw.write("chr" + chr + "\tSGD\t" + display_name + "\t" + str(contig_start_index) + "\t" + str(contig_end_index) + "\t.\t" + x.strand + "\t" + str(phase) + "\tParent=" + parent + ";Name=" + name)
                    if qualifier:
                        fw.write(";orf_classification=" + qualifier)
                    fw.write("\n")
                else:
                    fw.write("chr" + chr + "\tSGD\t" + display_name + "\t" + str(contig_start_index) + "\t" + str(contig_end_index) + "\t.\t" + strand + "\t" + str(phase) + "\tID=" + name + ";Name=" + name + ";dbxref=" + sgdid + ";curie=" + sgdid + "\n");
    
            if type == 'gene':
                fw.write("chr" + chr + "\tSGD\tmRNA\t" + str(start_index) + "\t" + str(end_index) + "\t.\t" + x.strand + "\t.\tID=" + systematic_name + "_mRNA;Name=" + systematic_name + "_mRNA;Parent=" + systematic_name + "\n")

    # output 17 chr sequences at the end 
    
    for chr in chromosomes:
        seq = chr_to_seq[chr]
        if chr == 'Mito':
            chr = 'mt'
        fw.write(">chr"+ chr + "\n")
        formattedSeq = formated_seq(seq)
        fw.write(formattedSeq + "\n")

    fw.close()

    gzip_file =gzip_gff_file(gff_file,datestamp)

    log.info("Uploading gff3 file to S3...")

    update_database_load_file_to_s3(nex_session, gff_file, gzip_file, source_to_id, edam_to_id)

    nex_session.close()

    log.info(str(datetime.now()))
    log.info("Done!")


def formated_seq(sequence):

    return "\n".join([sequence[i:i+80] for i in range(0, len(sequence), 80)])

    
def get_landmark_genes():

    landmark_gene = {}

    f = open(landmark_file)
    for line in f:
        pieces = line.strip().split("\t")
        landmark_gene[pieces[1]] = pieces[0]
    f.close()

    return landmark_gene


def get_phase(subfeatures, strand):

    if strand == '-':
        subfeatures.reverse()

    length = 0
    start2phase = {}
    for (display_name, contig_start_index, contig_end_index) in subfeatures:
        if display_name != 'CDS':
            continue
        phase = length % 3
        if phase != 0:
            phase = 3 - phase
        start2phase[contig_start_index] = phase
        length += contig_end_index - contig_start_index + 1

    return start2phase


def do_escape(text):

    text = text.replace(" ", "%20").replace("(", "%28").replace(")", "%29")
    text = text.replace(",", "%2C")
    return text


def upload_gff_to_s3(file, filename):

    s3_path = filename
    conn = boto.connect_s3(S3_ACCESS_KEY, S3_SECRET_KEY)
    bucket = conn.get_bucket(S3_BUCKET)
    k = Key(bucket)
    k.key = s3_path
    k.set_contents_from_file(file, rewind=True)
    k.make_public()
    transaction.commit()


def gzip_gff_file(gff_file, datestamp):

    # gff_file  = saccharomyces_cerevisiae.gff
    # gzip_file = saccharomyces_cerevisiae.20170114.gff.gz                                                                 
    gzip_file = gff_file.replace(".gff", "") + "." + datestamp + ".gff.gz"

    with open(gff_file, 'rb') as f_in, gzip.open(gzip_file, 'wb') as f_out:
         shutil.copyfileobj(f_in, f_out)

    return gzip_file


def update_database_load_file_to_s3(nex_session, gff_file, gzip_file, source_to_id, edam_to_id):

    local_file = open(gzip_file, mode='rb')
    
    ### upload a current GFF file to S3 with a static URL for Go Community ###
    upload_gff_to_s3(local_file, "latest/saccharomyces_cerevisiae.gff.gz")
    ##########################################################################

    import hashlib
    gff_md5sum = hashlib.md5(gff_file.encode()).hexdigest()
    row = nex_session.query(Filedbentity).filter_by(md5sum = gff_md5sum).one_or_none()

    if row is not None:
        return

    gzip_file = gzip_file.replace("scripts/dumping/curation/data/", "")

    nex_session.query(Dbentity).filter(Dbentity.display_name.like('saccharomyces_cerevisiae.%.gff.gz')).filter(Dbentity.dbentity_status=='Active').update({"dbentity_status":'Archived'}, synchronize_session='fetch')
    nex_session.commit()

    data_id = edam_to_id.get('EDAM:3671')   ## data:3671    Text
    topic_id = edam_to_id.get('EDAM:3068')  ## topic:3068   Literature and language
    format_id = edam_to_id.get('EDAM:3507') ## format:3507  Document format

    from sqlalchemy import create_engine
    from src.models import DBSession
    engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
    DBSession.configure(bind=engine)
    
    readme = nex_session.query(Dbentity).filter_by(display_name="saccharomyces_cerevisiae_gff.README", dbentity_status='Active').one_or_none()
    if readme is None:
        log.info("saccharomyces_cerevisiae_gff.README is not in the database.")
        return
    readme_file_id = readme.dbentity_id

    # path.path = /reports/chromosomal-features

    upload_file(CREATED_BY, local_file,
                filename=gzip_file,
                file_extension='gz',
                description='GFF file for yeast genes (protein and RNA)',
                display_name=gzip_file,
                data_id=data_id,
                format_id=format_id,
                topic_id=topic_id,
                status='Active',
                readme_file_id=readme_file_id,
                is_public='1',
                is_in_spell='0',
                is_in_browser='0',
                file_date=datetime.now(),
                source_id=source_to_id['SGD'],
                md5sum=gff_md5sum)

    gff = nex_session.query(Dbentity).filter_by(display_name=gzip_file, dbentity_status='Active').one_or_none()

    if gff is None:
        log.info("The " + gzip_file + " is not in the database.")
        return
    file_id = gff.dbentity_id

    path = nex_session.query(Path).filter_by(path="/reports/chromosomal-features").one_or_none()
    if path is None:
        log.info("The path: /reports/chromosomal-features is not in the database.")
        return
    path_id = path.path_id

    x = FilePath(file_id = file_id,
                 path_id = path_id,
                 source_id = source_to_id['SGD'],
                 created_by = CREATED_BY)

    nex_session.add(x)
    nex_session.commit()

    log.info("Done uploading " + gff_file)


def write_header(fw, datestamp):
    
    fw.write("##gff-version 3\n")
    fw.write("#date " + datestamp.split(".")[0] + "\n")
    fw.write("#\n")
    fw.write("# Saccharomyces cerevisiae S288C genome (version=R64-2-1)\n")
    fw.write("#\n")
    fw.write("# Features from the 16 nuclear chromosomes labeled chrI to chrXVI,\n")
    fw.write("# plus the mitochondrial genome labeled chrmt.\n")
    fw.write("#\n")
    fw.write("# Created by Saccharomyces Genome Database (http://www.yeastgenome.org/)\n")
    fw.write("#\n")
    fw.write("# Weekly updates of this file are available for download from:\n")
    fw.write("# https://yeastgenome.org/latest/saccharomyces_cerevisiae.gff\n")
    fw.write("#\n")
    fw.write("# Please send comments and suggestions to sgd-helpdesk@lists.stanford.edu\n")
    fw.write("#\n")
    fw.write("# SGD is funded as a National Human Genome Research Institute Biomedical Informatics Resource from\n")
    fw.write("# the U. S. National Institutes of Health to Stanford University.\n")
    fw.write("#\n")

    
if __name__ == '__main__':
    
    dump_data()

    


