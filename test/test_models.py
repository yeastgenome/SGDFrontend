import unittest
from sqlalchemy import create_engine, Column, String
from src.models import DBSession, Base, Source, Colleague, ColleagueUrl, ColleagueAssociation, ColleagueKeyword, Keyword, Dbuser, Edam, Dbentity, Referencedbentity, Journal, Book, FileKeyword, Filedbentity, Filepath, ReferenceDocument, Chebi, ChebiUrl
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

    def test_colleague_model_search_results_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        self.assertEqual(colleague.to_search_results_dict(), {
            'format_name': colleague.format_name,
            'first_name': colleague.first_name,
            'last_name': colleague.last_name,
            'organization': colleague.institution,
            'work_phone': colleague.work_phone,
            'email': colleague.email,
            'fax': colleague.fax
        })

    def test_colleague_model_search_result_dict_with_urls(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        
        colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
        colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")

        instances = DBSession.query(Colleague).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        
        self.assertEqual(colleague.to_search_results_dict(), {
            'format_name': colleague.format_name,
            'first_name': colleague.first_name,
            'last_name': colleague.last_name,
            'organization': colleague.institution,
            'work_phone': colleague.work_phone,
            'fax': colleague.fax,
            'email': colleague.email,
            'webpages': {
                'lab_url': colleague_url_2.obj_url,
                'research_summary_url': colleague_url_1.obj_url
            }
        })

    def test_colleague_model_search_results_doesnt_send_email_if_required(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory(display_email=0)
        instances = DBSession.query(Colleague).all()
        self.assertEqual(1, len(instances))
        self.assertEqual(colleague, instances[0])
        self.assertNotIn('email', colleague.to_search_results_dict())

    def test_colleague_model_info_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
        colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")

        colleague_2 = factory.ColleagueFactory(colleague_id=113699)
        factory.ColleagueAssociationFactory(colleague_id=colleague.colleague_id, associate_id=colleague_2.colleague_id, association_type="Lab member")
        factory.ColleagueAssociationFactory(colleague_id=colleague.colleague_id, associate_id=colleague_2.colleague_id, association_type="Associate")

        keyword = factory.KeywordFactory()
        factory.ColleagueKeywordFactory(colleague_id=colleague.colleague_id, keyword_id=keyword.keyword_id)
        keyword_2 = factory.KeywordFactory(keyword_id=2, format_name="format_name")
        factory.ColleagueKeywordFactory(colleague_id=colleague.colleague_id, keyword_id=keyword_2.keyword_id)

        self.assertEqual(colleague.to_info_dict(), {
            'orcid': colleague.orcid,
            'first_name': colleague.first_name,
            'last_name': colleague.last_name,
            'email': colleague.email,
            'position': colleague.job_title,
            'profession': colleague.profession,
            'organization': colleague.institution,
            'address': [colleague.address1],
            'city': colleague.city,
            'state': colleague.state,
            'country': colleague.country,
            'postal_code': colleague.postal_code,
            'work_phone': colleague.work_phone,
            'fax': colleague.fax,
            'webpages': {
                'lab_url': colleague_url_2.obj_url,
                'research_summary_url': colleague_url_1.obj_url
            },
            'associations': {
                'Lab member': [(colleague_2.first_name, colleague_2.last_name, colleague_2.format_name)],
                'Associate': [(colleague_2.first_name, colleague_2.last_name, colleague_2.format_name)]
            },
            'keywords': [keyword.display_name, keyword_2.display_name],
            'research_interests': colleague.research_interest,
            'last_update': str(colleague.date_last_modified)
        })

    def test_colleague_model_info_dict_doesnt_send_email_if_required(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory(display_email = 0)
        instances = DBSession.query(Colleague).all()
        colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
        colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")
        self.assertEqual(colleague.to_info_dict(), {
            'orcid': colleague.orcid,
            'first_name': colleague.first_name,
            'last_name': colleague.last_name,
            'position': colleague.job_title,
            'profession': colleague.profession,
            'organization': colleague.institution,
            'address': [colleague.address1],
            'city': colleague.city,
            'state': colleague.state,
            'country': colleague.country,
            'postal_code': colleague.postal_code,
            'work_phone': colleague.work_phone,
            'fax': colleague.fax,
            'webpages': {
                'lab_url': colleague_url_2.obj_url,
                'research_summary_url': colleague_url_1.obj_url
            },
            'research_interests': colleague.research_interest,
            'last_update': str(colleague.date_last_modified)
        })

    def test_colleague_model_should_include_urls_in_dict(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        instances = DBSession.query(Colleague).all()
        colleague_url_1 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id)
        colleague_url_2 = factory.ColleagueUrlFactory(colleague_id=colleague.colleague_id, url_type="Lab")

        colleague_dict = {}
        colleague._include_urls_to_dict(colleague_dict)
        self.assertEqual(colleague_dict, {'webpages': {'lab_url': colleague_url_2.obj_url, 'research_summary_url': colleague_url_1.obj_url}})

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
        self.assertEqual(colleague.urls, [colleague_url_1, colleague_url_2])

    def test_colleague_association_model(self):
        source = factory.SourceFactory()
        colleague = factory.ColleagueFactory()
        colleague = factory.ColleagueFactory(colleague_id=113699)
        
        instances = DBSession.query(ColleagueAssociation).all()
        self.assertEqual(0, len(instances))

        association = factory.ColleagueAssociationFactory()
        instances = DBSession.query(ColleagueAssociation).all()

        self.assertEqual(1, len(instances))
        self.assertEqual(association, instances[0])
        
    def test_colleague_model_should_include_associates_in_dict(self):
        source = factory.SourceFactory()

        colleague_1 = factory.ColleagueFactory()
        colleague_2 = factory.ColleagueFactory(colleague_id=113699)

        association_1_2 = factory.ColleagueAssociationFactory(colleague_id=colleague_1.colleague_id, associate_id=colleague_2.colleague_id, association_type="Lab member")

        association_2_1 = factory.ColleagueAssociationFactory(colleague_id=colleague_2.colleague_id, associate_id=colleague_1.colleague_id, association_type="Head of the lab")

        colleague_dict = {}
        colleague_1._include_associates_to_dict(colleague_dict)
        self.assertEqual(colleague_dict, {'associations': {'Lab member': [(colleague_2.first_name, colleague_2.last_name, colleague_2.format_name)]}})

        colleague_dict = {}
        colleague_2._include_associates_to_dict(colleague_dict)
        self.assertEqual(colleague_dict, {'associations': {'Head of the lab': [(colleague_1.first_name, colleague_1.last_name, colleague_1.format_name)]}})

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
        self.assertEqual(colleague_dict, {'keywords': [keyword.display_name]})

        keyword_2 = factory.KeywordFactory(keyword_id=2)
        factory.ColleagueKeywordFactory(colleague_id=colleague.colleague_id, keyword_id=keyword_2.keyword_id)
        colleague_dict = {}
        colleague._include_keywords_to_dict(colleague_dict)
        self.assertEqual(colleague_dict, {'keywords': [keyword.display_name, keyword_2.display_name]})

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
        
        instances = DBSession.query(Dbentity).all()
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
        
        instances = DBSession.query(Dbentity).all()
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

        instances = DBSession.query(ReferenceDocument).all()
        self.assertEqual(0, len(instances))

        refdoc = factory.ReferenceDocumentFactory()
        
        instances = DBSession.query(ReferenceDocument).all()

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
