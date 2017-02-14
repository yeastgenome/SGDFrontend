import datetime
import factory
from src.models import DBSession, Source, Colleague, ColleagueUrl, ColleagueRelation, ColleagueKeyword, Keyword, Dbuser, Edam, \
    Referencedbentity, Journal, Book, FileKeyword, Filedbentity, Filepath, Referencedocument, Chebi, ChebiUrl, Phenotypeannotation, \
    PhenotypeannotationCond, Locusdbentity, Taxonomy, Phenotype, Apo, Allele, Reporter, Obi, Reservedname, Straindbentity, StrainUrl, \
    Strainsummary, StrainsummaryReference


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


class KeywordFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Keyword
        sqlalchemy_session = DBSession

    keyword_id = 1
    format_name = factory.Sequence(lambda n: 'protein_{0}'.format(n))
    display_name = factory.Sequence(lambda n: 'protein traffcking {0}'.format(n))
    obj_url = "/keyword/protein_trafficking,_localization_and_degradation"
    source_id = 1
    description = "my description"
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
    citation = factory.Sequence(lambda n: 'citation_{0}'.format(n))
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
    med_abbr = factory.Sequence(lambda n: 'med_{0}'.format(n))
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
    filepath_id = 1
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

class ReferenceDocumentFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Referencedocument
        sqlalchemy_session = DBSession

    referencedocument_id = 1
    document_type = "Medline"
    text = "Bla bla bla"
    html = "<bla></bla>"
    source_id = 1
    reference_id = 1
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
    format_name = factory.Sequence(lambda n: 'format_{0}'.format(n))
    display_name = "My entity"
    obj_url = "http://example.org/entity"
    source_id = 1
    sgdid = "S000001"
    dbentity_status = "Active"
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


class ApoFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Apo
        sqlalchemy_session = DBSession

    apo_id = 1
    format_name = "appo"
    display_name = "APPo"
    obj_url = "/obj/apo"
    source_id = 1
    apoid = 1
    apo_namespace = "qualifier"
    description = "This is appo"
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
    reference_id = 2
    reference_order = 1
    source_id = 1
    date_created = factory.LazyAttribute(lambda o: datetime.datetime.utcnow())
    created_by = "TOTO"