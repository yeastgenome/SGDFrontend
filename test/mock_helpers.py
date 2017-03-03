import fixtures as factory

class MockQueryFilter(object):
    def __init__(self, query_params, query_result):
        self._return = query_result
        self._params = query_params

    def one_or_none(self):
        return self._return

    def first(self):
        return self._return

    def order_by(self, *args, **kwargs):
        return self

    def all(self):
        if self._return is None:
            return []
        elif self._return.__class__ == list:
            return self._return
        else:
            return [self._return]

    def query_params(self):
        return self._params
    

class MockQuery(object):
    def __init__(self, query_result):
        self._query_result = query_result

    def filter_by(self, **query_params):
        self._query_filter = MockQueryFilter(query_params, self._query_result)
        self._full_params = query_params
        return self._query_filter

    def filter(self, *query_params):
        self._query_filter = MockQueryFilter(query_params[0], self._query_result)
        self._full_params = query_params
        return self._query_filter

    def all(self):
        return self._query_result


class MockFileStorage(object):
    pass


def side_effect(*args, **kwargs):
    #import pdb;
    #pdb.set_trace()
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    if len(args) == 3 and str(args[0]) == 'StrainUrl.display_name' and str(args[1]) == 'StrainUrl.url_type' and str(
            args[2]) == 'StrainUrl.obj_url':
        strain_url = factory.StrainUrlFactory()
        return MockQuery((strain_url.display_name, strain_url.url_type, strain_url.obj_url))
    elif len(args) == 2 and str(args[0]) == 'Strainsummary.summary_id' and str(args[1]) == 'Strainsummary.html':
        strain_summary = factory.StrainsummaryFactory()
        return MockQuery((strain_summary.summary_id, strain_summary.html))
    elif len(args) == 1 and str(args[0]) == 'StrainsummaryReference.reference_id':
        strain_ref = factory.StrainsummaryReferenceFactory()
        return MockQuery([(strain_ref.reference_id,)])
    elif len(args) == 1 and str(args[0]) == 'ReferenceUrl.reference_id':
        refurl = factory.ReferenceUrlFactory()
        return MockQuery(refurl.obj_url)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        return MockQuery(refdbentity)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceUrl'>":
        refurl = factory.ReferenceUrlFactory()
        return MockQuery(refurl)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Contig'>":
        c_name = factory.ContigFactory()
        return MockQuery(c_name)
    elif len(args) == 2 and str(args[0]) == 'Contig.format_name' and str(args[1]) == 'Contig.obj_url':
        c_name = factory.ContigFactory()
        return MockQuery((c_name.format_name, c_name.obj_url))


def reference_side_effect(*args, **kwargs):
            #import pdb;
            #pdb.set_trace()
            if len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdbentity = factory.ReferencedbentityFactory()
                refdbentity.journal = journal
                return MockQuery(refdbentity)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetReference'>":
                datasetref = factory.DatasetReferenceFactory()
                return MockQuery(datasetref)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dataset'>":
                dataset = factory.DatasetFactory()
                return MockQuery(dataset)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetKeyword'>":
                datasetkw = factory.DatasetKeywordFactory()
                return MockQuery(datasetkw)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceDocument'>":
                refdoc = factory.ReferencedocumentFactory()
                return MockQuery(refdoc.text)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceUrl'>":
                refurl = factory.ReferenceUrlFactory()
                return MockQuery(refurl)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Referencetype'>":
                reftype = factory.ReferencetypeFactory()
                return MockQuery((reftype.display_name))
            elif len(args) == 2 and str(args[0]) == 'Referenceauthor.display_name' and str(args[1]) == 'Referenceauthor.obj_url':
                refauthor = factory.ReferenceauthorFactory()
                return MockQuery((refauthor.display_name, refauthor.obj_url))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceRelation'>":
                refrel = factory.ReferenceRelationFactory()
                return MockQuery((refrel))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Physinteractionannotation'>":
                intannot = factory.PhysinteractionannotationFactory()
                return MockQuery((intannot))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Geninteractionannotation'>":
                genannot = factory.GeninteractionannotationFactory()
                return MockQuery((genannot))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Goannotation'>":
                goannot = factory.GOannotationFactory()
                return MockQuery((goannot))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
                phenoannot = factory.PhenotypeannotationFactory()
                return MockQuery((phenoannot))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Regulationannotation'>":
                regannot = factory.RegulationAnnotationFactory()
                return MockQuery((regannot))