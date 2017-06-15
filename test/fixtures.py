import datetime
import factory
from src.models import DBSession, Source, Colleague, ColleagueUrl, ColleagueRelation, ColleagueKeyword, Keyword, Dbuser, Dbentity, Edam, \
    Referencedbentity, Journal, Book, FileKeyword, Filedbentity, Filepath, Referencedocument, Chebi, ChebiUrl, Phenotypeannotation, \
    PhenotypeannotationCond, Locusdbentity, Locussummary, Taxonomy, Phenotype, Apo, Allele, Reporter, Obi, Reservedname, Straindbentity, StrainUrl, \
    Strainsummary, StrainsummaryReference, Dataset, DatasetReference, DatasetKeyword, Referencetype, ReferenceRelation, ReferenceUrl, Referenceauthor, \
    Physinteractionannotation, Geninteractionannotation, Goannotation, Regulationannotation, Literatureannotation, Contig, EcoAlias, EcoUrl, Goextension, \
    Gosupportingevidence, Eco, Ro, Go, GoRelation, GoUrl, GoAlias, ApoRelation, Referencetriage, Proteinsequenceannotation, ProteinsequenceDetail, \
    Goslimannotation, Goslim, Expressionannotation, Datasetsample, DatasetUrl, DatasetFile, ReferenceAlias, Dnasequenceannotation, Dnasubsequence, So, ContigUrl


class SourceFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Source
        sqlalchemy_session = DBSession

    source_id = 1
    format_name = "Addgene"
    display_name = "Addgene"
    bud_id = 1035
    description = "Plasmid Repository"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

    
class ColleagueFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Colleague
        sqlalchemy_session = DBSession

    colleague_id = 113698
    format_name = factory.Sequence(lambda n: 'Jimmy_{0}'.format(n))
    display_name = "Jimmy Page"
    obj_url = "/colleague/Jimmy_Page_LZ"
    source_id = 1
    bud_id = 549
    orcid = None
    last_name = "Page"
    first_name = "Jimmy"
    suffix = None
    other_last_name = None
    profession = "Yeast Geneticist/Molecular biologist"
    job_title = "Graduate Student"
    institution = "Stanford Universty"
    address1 = "Genome Research Center"
    address2 = None
    address3 = None
    city = "Palo Alto"
    state = "CA"
    country = "USA"
    postal_code = "94015"
    work_phone = "444-444-4444"
    other_phone = None
    email = "jimmy.page@example.org"
    research_interest = "mRNA decay, translation, mRNA decay"
    is_pi = False
    is_contact = True
    display_email = True
    is_beta_tester = True
    date_last_modified = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class KeywordFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Keyword
        sqlalchemy_session = DBSession

    keyword_id = 1
    format_name = factory.Sequence(lambda n: 'protein_{0}'.format(n))
    #display_name = factory.Sequence(lambda n: 'protein traffcking {0}'.format(n))
    display_name = "protein trafficking 7"
    obj_url = "/keyword/protein_trafficking,_localization_and_degradation"
    source_id = 1
    description = "my description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class DatasetKeywordFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = DatasetKeyword
        sqlalchemy_session = DBSession

    dataset_keyword_id = 1
    keyword_id = 1
    dataset_id = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"
    keyword = factory.SubFactory(KeywordFactory)


class DatasetFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Dataset
        sqlalchemy_session = DBSession

    dataset_id = 1
    format_name = "GSE10018"
    display_name = "Artemisinic Acid Production Stress in Yeast"
    obj_url = "/dataset/Artemisinic_Acid_Production_Stress_in_Yeast"
    source_id = 1
    dbxref_id = 1
    dbxref_type = "GEO"
    date_public = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    parent_dataset_id = 1
    assay_id = 1
    channel_count = 2
    sample_count = 10
    is_in_spell = False
    is_in_browser = True
    description = "blah"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class DbuserFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Dbuser
        sqlalchemy_session = DBSession

    dbuser_id = 1
    username = "mr_curator"
    first_name = "Curator"
    last_name = "X"
    status = "Current"
    email = "curator@example.org"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    is_curator = False

class DbentityFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Dbentity
        sqlalchemy_session = DBSession

    dbentity_id = 1
    format_name = "format name"
    display_name = "display name"
    obj_url = "/reference/S000185012"
    source_id = 1
    bud_id = 1
    sgdid = 1
    subclass = "REFERENCE"
    dbentity_status = "Active"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ColleagueUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ColleagueUrl
        sqlalchemy_session = DBSession

    url_id = factory.Sequence(lambda n: n)
    display_name = "Lab"
    obj_url = factory.Sequence(lambda n: 'http://example.org/{0}'.format(n))
    source_id = 1
    bud_id = 1
    colleague_id = 113698
    url_type = "Research summary"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ColleagueRelationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ColleagueRelation
        sqlalchemy_session = DBSession

    colleague_relation_id = factory.Sequence(lambda n: n)
    source_id = 1
    bud_id = 1
    colleague_id = 113698
    associate_id = 113699
    association_type = "Lab member"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ColleagueKeywordFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ColleagueKeyword
        sqlalchemy_session = DBSession

    colleague_keyword_id = factory.Sequence(lambda n: n)
    colleague_id = 113698
    keyword_id = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class EdamFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Edam
        sqlalchemy_session = DBSession

    edam_id = 1
    format_name = "format_name"
    display_name = "display_name"
    obj_url = "/url"
    source_id = 1
    edamid = factory.Sequence(lambda n: 'protein_{0}'.format(n))
    edam_namespace = "data"
    description = "This is my description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ReferencedbentityFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Referencedbentity
        sqlalchemy_session = DBSession

    dbentity_id = 1
    method_obtained = "Curator triage"
    publication_status = "Published"
    fulltext_status = "Y"
    citation = 1
    year = 2016
    pmid = 1
    pmcid = factory.Sequence(lambda n: 'pmcid_{0}'.format(n))
    date_published = "03/15/2016"
    date_revised = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    issue = "1"
    page = "10"
    volume = "1"
    title = "Nice title"
    doi = "dodoi"
    journal_id = 1
    book_id = 1
    subclass = "REFERENCE"
    format_name = factory.Sequence(lambda n: 'format_{0}'.format(n))
    display_name = "My entity"
    obj_url = "http://example.org/entity"
    source_id = 1
    bud_id = None
    sgdid = "S000001"
    dbentity_status = "Active"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class DatasetReferenceFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = DatasetReference
        sqlalchemy_session = DBSession

    dataset_reference_id = 1
    reference_id = 1
    dataset_id = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"
    reference = factory.SubFactory(ReferencedbentityFactory)


class ReferenceUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ReferenceUrl
        sqlalchemy_session = DBSession

    url_id = 1
    display_name = "ref url"
    obj_url = "obj url"
    source_id = 1
    bud_id = 1
    reference_id = 1
    url_type = "url type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class JournalFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Journal
        sqlalchemy_session = DBSession

    journal_id = 1
    format_name = "format_name"
    display_name = "My Journal"
    obj_url = "http://example.org/journal"
    source_id = 1
    bud_id = None
    #med_abbr = factory.Sequence(lambda n: 'med_{0}'.format(n))
    med_abbr = "med_10"
    title = factory.Sequence(lambda n: 'Title {0}'.format(n))
    issn_print = "123"
    issn_electronic = "213"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class BookFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Book
        sqlalchemy_session = DBSession

    book_id = 1
    format_name = "format_name"
    display_name = "My book"
    obj_url = "http://example.org/book"
    source_id = 1
    bud_id = None
    title = factory.Sequence(lambda n: 'Title {0}'.format(n))
    volume_title = factory.Sequence(lambda n: 'Volume {0}'.format(n))
    isbn = "1234"
    total_pages = 1
    publisher = "Publisher A"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class FiledbentityFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Filedbentity
        sqlalchemy_session = DBSession

    dbentity_id = 1
    md5sum = "12345"
    previous_file_name = "filename"
    topic_id = 1
    format_id = 1
    file_date = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    is_public = True
    is_in_spell = True
    is_in_browser = True
    file_extension = "txt"
    data_id = 1
    s3_url = "http://example.org/s3"
    readme_file_id = 1
    format_name = factory.Sequence(lambda n: 'format_{0}'.format(n))
    display_name = "My entity"
    obj_url = "http://example.org/entity"
    source_id = 1
    bud_id = None
    sgdid = "S000001"
    dbentity_status = "Active"
    subclass = "FILE"
    year = 1990
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

    
class FileKeywordFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = FileKeyword
        sqlalchemy_session = DBSession

    file_keyword_id = 1
    file_id = 1
    keyword_id = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"
    
class FilepathFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Filepath
        sqlalchemy_session = DBSession

    filepath_id = 1
    source_id = 1
    filepath = "my_path"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ReferencedocumentFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Referencedocument
        sqlalchemy_session = DBSession

    referencedocument_id = 1
    document_type = "Abstract"
    text = "Bla bla bla"
    html = "<bla></bla>"
    source_id = 1
    reference_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ReferencetypeFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Referencetype
        sqlalchemy_session = DBSession

    referencetype_id = 1
    display_name = "display name"
    obj_url = "obj url"
    source_id = 1
    bud_id = 1
    reference_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ReferenceauthorFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Referenceauthor
        sqlalchemy_session = DBSession

    referenceauthor_id = 1
    display_name = "Ninzima_S"
    obj_url = 'Obj url'
    source_id = 1
    bud_id = 1
    reference_id = 1
    orcid = 1
    author_order = 1
    author_type = "type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ReferenceAliasFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ReferenceAlias
        sqlalchemy_session = DBSession

    alias_id = 1
    display_name = "name"
    source_id = 1
    bud_id = 1
    reference_id = 1
    alias_type = "alias"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ReferenceRelationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ReferenceRelation
        sqlalchemy_session = DBSession

    reference_relation_id = 1
    source_id = 1
    parent_id = 1
    child_id = 1
    relation_type = "correction type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ReferencetriageFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Referencetriage
        sqlalchemy_session = DBSession

    curation_id = 1
    pmid = 1
    citation = "citation"
    fulltext_url = "full text URL"
    abstract = "this is abstract"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"
    json = "{}"
    abstract_genes = "abstract genes"

class ProteinsequenceannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Proteinsequenceannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    taxonomy_id = 1
    reference_id = 1
    bud_id = 1
    contig_id = 1
    seq_version = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    genomerelease_id = "GR id"
    file_header = "file header"
    download_filename = "dl file name"
    file_id = 10000
    residues = "aTTTT"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ProteinsequenceDetailFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ProteinsequenceDetail
        sqlalchemy_session = DBSession

    detail_id = 1
    annotation_id = 1
    molecular_weight = 100
    protein_length = 100
    n_term_seq = "seq"
    c_term_seq = "seq"
    pi = 1
    cai = 1
    codon_bias = 1
    fop_score = 1
    gravy_score = 1
    aromaticity_score = 1
    aliphatic_index = 1
    instability_index =1
    ala = 1
    arg = 1
    asn = 1
    asp = 1
    cys = 1
    gln = 1
    glu = 1
    gly = 1
    his = 1
    ile = 1
    leu = 1
    lys = 1
    met = 1
    phe = 1
    pro = 1
    ser = 1
    thr = 1
    trp = 1
    tyr = 1
    val = 1
    hydrogen = 1
    sulfur = 1
    nitrogen = 1
    oxygen = 1
    carbon = 1
    no_cys_ext_coeff = 1
    all_cys_ext_coeff = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GoslimFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Goslim
        sqlalchemy_session = DBSession

    goslim_id = 1
    format_name = "format name"
    display_name = "display name"
    obj_url = "/obj_url"
    source_id = 1
    bud_id = 1
    go_id = 1
    slim_name = "slim name"
    genome_count = 100
    description = "description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GoslimannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Goslimannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    taxonomy_id = 1
    reference_id = 1
    goslim_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ChebiFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Chebi
        sqlalchemy_session = DBSession

    chebi_id = 1
    format_name = "mon_chebi"
    display_name = "Mon chebi"
    obj_url = "/chebi"
    source_id = 1
    chebiid = "CHEBI:8466"
    description = "This is a Chebi"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ChebiUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ChebiUrl
        sqlalchemy_session = DBSession

    url_id = 1
    display_name = "ChEBI"
    obj_url = "/chebi_url"
    source_id = 1
    chebi_id = 1
    url_type = "ChEBI"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class LocusdbentityFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Locusdbentity
        sqlalchemy_session = DBSession

    dbentity_id = 1
    systematic_name = "GENE1"
    gene_name = "GENE1"
    qualifier = "Verified"
    genetic_position = 10
    name_description = "Test gene"
    headline = "This is gene 1"
    description = "This is a description for gene 1"
    has_summary = True
    has_sequence = True
    has_history = True
    has_literature = True
    has_go = True
    has_phenotype = True
    has_interaction = True
    has_expression = True
    has_regulation = True
    has_protein = True
    has_sequence_section = True
    subclass = "LOCUS"
    format_name = "format_1"
    display_name = "My entity"
    obj_url = "http://example.org/entity"
    source_id = 1
    sgdid = "S000001"
    dbentity_status = "Active"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class PhenotypeFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Phenotype
        sqlalchemy_session = DBSession

    phenotype_id = 1
    format_name = "pheno"
    display_name = "Pheno"
    obj_url = "/obj/pheno"
    source_id = 1
    bud_id = None
    observable_id = 1
    qualifier_id = 1
    description = "phenoo"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class PhenotypeannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Phenotypeannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    bud_id = None
    taxonomy_id = 1
    reference_id = 1
    phenotype_id = 1
    experiment_id = 1
    mutant_id = 1
    allele_id = 1
    reporter_id = 1
    assay_id = 1
    strain_name = "my strain"
    details = "no details"
    phenotype = factory.SubFactory(PhenotypeFactory)
    experiment_comment = "experiment comment"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class PhenotypeannotationCondFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = PhenotypeannotationCond
        sqlalchemy_session = DBSession

    condition_id = 1
    annotation_id = 1
    condition_class = "chemical"
    condition_name = "condition"
    condition_value = "10"
    condition_unit = "C"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class TaxonomyFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Taxonomy
        sqlalchemy_session = DBSession

    taxonomy_id = 1
    format_name = "tax"
    display_name = "Tax"
    obj_url = "/obj/tax"
    source_id = 1
    taxid = "tax1"
    common_name = "The T"
    rank = "1"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ApoFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Apo
        sqlalchemy_session = DBSession

    apo_id = 1
    format_name = "appo"
    display_name = "APPo"
    namespace_group = "large-scale survey"
    obj_url = "/obj/apo"
    source_id = 1
    apoid = 1
    apo_namespace = "qualifier"
    description = "This is appo"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ApoRelationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ApoRelation
        sqlalchemy_session = DBSession

    relation_id = 1
    source_id = 1
    parent_id = 1
    child_id = 1
    ro_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class AlleleFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Allele
        sqlalchemy_session = DBSession

    allele_id = 1
    format_name = "allele"
    display_name = "Allele"
    obj_url = "/obj/allele"
    source_id = 1
    bud_id = None
    description = "The allele"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ReporterFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Reporter
        sqlalchemy_session = DBSession

    reporter_id = 1
    format_name = "reporter"
    display_name = "Reporter"
    obj_url = "/obj/reporter"
    source_id = 1
    bud_id = None
    description = "The reporter"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ObiFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Obi
        sqlalchemy_session = DBSession

    obi_id = 1
    format_name = "obi"
    display_name = "Obi"
    obj_url = "/obj/obi"
    source_id = 1
    obiid = 1
    description = "the obi"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ReservedNameFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Reservedname
        sqlalchemy_session = DBSession

    reservedname_id = 1
    format_name = "AIP5"
    display_name = "AIP5"
    obj_url = "/reservedname/AIP5"
    source_id = 1
    bud_id = 750
    locus_id = 1
    reference_id = 1
    colleague_id = 113698
    reservation_date = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    expiration_date = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    description = "blahblah"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class StraindbentityFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Straindbentity
        sqlalchemy_session = DBSession

    dbentity_id = 1
    taxonomy_id = 1
    source_id = 1
    strain_type = "Alternative Reference"
    genotype = "genotype"
    genbank_id = "genbank id"
    format_name = "some name"
    display_name = "some name"
    obj_url = "/strain/S000203483"
    sgdid = "S000203483"
    assembly_size = 10
    subclass = "STRAIN"
    fold_coverage = 5
    scaffold_number = 1
    longest_scaffold = 1000000000
    scaffold_nfifty = 10
    feature_count = 50
    headline = "some headline"
    dbentity_status = "Active"
    created_by = "TOTO"

class StrainUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = StrainUrl
        sqlalchemy_session = DBSession

    url_id = 1269391
    display_name = "Sigma1278b"
    obj_url = "http://downloads.yeastgenome.org/sequence/strains/Sigma1278b"
    source_id = 1
    strain_id = 1
    url_type = "GenBank"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class StrainsummaryFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Strainsummary
        sqlalchemy_session = DBSession

    summary_id = 1
    source_id = 1
    strain_id = 1
    summary_type = "Strain"
    text = "this is summary"
    html = "this is html text"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class StrainsummaryReferenceFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = StrainsummaryReference
        sqlalchemy_session = DBSession

    summary_reference_id = 1
    summary_id = 1
    reference_id =  2
    reference_order = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class ContigFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Contig
        sqlalchemy_session = DBSession

    contig_id = 1
    format_name = "contig name"
    display_name = "contig display name"
    obj_url = "/contig/1"
    source_id = 1
    taxonomy_id = 1
    so_id = 1
    centromere_start = 1
    centromere_end = 100
    genbank_accession = "Accession"
    gi_number = "GI:"
    refseq_id = 1
    reference_chromosome_id = 10
    reference_start = 1
    reference_end = 100
    reference_percent_identity = 13.0
    reference_alignment_length = 100
    seq_version = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    coord_version = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    genomerelease_id = 1
    file_header = "file header"
    download_filename = "download file"
    file_id = 1
    residues = "ATGC"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ContigUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = ContigUrl
        sqlalchemy_session = DBSession

    url_id = 1
    display_name = "display_name"
    obj_url = "/obj_url"
    source_id = 1
    contig_id = 1
    url_type = "url type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"



class PhysinteractionannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Physinteractionannotation
        sqlalchemy_session = DBSession


    annotation_id = 1
    dbentity1_id = 1
    dbentity2_id = 2
    source_id = 1
    reference_id = 1
    taxonomy_id = 1
    psimod_id = 1
    biogrid_experimental_system = "experiment"
    annotation_type = "manually curated"
    bait_hit = "bait"
    description = "description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GeninteractionannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Geninteractionannotation
        sqlalchemy_session = DBSession


    annotation_id = 1
    dbentity1_id = 1
    dbentity2_id = 2
    source_id = 1
    reference_id = 1
    taxonomy_id = 1
    phenotype_id = 1
    biogrid_experimental_system = "experiment"
    annotation_type = "annot type"
    bait_hit = "bait"
    description = "description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GoUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = GoUrl
        sqlalchemy_session = DBSession

    url_id = 1
    display_name = "go rel display name"
    obj_url = 1
    source_id = 1
    go_id = 1
    url_type = "url type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GoAliasFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = GoAlias
        sqlalchemy_session = DBSession

    alias_id = 1
    display_name = "display name"
    source_id = 1
    go_id = 1
    alias_type = "alias type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"



class GoRelationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = GoRelation
        sqlalchemy_session = DBSession

    relation_id = 1
    source_id = 1
    parent_id = 1
    child_id = 1
    ro_id = 1
    date_created =  factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class GoannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Goannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    taxonomy_id = 1
    reference_id = 1
    go_id = 1
    eco_id = 1
    annotation_type = "type"
    go_qualifier = "qualifier"
    date_assigned = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class PhenotypeannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Phenotypeannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    bud_id = 1
    taxonomy_id = 1
    reference_id = 1
    phenotype_id = 1
    experiment_id = 1
    mutant_id = 1
    allele_id = 1
    reporter_id = 1
    assay_id = 1
    strain_name = "name"
    details = "detail"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class RegulationannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Regulationannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    target_id = 1
    regulator_id = 1
    source_id = 1
    taxonomy_id = 1
    reference_id = 1
    eco_id = 1
    regulator_type = "regulator type"
    regulation_type = "regulation type"
    direction = "forward"
    happens_during = "condition"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class LiteratureannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Literatureannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    bud_id = 1
    taxonomy_id = 1
    reference_id = 1
    topic = "some topic"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class EcoFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Eco
        sqlalchemy_session = DBSession

    eco_id = 1
    format_name = "format name"
    display_name = "display name"
    obj_url = "obj url"
    source_id = 1
    ecoid = 1
    description = "description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class EcoAliasFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = EcoAlias
        sqlalchemy_session = DBSession

    alias_id = 1
    display_name = "eco alias display name"
    source_id = 1
    eco_id = 1
    alias_type = "eco alias type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class EcoUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = EcoUrl
        sqlalchemy_session = DBSession

    url_id = 1
    display_name = "eco url display name"
    obj_url = "obj url"
    source_id = 1
    eco_id = 1
    url_type = "url type"
    date_created =  factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GoextensionFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Goextension
        sqlalchemy_session = DBSession

    goextension_id = 1
    annotation_id = 1
    group_id = 1
    dbxref_id = "SGD:100000"
    obj_url = "obj url"
    ro_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GosupportingevidenceFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Gosupportingevidence
        sqlalchemy_session = DBSession

    gosupportingevidence_id = 1
    annotation_id = 1
    group_id = 1
    dbxref_id = "SGD:100000"
    obj_url = "obj url"
    evidence_type = "evidence type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class RoFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Ro
        sqlalchemy_session = DBSession

    ro_id = 1
    format_name = "format name"
    display_name = "display name"
    obj_url = "obj url"
    source_id = 1
    roid = 1
    description = "description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class GoFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Go
        sqlalchemy_session = DBSession

    go_id = 1
    format_name = "format name"
    display_name = "display name"
    obj_url = "obj url"
    source_id = 1
    goid = 1
    go_namespace = "biological process"
    description = "description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class DatasetsampleFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Datasetsample
        sqlalchemy_session = DBSession

    datasetsample_id = 1
    format_name = "format_name"
    display_name = "display_name"
    obj_url = "/url"
    source_id = 1
    taxonomy_id = 1
    dataset_id = 1
    sample_order = 1
    dbxref_id = 1
    dbxref_type = "type"
    biosample = "biosample"
    strain_name = "strain name"
    description = "description"
    dataset = factory.SubFactory(DatasetFactory)
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class ExpressionannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Expressionannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    taxonomy_id = 1
    reference_id = 1
    datasetsample_id = 1
    expression_value = 0.1
    datasetsample = factory.SubFactory(DatasetsampleFactory)
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class DatasetUrlFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = DatasetUrl
        sqlalchemy_session = DBSession


    url_id = 1
    display_name = "name"
    obj_url = "/obj_url"
    source_id = 1
    dataset_id = 1
    url_type = "url type"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"


class DatasetFileFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = DatasetFile
        sqlalchemy_session = DBSession

    dataset_file_id = 1
    dataset_id = 1
    file_id = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class LocussummaryFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Locussummary
        sqlalchemy_session = DBSession

    summary_id = 1
    source_id = 1
    bud_id = 1
    locus_id = 1
    summary_type = "phenotype"
    summary_order = "1"
    text = "some text"
    html = "some/html"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class DnasequenceannotationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Dnasequenceannotation
        sqlalchemy_session = DBSession

    annotation_id = 1
    dbentity_id = 1
    source_id = 1
    taxonomy_id = 1
    reference_id = 1
    bud_id = 1
    so_id = 1
    dna_type = "GENOMIC"
    contig_id = 1
    seq_version = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    coord_version = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    genomerelease_id = 1
    start_index = 1
    end_index = 10
    strand = "+"
    file_header = "file header"
    download_filename = "download file name"
    file_id = 1
    residues = "ATCGCGT"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class DnasubsequenceFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Dnasubsequence
        sqlalchemy_session = DBSession

    dnasubsequence_id = 1
    annotation_id = 1
    dbentity_id = 1
    display_name = "display name"
    bud_id = 1
    so_id = 1
    relative_start_index = 1
    relative_end_index = 10
    contig_start_index = 1
    contig_end_index = 10
    seq_version = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    coord_version = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    genomerelease_id = 1
    file_header = "file header"
    download_filename = "download file name"
    file_id = 1
    residues = "CTVCTCTCT"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"

class SoFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = So
        sqlalchemy_session = DBSession

    so_id = 1
    format_name = "format name"
    display_name = "display name"
    obj_url = "obj url"
    source_id = 1
    soid = 264265
    description = "description"
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"
