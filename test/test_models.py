import unittest
from sqlalchemy import create_engine, Column, String
from src.models import DBSession, Base, Source, Colleague, ColleagueUrl, ColleagueRelation, ColleagueKeyword, Keyword, Dbuser, Edam, Dbentity, \
    Referencedbentity, Journal, Book, FileKeyword, Filedbentity, Filepath, Referencedocument, Chebi, ChebiUrl, Phenotypeannotation, \
    PhenotypeannotationCond, Locusdbentity, Taxonomy, Phenotype, Apo, Allele, Reporter, Obi, Reservedname, Straindbentity, StrainUrl, Strainsummary, StrainsummaryReference
import fixtures as factory
import os


class ModelsTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(os.environ['NEX2_URI'], pool_recycle=3600)
        DBSession.remove()
        DBSession.configure(bind=self.engine)

        Base.metadata.create_all(self.engine)

    def tearDown(self):
        DBSession.remove()

    def test_source_model(self):
        instances = DBSession.query(Source).all()
        self.assertEqual(0, len(instances))

        source = factory.SourceFactory()
        instances = DBSession.query(Source).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(source, instances[0])

    def test_dbuser_model(self):
        instances = DBSession.query(Dbuser).all()
        self.assertEqual(0, len(instances))

        dbuser = factory.DbuserFactory()
        instances = DBSession.query(Dbuser).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(dbuser, instances[0])

    def test_colleague_model(self):
        instances = DBSession.query(Colleague).all()
        self.assertEqual(0, len(instances))

        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        self.assertEqual(colleague.source, source)

    # def test_colleague_model_info_dict(self):
    #     source = factory.SourceFactory()
    #     colleague = factory.ColleagueFactory()
    #     instances = DBSession.query(Colleague).all()
    #     colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
    #     colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")
    #
    #     colleague_2 = factory.ColleagueFactory(colleague_id=113699)
    #     factory.ColleagueRelationFactory(colleague_id=colleague.colleague_id, associate_id=colleague_2.colleague_id, association_type="Lab member")
    #     factory.ColleagueRelationFactory(colleague_id=colleague.colleague_id, associate_id=colleague_2.colleague_id, association_type="Associate")
    #
    #     keyword = factory.KeywordFactory()
    #     factory.ColleagueKeywordFactory(colleague_id=colleague.colleague_id, keyword_id=keyword.keyword_id)
    #     keyword_2 = factory.KeywordFactory(keyword_id=2, format_name="format_name")
    #     factory.ColleagueKeywordFactory(colleague_id=colleague.colleague_id, keyword_id=keyword_2.keyword_id)
    #
    #     self.assertEqual(colleague.to_info_dict(), {
    #         'orcid': colleague.orcid,
    #         'first_name': colleague.first_name,
    #         'last_name': colleague.last_name,
    #         'email': colleague.email,
    #         'position': colleague.job_title,
    #         'profession': colleague.profession,
    #         'organization': colleague.institution,
    #         'address': [colleague.address1],
    #         'city': colleague.city,
    #         'state': colleague.state,
    #         'country': colleague.country,
    #         'postal_code': colleague.postal_code,
    #         'work_phone': colleague.work_phone,
    #         'fax': colleague.fax,
    #         'webpages': {
    #             'lab_url': colleague_url_2.obj_url,
    #             'research_summary_url': colleague_url_1.obj_url
    #         },
    #         'associations': {
    #             'Lab member': [(colleague_2.first_name, colleague_2.last_name, colleague_2.format_name)],
    #             'Associate': [(colleague_2.first_name, colleague_2.last_name, colleague_2.format_name)]
    #         },
    #         'keywords': [keyword.display_name, keyword_2.display_name],
    #         'research_interests': colleague.research_interest,
    #         'last_update': str(colleague.date_last_modified)
    #     })
    #
    # def test_colleague_model_info_dict_doesnt_send_email_if_required(self):
    #     source = factory.SourceFactory()
    #     colleague = factory.ColleagueFactory(display_email = False)
    #     instances = DBSession.query(Colleague).all()
    #     colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
    #     colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")
    #     self.assertEqual(colleague.to_info_dict(), {
    #         'orcid': colleague.orcid,
    #         'first_name': colleague.first_name,
    #         'last_name': colleague.last_name,
    #         'position': colleague.job_title,
    #         'profession': colleague.profession,
    #         'organization': colleague.institution,
    #         'address': [colleague.address1],
    #         'city': colleague.city,
    #         'state': colleague.state,
    #         'country': colleague.country,
    #         'postal_code': colleague.postal_code,
    #         'work_phone': colleague.work_phone,
    #         'fax': colleague.fax,
    #         'webpages': {
    #             'lab_url': colleague_url_2.obj_url,
    #             'research_summary_url': colleague_url_1.obj_url
    #         },
    #         'research_interests': colleague.research_interest,
    #         'last_update': str(colleague.date_last_modified)
    #     })

    # def test_colleague_model_should_include_urls_in_dict(self):
    #     source = factory.SourceFactory()
    #     colleague = factory.ColleagueFactory()
    #     instances = DBSession.query(Colleague).all()
    #     colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
    #     colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")
    #
    #     colleague_dict = {}
    #     colleague._include_urls_to_dict(colleague_dict)
    #     self.assertEqual(colleague_dict, {'webpages': {'lab_url': colleague_url_2.obj_url, 'research_summary_url': colleague_url_1.obj_url}})

    def test_colleague_url_model(self):
        instances = DBSession.query(ColleagueUrl).all()
        self.assertEqual(0, len(instances))

        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()

        colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
        instances = DBSession.query(ColleagueUrl).all()

        self.assertEqual(1, len(instances))

        self.assertEqual(colleague_url_1, instances[0])
        self.assertEqual(colleague_url_1.source, source)
        self.assertEqual(colleague_url_1.colleague, colleague)

        colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")
        instances = DBSession.query(ColleagueUrl).all()

        self.assertEqual(2, len(instances))

    def test_colleague_association_model(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        colleague = factory.ColleagueFactory(colleague_id=113699)
        
        instances = DBSession.query(ColleagueRelation).all()
        self.assertEqual(0, len(instances))

        association = factory.ColleagueRelationFactory()
        instances = DBSession.query(ColleagueRelation).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(association, instances[0])
        
    # def test_colleague_model_should_include_associates_in_dict(self):
    #     source = factory.SourceFactory()
    #
    #     colleague_1 = factory.ColleagueFactory()
    #     colleague_2 = factory.ColleagueFactory(colleague_id=113699)
    #
    #     association_1_2 = factory.ColleagueRelationFactory(colleague_id=colleague_1.colleague_id, associate_id=colleague_2.colleague_id, association_type="Lab member")
    #
    #     association_2_1 = factory.ColleagueRelationFactory(colleague_id=colleague_2.colleague_id, associate_id=colleague_1.colleague_id, association_type="Head of the lab")
    #
    #     colleague_dict = {}
    #     colleague_1._include_associates_to_dict(colleague_dict)
    #     self.assertEqual(colleague_dict, {'associations': {'Lab member': [(colleague_2.first_name, colleague_2.last_name, colleague_2.format_name)]}})
    #
    #     colleague_dict = {}
    #     colleague_2._include_associates_to_dict(colleague_dict)
    #     self.assertEqual(colleague_dict, {'associations': {'Head of the lab': [(colleague_1.first_name, colleague_1.last_name, colleague_1.format_name)]}})

    def test_colleague_keywords_model(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        keyword = factory.KeywordFactory()
        
        instances = DBSession.query(ColleagueKeyword).all()
        self.assertEqual(0, len(instances))

        colleague_keyword = factory.ColleagueKeywordFactory()
        instances = DBSession.query(ColleagueKeyword).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(colleague_keyword, instances[0])
        
    def test_colleague_model_should_include_keywords_in_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        keyword = factory.KeywordFactory()
        
        factory.ColleagueKeywordFactory()

        colleague_dict = {}
        colleague._include_keywords_to_dict(colleague_dict)
        self.assertEqual(colleague_dict, {'keywords': [{'id': keyword.keyword_id, 'name': keyword.display_name}]})

        keyword_2 = factory.KeywordFactory(keyword_id=2)
        factory.ColleagueKeywordFactory(colleague_id=colleague.colleague_id, keyword_id=keyword_2.keyword_id)
        colleague_dict = {}
        colleague._include_keywords_to_dict(colleague_dict)
        self.assertEqual(colleague_dict, {'keywords': [{'id': keyword.keyword_id, 'name': keyword.display_name}, {'id': keyword_2.keyword_id, 'name': keyword_2.display_name}]})

    def test_keywords_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Keyword).all()
        self.assertEqual(0, len(instances))

        keyword = factory.KeywordFactory()
        instances = DBSession.query(Keyword).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(keyword, instances[0])

    def test_keyword_model_to_dict(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Keyword).all()
        self.assertEqual(0, len(instances))

        keyword = factory.KeywordFactory()

        self.assertEqual(keyword.to_dict(), {'id': keyword.keyword_id, 'name': keyword.display_name})

    def test_edam_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Edam).all()
        self.assertEqual(0, len(instances))

        edam = factory.EdamFactory()
        instances = DBSession.query(Edam).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(edam, instances[0])

    def test_edam_model_to_dict(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Edam).all()
        self.assertEqual(0, len(instances))

        edam = factory.EdamFactory()

        self.assertEqual(edam.to_dict(), {'id': edam.edam_id, 'name': edam.format_name})

    def test_journal_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Journal).all()
        self.assertEqual(0, len(instances))

        journal = factory.JournalFactory()
        instances = DBSession.query(Journal).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(journal, instances[0])

    def test_book_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Book).all()
        self.assertEqual(0, len(instances))

        book = factory.BookFactory()
        instances = DBSession.query(Book).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(book, instances[0])
        
    def test_referencedbentity_model(self):
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()

        instances = DBSession.query(Dbentity).all()
        self.assertEqual(0, len(instances))
        
        instances = DBSession.query(Referencedbentity).all()
        self.assertEqual(0, len(instances))

        refdbentity = factory.ReferencedbentityFactory()
        
        instances = DBSession.query(Referencedbentity).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(refdbentity, instances[0])
        
        instances = DBSession.query(Referencedbentity).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(refdbentity, instances[0])

    def test_filekeyword_model(self):
        source = factory.SourceFactory()
        filedbentity = factory.FiledbentityFactory()
        filepath = factory.FilepathFactory()
        edam = factory.EdamFactory()
        keyword = factory.KeywordFactory()
        
        instances = DBSession.query(FileKeyword).all()
        self.assertEqual(0, len(instances))

        fkeyword = factory.FileKeywordFactory()
        instances = DBSession.query(FileKeyword).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(fkeyword, instances[0])

    def test_filepath_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Filepath).all()
        self.assertEqual(0, len(instances))

        filepath = factory.FilepathFactory()
        instances = DBSession.query(Filepath).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(filepath, instances[0])

    def test_filedbentity_model(self):
        source = factory.SourceFactory()
        filepath = factory.FilepathFactory()
        edam = factory.EdamFactory()

        instances = DBSession.query(Dbentity).all()
        self.assertEqual(0, len(instances))
        
        instances = DBSession.query(Filedbentity).all()
        self.assertEqual(0, len(instances))

        refdbentity = factory.FiledbentityFactory()
        
        instances = DBSession.query(Filedbentity).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(refdbentity, instances[0])
        
        instances = DBSession.query(Filedbentity).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(refdbentity, instances[0])

    def test_reference_document_model(self):
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()

        instances = DBSession.query(Referencedocument).all()
        self.assertEqual(0, len(instances))

        refdoc = factory.ReferenceDocumentFactory()
        
        instances = DBSession.query(Referencedocument).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(refdoc, instances[0])

    def test_chebi_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Chebi).all()
        self.assertEqual(0, len(instances))

        chebi = factory.ChebiFactory()
        instances = DBSession.query(Chebi).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(chebi, instances[0])

    def test_chebiurl_model(self):
        source = factory.SourceFactory()
        chebi = factory.ChebiFactory()
        instances = DBSession.query(ChebiUrl).all()
        self.assertEqual(0, len(instances))

        chebiurl = factory.ChebiUrlFactory()
        instances = DBSession.query(ChebiUrl).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(chebiurl, instances[0])

    def test_phenotypeannotation_model(self):
        source = factory.SourceFactory()
        reporter = factory.ReporterFactory()
        obi = factory.ObiFactory()
        apo = factory.ApoFactory()
        allele = factory.AlleleFactory()
        pheno = factory.PhenotypeFactory()
        locus = factory.LocusdbentityFactory()
        taxonomy = factory.TaxonomyFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory(dbentity_id=2, sgdid="S1")
        instances = DBSession.query(Phenotypeannotation).all()
        self.assertEqual(0, len(instances))

        pa = factory.PhenotypeannotationFactory(reference_id=2)
        instances = DBSession.query(Phenotypeannotation).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(pa, instances[0])
        
    def test_phenotypeannotationcond_model(self):
        source = factory.SourceFactory()
        reporter = factory.ReporterFactory()
        obi = factory.ObiFactory()
        apo = factory.ApoFactory()
        allele = factory.AlleleFactory()
        pheno = factory.PhenotypeFactory()
        locus = factory.LocusdbentityFactory()
        taxonomy = factory.TaxonomyFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory(dbentity_id=2, sgdid="S1")
        pa = factory.PhenotypeannotationFactory(reference_id=2)
        instances = DBSession.query(PhenotypeannotationCond).all()
        self.assertEqual(0, len(instances))

        pac = factory.PhenotypeannotationCondFactory()
        instances = DBSession.query(PhenotypeannotationCond).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(pac, instances[0])

    def test_locusdbentity_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Locusdbentity).all()
        self.assertEqual(0, len(instances))

        locus = factory.LocusdbentityFactory()
        instances = DBSession.query(Locusdbentity).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(locus, instances[0])

    def test_taxonomy_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Taxonomy).all()
        self.assertEqual(0, len(instances))

        taxonomy = factory.TaxonomyFactory()
        instances = DBSession.query(Taxonomy).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(taxonomy, instances[0])

    def test_phenotype_model(self):
        source = factory.SourceFactory()
        apo = factory.ApoFactory()
        instances = DBSession.query(Phenotype).all()
        self.assertEqual(0, len(instances))

        pheno = factory.PhenotypeFactory()
        instances = DBSession.query(Phenotype).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(pheno, instances[0])

    def test_apo_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Apo).all()
        self.assertEqual(0, len(instances))

        apo = factory.ApoFactory()
        instances = DBSession.query(Apo).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(apo, instances[0])

    def test_apo_model_to_dict(self):
        source = factory.SourceFactory()
        apo = factory.ApoFactory()
        instances = DBSession.query(Apo).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(apo, instances[0])
        pass

    def test_allele_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Allele).all()
        self.assertEqual(0, len(instances))

        allele = factory.AlleleFactory()
        instances = DBSession.query(Allele).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(allele, instances[0])

    def test_reporter_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Reporter).all()
        self.assertEqual(0, len(instances))

        reporter = factory.ReporterFactory()
        instances = DBSession.query(Reporter).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(reporter, instances[0])

    def test_obi_model(self):
        source = factory.SourceFactory()
        instances = DBSession.query(Obi).all()
        self.assertEqual(0, len(instances))

        obi = factory.ObiFactory()
        instances = DBSession.query(Obi).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(obi, instances[0])

    def test_reservedname_model(self):
        source = factory.SourceFactory()
        locus = factory.LocusdbentityFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        reference = factory.ReferencedbentityFactory(dbentity_id=2, sgdid='S99999')
        colleague = factory.ColleagueFactory()

        instances = DBSession.query(Reservedname).all()
        self.assertEqual(0, len(instances))

        rname = factory.ReservedNameFactory(reference_id=2)

        instances = DBSession.query(Reservedname).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(rname, instances[0])


    def test_reservedname_model_no_locus(self):
             source = factory.SourceFactory()
             locus = factory.LocusdbentityFactory()
             journal = factory.JournalFactory()
             book = factory.BookFactory()
             colleague = factory.ColleagueFactory()
             reference = factory.ReferencedbentityFactory(dbentity_id=2, sgdid='S99999')

             rname = factory.ReservedNameFactory(locus_id=None, reference_id=2)
             instances = DBSession.query(Reservedname).all()

             self.assertNotIn('locus_id', rname.to_dict().keys())

    def test_reservedname_model_no_reference(self):
        source = factory.SourceFactory()
        locus = factory.LocusdbentityFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        colleague = factory.ColleagueFactory()
        reference = factory.ReferencedbentityFactory(dbentity_id=2, sgdid='S99999')

        rname = factory.ReservedNameFactory(reference_id=None)
        instances = DBSession.query(Reservedname).all()

        self.assertNotIn('reference_id', rname.to_dict().keys())


    def test_strain_model(self):
        source = factory.SourceFactory()
        locus = factory.LocusdbentityFactory(dbentity_id=2)
        taxonomy = factory.TaxonomyFactory()

        instances = DBSession.query(Straindbentity).all()
        self.assertEqual(0, len(instances))

        strain = factory.StraindbentityFactory()
        instances = DBSession.query(Straindbentity).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(strain, instances[0])

    def test_strainurl_model(self):
        source = factory.SourceFactory()
        taxonomy = factory.TaxonomyFactory()
        strain = factory.StraindbentityFactory()

        instances = DBSession.query(StrainUrl).all()
        self.assertEqual(0, len(instances))

        strainurl = factory.StrainUrlFactory()
        instances = DBSession.query(StrainUrl).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(strainurl, instances[0])

    def test_strainsummary_model(self):
        source = factory.SourceFactory()
        taxonomy = factory.TaxonomyFactory()
        strain = factory.StraindbentityFactory()

        instances = DBSession.query(Strainsummary).all()
        self.assertEqual(0, len(instances))

        strainsummary = factory.StrainsummaryFactory()
        instances = DBSession.query(Strainsummary).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(strainsummary, instances[0])

    def test_strainsummary_reference_model(self):
        source = factory.SourceFactory()
        taxonomy = factory.TaxonomyFactory()
        strain = factory.StraindbentityFactory()
        strainsummary = factory.StrainsummaryFactory()

        journal = factory.JournalFactory()
        book = factory.BookFactory()
        reference = factory.ReferencedbentityFactory(dbentity_id=2, sgdid='S99999')

        instances = DBSession.query(StrainsummaryReference).all()
        self.assertEqual(0, len(instances))

        strainsummary_reference = factory.StrainsummaryReferenceFactory()
        instances = DBSession.query(StrainsummaryReference).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(strainsummary_reference, instances[0])