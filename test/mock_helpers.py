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

    def group_by(self, *args, **kwargs):
        return self

    def asc(self, *args, **kwargs):
        return self

    def all(self):
        if self._return is None:
            return []
        elif self._return.__class__ == list:
            return self._return
        else:
            return [self._return]

    def count(self):
        return 7

    def query_params(self):
        return self._params

    def distinct(self, *args, **kwargs):
        return self
    

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

    def distinct(self, query_params):
        return self


class MockFileStorage(object):
    pass


def go_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Go'>":
        go = factory.GoFactory()
        return MockQuery(go)
    if len(args) == 2 and str(args[0]) == 'Goannotation.dbentity_id' and str(args[1]) == 'count(nex.goannotation.dbentity_id)':
        go = factory.GoFactory()
        goannot = factory.GoannotationFactory()
        goannot.go = go
        return MockQuery(goannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.GoRelation'>":
        gochild = factory.GoFactory()
        goparent = factory.GoFactory()
        gorel = factory.GoRelationFactory()
        ro = factory.RoFactory()
        gorel.child = gochild
        gorel.parent = goparent
        gorel.ro = ro
        return MockQuery(gorel)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.GoUrl'>":
        gourl = factory.GoUrlFactory()
        return MockQuery(gourl)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.GoAlias'>":
        goalias = factory.GoAliasFactory()
        return MockQuery(goalias)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Locusdbentity'>":
        locus = factory.LocusdbentityFactory()
        return MockQuery(locus)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Goannotation'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        dbent = factory.DbentityFactory()
        go = factory.GoFactory()
        goannot = factory.GoannotationFactory()
        goannot.go = go
        goannot.dbentity = dbent
        goannot.reference = refdbentity
        goannot.source = source
        return MockQuery(goannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.EcoAlias'>":
        ecoalias = factory.EcoAliasFactory()
        return MockQuery(ecoalias)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.EcoUrl'>":
        ecourl = factory.EcoUrlFactory()
        return MockQuery(ecourl)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Goextension'>":
        ro = factory.RoFactory()
        goext = factory.GoextensionFactory()
        goext.ro = ro
        return MockQuery(goext)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dbentity'>":
        dbent = factory.DbentityFactory()
        return MockQuery(dbent)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Chebi'>":
        chebi = factory.ChebiFactory()
        return MockQuery(chebi)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Gosupportingevidence'>":
        goevd = factory.GosupportingevidenceFactory()
        return MockQuery(goevd)

def locus_expression_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Locusdbentity'>":
        locus = factory.LocusdbentityFactory()
        return MockQuery(locus)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Expressionannotation'>":
        expannot = factory.ExpressionannotationFactory()
        return MockQuery(expannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dataset'>":
        dataset = factory.DatasetFactory()
        return MockQuery(dataset)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        return MockQuery(refdbentity)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetKeyword'>":
        dskw = factory.DatasetKeywordFactory()
        return MockQuery(dskw)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetReference'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        dsref = factory.DatasetReferenceFactory()
        dsref.reference = refdbentity
        ds = factory.DatasetFactory()
        dsref.dataset = ds
        return MockQuery((dsref,))
    elif len(args) == 1 and str(args[0]) == 'Referencedocument.html':
        refdoc = factory.ReferencedocumentFactory()
        return MockQuery(refdoc.html)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Datasetsample'>":
        dss = factory.DatasetsampleFactory()
        return MockQuery(dss)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetUrl'>":
        dsurl = factory.DatasetUrlFactory()
        return MockQuery(dsurl)

def locus_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Locusdbentity'>":
        locus = factory.LocusdbentityFactory()
        return MockQuery(locus)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Bindingmotifannotation'>":
        bind = factory.BindingmotifannotationFactory()
        return MockQuery(bind)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Go'>":
        go = factory.GoFactory()
        return MockQuery(go)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        mut = factory.ApoFactory()
        exp = factory.ApoFactory()
        pheno = factory.PhenotypeFactory()
        db = factory.DbentityFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.mutant = mut
        phenoannot.experiment = exp
        phenoannot.phenotype = pheno
        phenoannot.dbentity = db
        phenoannot.reference = refdbentity
        return MockQuery(phenoannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Apo'>":
        apo = factory.ApoFactory()
        return MockQuery(apo)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.PhenotypeannotationCond'>":
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery(phenocond)
    elif len(args) == 2 and str(args[0]) == 'Chebi.display_name' and str(args[1]) == 'Chebi.obj_url':
        chebi = factory.ChebiFactory()
        return MockQuery((chebi.display_name, chebi.obj_url))
    elif len(args) == 2 and str(args[0]) == 'Dbentity.display_name' and str(args[1]) == 'Dbentity.format_name':
        db = factory.DbentityFactory()
        return MockQuery(db.format_name)
    elif len(args) == 1 and str(args[0]) == 'Proteinsequenceannotation.annotation_id':
        prtseq = factory.ProteinsequenceannotationFactory()
        return MockQuery((prtseq.annotation_id,))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Proteinsequenceannotation'>":
        prtseq = factory.ProteinsequenceannotationFactory()
        return MockQuery(prtseq)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ProteinsequenceDetail'>":
        prtseq = factory.ProteinsequenceannotationFactory()
        prtseqdetail = factory.ProteinsequenceDetailFactory()
        prtseqdetail.annotation = prtseq
        return MockQuery(prtseqdetail)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Goslimannotation'>":
        goslimannot = factory.GoslimannotationFactory()
        goslim = factory.GoslimFactory()
        goslimannot.goslim = goslim
        return MockQuery(goslimannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Goannotation'>":
        go = factory.GoFactory()
        goannot = factory.GoannotationFactory()
        goannot.go = go
        return MockQuery(goannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.EcoAlias'>":
        ecoalias = factory.EcoAliasFactory()
        return MockQuery(ecoalias)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.EcoUrl'>":
        ecourl = factory.EcoUrlFactory()
        return MockQuery(ecourl)
    elif len(args) == 1 and str(args[0]) == 'Locussummary.html':
        ls = factory.LocussummaryFactory()
        return MockQuery(ls.html)
    elif len(args) == 2 and str(args[0]) == 'Phenotypeannotation.taxonomy_id' and str(
            args[1]) == 'count(nex.phenotypeannotation.taxonomy_id)':
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.phenotype = pheno
        return MockQuery((phenoannot.taxonomy_id, 20))
    elif len(args) == 2 and str(args[0]) == 'Phenotypeannotation.taxonomy_id' and str(
            args[1]) == 'Phenotypeannotation.annotation_id':
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.phenotype = pheno
        return MockQuery(phenoannot)
    elif len(args) == 2 and str(args[0]) == 'PhenotypeannotationCond.annotation_id' and str(args[1]) == 'count(DISTINCT nex.phenotypeannotation_cond.group_id)':
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery((phenocond.annotation_id, 20))
    elif len(args) == 2 and str(args[0]) == 'PhenotypeannotationCond.annotation_id' and str(args[1]) == ' func.count(distinct(PhenotypeannotationCond.group_id))':
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery((phenocond.annotation_id, 20))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        mut = factory.ApoFactory()
        exp = factory.ApoFactory()
        pheno = factory.PhenotypeFactory()
        db = factory.DbentityFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.mutant = mut
        phenoannot.experiment = exp
        phenoannot.phenotype = pheno
        phenoannot.dbentity = db
        phenoannot.reference = refdbentity
        return MockQuery(phenoannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.PhenotypeannotationCond'>":
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery(phenocond)
    elif len(args) == 2 and str(args[0]) == 'Chebi.display_name' and str(args[1]) == 'Chebi.obj_url':
        chebi = factory.ChebiFactory()
        return MockQuery((chebi.display_name, chebi.obj_url))
    elif len(args) == 2 and str(args[0]) == 'Goannotation.dbentity_id' and str(
            args[1]) == 'count(nex.goannotation.dbentity_id)':
        goannot = factory.GoannotationFactory()
        return MockQuery(goannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Apo'>":
        apo = factory.ApoFactory()
        return MockQuery(apo)
    elif len(args) == 2 and str(args[0]) == 'Physinteractionannotation.biogrid_experimental_system' and str(args[1]) == 'count(nex.physinteractionannotation.annotation_id)':
        physannot = factory.PhysinteractionannotationFactory()
        return MockQuery((physannot.biogrid_experimental_system, 20))
    elif len(args) == 2 and str(args[0]) == 'Geninteractionannotation.biogrid_experimental_system' and str(args[1]) == 'count(nex.geninteractionannotation.annotation_id)':
        genannot = factory.GeninteractionannotationFactory()
        return MockQuery((genannot.biogrid_experimental_system, 20))
    elif len(args) == 1 and str(args[0]) == 'Physinteractionannotation.dbentity2_id':
        physannot = factory.PhysinteractionannotationFactory()
        return MockQuery(physannot.dbentity2_id)
    elif len(args) == 1 and str(args[0]) == 'Physinteractionannotation.dbentity1_id':
        physannot = factory.PhysinteractionannotationFactory()
        return MockQuery(physannot.dbentity1_id)
    elif len(args) == 1 and str(args[0]) == 'Geninteractionannotation.dbentity2_id':
        genannot = factory.GeninteractionannotationFactory()
        return MockQuery(genannot.dbentity2_id)
    elif len(args) == 1 and str(args[0]) == 'Geninteractionannotation.dbentity1_id':
        genannot = factory.GeninteractionannotationFactory()
        return MockQuery(genannot.dbentity1_id)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Regulationannotation'>":
        regannot = factory.RegulationannotationFactory()
        eco = factory.EcoFactory()
        go = factory.GoFactory()
        reference = factory.ReferencedbentityFactory()
        regulator = factory.DbentityFactory()
        source = factory.SourceFactory()
        target = factory.DbentityFactory()
        taxonomy = factory.TaxonomyFactory()
        regannot.eco = eco
        regannot.go = go
        regannot.reference = reference
        regannot.regulator = regulator
        regannot.source = source
        regannot.target = target
        regannot.taxonomy = taxonomy
        return MockQuery(regannot)
    elif len(args) == 2 and str(args[0]) == 'Regulationannotation.target_id' and str(args[1]) == 'Regulationannotation.regulator_id':
        regannot = factory.RegulationannotationFactory()
        return MockQuery((regannot.target_id, regannot.regulator_id))
    elif len(args) == 2 and str(args[0]) == 'Literatureannotation.topic' and str(args[1]) == 'count(nex.literatureannotation.annotation_id)':
        litannot = factory.LiteratureannotationFactory()
        return MockQuery((litannot.topic, 20))
    elif len(args) == 1 and str(args[0]) == 'Literatureannotation.reference_id':
        litannot = factory.LiteratureannotationFactory()
        return MockQuery(litannot.reference_id)
    elif len(args) == 1 and str(args[0]) == 'Geninteractionannotation.reference_id':
        genannot = factory.GeninteractionannotationFactory()
        return MockQuery(genannot.reference_id)
    elif len(args) == 1 and str(args[0]) == 'Physinteractionannotation.reference_id':
        physannot = factory.PhysinteractionannotationFactory()
        return MockQuery(physannot.reference_id)
    elif len(args) == 1 and str(args[0]) == 'Regulationannotation.reference_id':
        regannot = factory.RegulationannotationFactory()
        return MockQuery(regannot.reference_id)
    elif len(args) == 1 and str(args[0]) == 'Regulationannotation.target_id':
        regannot = factory.RegulationannotationFactory()
        return MockQuery(regannot.target_id)
    elif len(args) == 1 and str(args[0]) == 'Literatureannotation.reference_id':
        litannot = factory.LiteratureannotationFactory()
        return MockQuery(litannot.reference_id)
    elif len(args) == 1 and str(args[0]) == 'Phenotypeannotation.reference_id':
        phenannot = factory.PhenotypeannotationFactory()
        return MockQuery(phenannot.reference_id)
    elif len(args) == 1 and str(args[0]) == 'Goannotation.reference_id':
        goannot = factory.GoannotationFactory()
        return MockQuery(goannot.reference_id)
    elif len(args) == 1 and str(args[0]) == 'ReferenceAlias.reference_id':
        refalias = factory.ReferenceAliasFactory()
        return MockQuery(refalias.reference_id)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocusAlias'>":
        localias = factory.LocusAliasFactory()
        source = factory.SourceFactory()
        localias.source = source
        return MockQuery(localias)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocusAliasReferences'>":
        localiasref = factory.LocusAliasReferencesFactory()
        source = factory.SourceFactory()
        ref = factory.ReferencedbentityFactory()
        localiasref.reference = ref
        localiasref.source = source
        return MockQuery(localiasref)
    elif len(args) == 1 and str(args[0]) == 'Apo.apo_id':
        apo = factory.ApoFactory()
        return MockQuery(apo.apo_id)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceUrl'>":
        refurl = factory.ReferenceUrlFactory()
        return MockQuery(refurl)
    elif len(args) == 1 and str(args[0]) == 'Dnasequenceannotation.so_id':
        dnaseq = factory.DnasequenceannotationFactory()
        return MockQuery((dnaseq.so_id,))
    elif len(args) == 1 and str(args[0]) == 'So.display_name':
        so = factory.SoFactory()
        return MockQuery(so.display_name)
    elif len(args) == 3 and str(args[0]) == 'Locussummary.summary_id' and str(args[1]) == 'Locussummary.html' and str(args[2]) == 'Locussummary.date_created':
        ls = factory.LocussummaryFactory()
        return MockQuery((ls.summary_id, ls.html, ls.date_created))
    elif len(args) == 5 and str(args[0]) == 'Locussummary.summary_id' \
        and str(args[1]) == 'Locussummary.html' and str(args[2]) == 'Locussummary.date_created' \
        and str(args[3]) == 'Locussummary.summary_order' and str(args[4]) == 'Locussummary.summary_type':
        ls = factory.LocussummaryFactory()
        return MockQuery((ls.summary_id, ls.html, ls.date_created, ls.summary_order, ls.summary_type))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocusReferences'>":
        lref = factory.LocusReferencesFactory()
        ref = factory.ReferencedbentityFactory()
        lref.reference = ref
        return MockQuery(lref)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocusRelation'>":
        lrel = factory.LocusRelationFactory()
        parent = factory.LocusdbentityFactory()
        child = factory.LocusdbentityFactory()
        source = factory.SourceFactory()
        ro = factory.RoFactory()
        lrel.parent = parent
        lrel.child = child
        lrel.source = source
        lrel.ro = ro
        return MockQuery(lrel)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocusRelationReference'>":
        lrel_ref = factory.LocusRelationReferenceFactory()
        ref = factory.ReferencedbentityFactory()
        lrel_ref.reference = ref
        return MockQuery(lrel_ref)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocussummaryReference'>":
        lsref = factory.LocussummaryReferenceFactory()
        ref = factory.ReferencedbentityFactory()
        source = factory.SourceFactory()
        summary = factory.LocussummaryFactory()
        lsref.source = source
        lsref.reference = ref
        lsref.summary = summary
        return MockQuery(lsref)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Locusnote'>":
        lnote = factory.LocusnoteFactory()
        source = factory.SourceFactory()
        lnote.source = source
        return MockQuery(lnote)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocusnoteReference'>":
        lnote_ref = factory.LocusnoteFactory()
        note = factory.LocusnoteFactory()
        ref = factory.ReferencedbentityFactory()
        source = factory.SourceFactory()
        lnote_ref.note = note
        lnote_ref.reference = ref
        lnote_ref.source = source
        return MockQuery(lnote_ref)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.LocusUrl'>":
        lurl = factory.LocusUrlFactory()
        return MockQuery(lurl)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Locusnoteannotation'>":
        laf = factory.LocusnoteannotationFactory()
        return MockQuery(laf)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Pathwayannotation'>":
        paf = factory.PathwayannotationFactory()
        dbentity = factory.DbentityFactory()
        ec = factory.EcFactory()
        pathway = factory.PathwaydbentityFactory()
        ref = factory.ReferencedbentityFactory()
        src = factory.SourceFactory()
        tax = factory.TaxonomyFactory()
        paf.dbentity = dbentity
        paf.ec = ec
        paf.pathway = pathway
        paf.reference = ref
        paf.source = src
        paf.taxonomy = tax
        return MockQuery(paf)
    elif len(args) == 1 and str(args[0]) == 'PathwayUrl.obj_url':
        path_url = factory.PathwayUrlFactory()
        return MockQuery(path_url.obj_url)
    elif len(args) == 1 and str(args[0]) == 'Dbentity.display_name':
        dbentity = factory.DbentityFactory()
        return MockQuery(dbentity.display_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Reservedname'>":
        rname = factory.ReservednameFactory()
        return MockQuery(rname)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Posttranslationannotation'>":
        pta = factory.PosttranslationannotationFactory()
        source = factory.SourceFactory()
        psi = factory.PsimodFactory()
        pta.source = source
        pta.psimod = psi
        return MockQuery(pta)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
        refdb = factory.ReferencedbentityFactory()
        return MockQuery(refdb)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Proteinexptannotation'>":
        prt = factory.ProteinexptannotationFactory()
        return MockQuery(prt)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Proteindomainannotation'>":
        pda = factory.ProteindomainannotationFactory()
        pd = factory.ProteindomainFactory()
        source = factory.SourceFactory()
        db = factory.DbentityFactory()
        pd.source = source
        pda.proteindomain = pd
        pda.dbentity = db
        return MockQuery(pda)
    elif len(args) == 3 and str(args[0]) == 'Dbentity.display_name' and str(args[1]) == 'Dbentity.format_name' and str(args[2]) == 'Dbentity.obj_url':
        db = factory.DbentityFactory()
        return MockQuery((db.display_name, db.format_name, db.obj_url))
    elif len(args) == 4 and str(args[0]) == 'Dbentity.dbentity_id' and str(args[1]) == 'Dbentity.display_name' and str(args[2]) == 'Dbentity.format_name' and str(args[3]) == 'Dbentity.obj_url':
        db = factory.DbentityFactory()
        return MockQuery((db.dbentity_id, db.display_name, db.format_name, db.obj_url))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Proteindomain'>":
        pd = factory.ProteindomainFactory()
        source = factory.SourceFactory()
        pd.source = source
        return MockQuery(pd)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ProteindomainUrl'>":
        pdurl = factory.ProteindomainUrlFactory()
        pd = factory.ProteindomainFactory()
        source = factory.SourceFactory()
        pd.source = source
        return MockQuery(pdurl)
    elif len(args) == 1 and str(args[0]) == 'Proteindomainannotation.dbentity_id':
        pda = factory.ProteindomainannotationFactory()
        return MockQuery((pda.dbentity_id),)
        return MockQuery(db.format_name)
    elif len(args) == 1 and str(args[0]) == 'Dbentity.format_name':
        db = factory.DbentityFactory()
        return MockQuery((db.format_name,))
    else:
        print "the problem is the condition!!!!"
        print args[0]

def phenotype_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotype'>":
        obs = factory.ApoFactory()
        qual = factory.ApoFactory()
        pheno = factory.PhenotypeFactory()
        pheno.observable = obs
        pheno.qualifier = qual
        return MockQuery(pheno)
    elif len(args) == 2 and str(args[0]) == 'Phenotypeannotation.taxonomy_id' and str(args[1]) == 'count(nex.phenotypeannotation.taxonomy_id)':
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.phenotype = pheno
        return MockQuery((phenoannot.taxonomy_id, 20))
    elif len(args) == 2 and str(args[0]) == 'Phenotypeannotation.taxonomy_id' and str(args[1]) == 'Phenotypeannotation.annotation_id':
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.phenotype = pheno
        return MockQuery(phenoannot)
    elif len(args) == 2 and str(args[0]) == 'PhenotypeannotationCond.annotation_id' and str(args[1]) == 'count(DISTINCT nex.phenotypeannotation_cond.group_id)':
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery((phenocond.annotation_id, 20))
    elif len(args) == 2 and str(args[0]) == 'PhenotypeannotationCond.annotation_id' and str(args[1]) == ' func.count(distinct(PhenotypeannotationCond.group_id))':
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery((phenocond.annotation_id, 20))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        mut = factory.ApoFactory()
        exp = factory.ApoFactory()
        pheno = factory.PhenotypeFactory()
        db = factory.DbentityFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.mutant = mut
        phenoannot.experiment = exp
        phenoannot.phenotype = pheno
        phenoannot.dbentity = db
        phenoannot.reference = refdbentity
        return MockQuery(phenoannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.PhenotypeannotationCond'>":
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery(phenocond)
    elif len(args) == 2 and str(args[0]) == 'Chebi.display_name' and str(args[1]) == 'Chebi.obj_url':
        chebi = factory.ChebiFactory()
        return MockQuery((chebi.display_name, chebi.obj_url))
    elif len(args) == 2 and str(args[0]) == 'Goannotation.dbentity_id' and str(args[1]) == 'count(nex.goannotation.dbentity_id)':
        goannot = factory.GoannotationFactory()
        return MockQuery(goannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Apo'>":
        apo = factory.ApoFactory()
        return MockQuery(apo)

def observable_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Apo'>":
        apo = factory.ApoFactory()
        return MockQuery(apo)
    elif len(args) == 3 and str(args[0]) == 'Phenotype.obj_url' and str(args[1]) == 'Phenotype.qualifier_id' and str(args[2]) == 'Phenotype.phenotype_id':
        pheno = factory.PhenotypeFactory()
        return MockQuery((pheno.obj_url, pheno.qualifier_id, pheno.phenotype_id,))
    elif len(args) == 2 and str(args[0]) == 'Phenotypeannotation.dbentity_id' and str(args[1]) == 'count(nex.phenotypeannotation.dbentity_id)':
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.phenotype = pheno
        return MockQuery((phenoannot.dbentity_id, 20))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ApoRelation'>":
        parent = factory.ApoFactory()
        child = factory.ApoFactory()
        ro = factory.RoFactory()
        aporel = factory.ApoRelationFactory()
        aporel.parent = parent
        aporel.child = child
        aporel.ro = ro
        return MockQuery(aporel)
    elif len(args) == 1 and str(args[0]) == 'Phenotype.phenotype_id':
        pheno = factory.PhenotypeFactory()
        return MockQuery((pheno.phenotype_id,))
    elif len(args) == 1 and str(args[0]) == 'Apo.display_name':
        apo = factory.ApoFactory()
        return MockQuery(apo.display_name)
    elif len(args) == 2 and str(args[0]) == 'Phenotypeannotation.taxonomy_id' and str(args[1]) == 'count(nex.phenotypeannotation.taxonomy_id)':
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.phenotype = pheno
        return MockQuery((phenoannot.taxonomy_id, 20))
    elif len(args) == 2 and str(args[0]) == 'Phenotypeannotation.taxonomy_id' and str(args[1]) == 'Phenotypeannotation.annotation_id':
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.phenotype = pheno
        return MockQuery((phenoannot),)
    elif len(args) == 2 and str(args[0]) == 'PhenotypeannotationCond.annotation_id' and str(args[1]) == 'count(DISTINCT nex.phenotypeannotation_cond.group_id)':
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery((phenocond.annotation_id, 20))
    elif len(args) == 1 and str(args[0]) == 'Chebi.obj_url':
        chebi = factory.ChebiFactory()
        return MockQuery(chebi.obj_url)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        mut = factory.ApoFactory()
        exp = factory.ApoFactory()
        pheno = factory.PhenotypeFactory()
        db = factory.DbentityFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.mutant = mut
        phenoannot.experiment = exp
        phenoannot.phenotype = pheno
        phenoannot.dbentity = db
        phenoannot.reference = refdbentity
        return MockQuery(phenoannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotype'>":
        pheno = factory.PhenotypeFactory()
        return MockQuery(pheno)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.PhenotypeannotationCond'>":
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery(phenocond)
    elif len(args) == 2 and str(args[0]) == 'Chebi.display_name' and str(args[1]) == 'Chebi.obj_url':
        chebi = factory.ChebiFactory()
        return MockQuery((chebi.display_name, chebi.obj_url))
    elif len(args) == 2 and str(args[0]) == 'Goannotation.dbentity_id' and str(args[1]) == 'count(nex.goannotation.dbentity_id)':
        goannot = factory.GoannotationFactory()
        return MockQuery(goannot)
    else:
        print "the problem is the condition!!!!"
        print args[0]
        print args[1]

def chemical_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Chebi'>":
        chem = factory.ChebiFactory()
        return MockQuery(chem)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ChebiUrl'>":
        url = factory.ChebiUrlFactory()
        return MockQuery(url)
    elif len(args) == 1 and str(args[0]) == 'PhenotypeannotationCond.annotation_id':
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery([(phenocond.annotation_id,)])
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        db_entity = factory.DbentityFactory()
        pheno = factory.PhenotypeFactory()
        phenoannot = factory.Phenotypeannotation()
        phenoannot.phenotype = pheno
        phenoannot.dbentity = db_entity
        phenoannot.reference = refdbentity
        return MockQuery(phenoannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.PhenotypeannotationCond'>":
        phenocond = factory.PhenotypeannotationCondFactory()
        return MockQuery(phenocond)
    elif len(args) == 1 and str(args[0]) == 'Chebi.obj_url':
        chebi = factory.ChebiFactory()
        return MockQuery(chebi.obj_url)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Apo'>":
        apo = factory.ApoFactory()
        return MockQuery(apo)

def author_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Referenceauthor'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdb = factory.ReferencedbentityFactory()
        refauth = factory.ReferenceauthorFactory()
        refauth.reference = refdb
        return MockQuery(refauth)
    elif len(args) == 1 and str(args[0]) == 'Referencedocument.html':
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdb = factory.ReferencedbentityFactory()
        refdb.journal = journal
        refdoc = factory.ReferencedocumentFactory()
        return MockQuery(refdoc.html)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceUrl'>":
        refurl = factory.ReferenceUrlFactory()
        return MockQuery(refurl)
    elif len(args) == 1 and str(args[0]) == 'Referencetype.display_name':
        reftype = factory.ReferencetypeFactory()
        return MockQuery((reftype.display_name))

def keywords_side_effect(*args, **kwargs):
    
    if len(args) == 1 and str(args[0]) == 'DISTINCT nex.dataset_keyword.keyword_id':
        dskw = factory.DatasetKeywordFactory()
        kw = factory.KeywordFactory()
        dskw.keyword = kw
        return MockQuery((dskw.keyword_id))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetKeyword'>":
        dskw = factory.DatasetKeywordFactory()
        return MockQuery([dskw])
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dataset'>":
        ds = factory.DatasetFactory()
        return MockQuery([ds])
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Keyword'>":
        kw = factory.KeywordFactory()
        return MockQuery([kw])

def dataset_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Dataset'>":
        ds_name = factory.DatasetFactory()
        return MockQuery(ds_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetKeyword'>":
        dskw = factory.DatasetKeywordFactory()
        kw = factory.KeywordFactory()
        dskw.keyword = kw
        return MockQuery(dskw)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Keyword'>":
        kw = factory.KeywordFactory()
        return MockQuery(kw)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetReference'>":
        dsref = factory.DatasetReferenceFactory()
        return MockQuery((dsref),)
    elif len(args) == 1 and str(args[0]) == 'Referencedocument.html':
        refdoc = factory.ReferencedocumentFactory()
        return MockQuery(refdoc.html)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Datasetsample'>":
        dss = factory.DatasetsampleFactory()
        return MockQuery(dss)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetUrl'>":
        dsurl = factory.DatasetUrlFactory()
        return MockQuery(dsurl)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetFile'>":
        dsf = factory.DatasetFileFactory()
        f = factory.FiledbentityFactory()
        dsf.file = f
        return MockQuery(dsf)


def side_effect(*args, **kwargs):
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
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Ec'>":
        ec = factory.EcFactory()
        return MockQuery(ec)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.EcUrl'>":
        ecurl = factory.EcUrlFactory()
        return MockQuery(ecurl)

# def mock_extract_id_request(request, classname):
#      return 'S000203483'

def locus_reference_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Locusdbentity'>":
        locus = factory.LocusdbentityFactory()
        return MockQuery(locus)
    elif len(args) == 1 and str(args[0]) == "Literatureannotation.reference_id":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        litannot = factory.LiteratureannotationFactory()
        db = factory.DbentityFactory()
        litannot.reference = refdbentity
        litannot.dbentity = db
        return MockQuery((litannot.reference_id,))
    elif len(args) == 1 and str(args[0]) == "Geninteractionannotation.reference_id":
        gen = factory.GeninteractionannotationFactory()
        return MockQuery((gen.reference_id,))
    elif len(args) == 1 and str(args[0]) == "Physinteractionannotation.reference_id":
        gen = factory.PhysinteractionannotationFactory()
        return MockQuery((gen.reference_id,))
    elif len(args) == 1 and str(args[0]) == "Regulationannotation.reference_id":
        reg = factory.RegulationannotationFactory()
        return MockQuery((reg.reference_id,))
    elif len(args) == 1 and str(args[0]) == "Phenotypeannotation.reference_id":
        pheno = factory.PhenotypeannotationFactory()
        return MockQuery((pheno.reference_id,))
    elif len(args) == 1 and str(args[0]) == "Goannotation.reference_id":
        go = factory.GoannotationFactory()
        return MockQuery((go.reference_id,))
    elif len(args) == 1 and str(args[0]) == "ReferenceAlias.reference_id":
        refalias = factory.ReferenceAliasFactory()
        return MockQuery(refalias.reference_id)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        return MockQuery(refdbentity)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceUrl'>":
        refurl = factory.ReferenceUrlFactory()
        return MockQuery(refurl)
    elif len(args) == 1 and str(args[0]) == "Apo.apo_id":
        apo = factory.ApoFactory()
        return MockQuery(apo.apo_id)
    elif len(args) == 2 and str(args[0]) == "Phenotypeannotation.reference_id" and str(args[1]) == "Phenotypeannotation.experiment_id":
        phen = factory.PhenotypeannotationFactory()
        return MockQuery((phen.reference_id, phen.experiment_id))
    elif len(args) == 2 and str(args[0]) == "Literatureannotation.reference_id" and str(args[1]) == "Literatureannotation.topic":
        lit = factory.LiteratureannotationFactory()
        return MockQuery((lit.reference_id, lit.topic))
    else:
        print "the problem is the condition!!!!"
        print args[0]
        print args[1]


def protein_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Posttranslationannotation'>":
        pta = factory.PosttranslationannotationFactory()
        return MockQuery(pta)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
        refdb = factory.ReferencedbentityFactory()
        return MockQuery(refdb)

def sequence_side_effect(*args, **kwargs):
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Locusdbentity'>":
        locus = factory.LocusdbentityFactory()
        return MockQuery(locus)
    elif len(args) == 1 and str(args[0]) == 'Locusdbentity.dbentity_id':
        locus = factory.LocusdbentityFactory()
        return MockQuery((locus.dbentity_id,))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dnasequenceannotation'>":
        dnaseq = factory.DnasequenceannotationFactory()
        contig = factory.ContigFactory()
        locus = factory.LocusdbentityFactory()
        dnaseq.contig = contig
        dnaseq.dbentity = locus
        return MockQuery(dnaseq)
    elif len(args) == 1 and str(args[0]) == 'Dnasequenceannotation.so_id':
        dnaseq = factory.DnasequenceannotationFactory()
        return MockQuery([(dnaseq.so_id,)])
    elif len(args) == 1 and str(args[0]) == 'So.display_name':
        so = factory.SoFactory()
        return MockQuery(so.display_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Proteinsequenceannotation'>":
        prtseq = factory.ProteinsequenceannotationFactory()
        contig = factory.ContigFactory()
        prtseq.contig = contig
        return MockQuery(prtseq)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dnasubsequence'>":
        dnasubseq = factory.DnasubsequenceFactory()
        return MockQuery(dnasubseq)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Contig'>":
        c_name = factory.ContigFactory()
        return MockQuery(c_name)
    elif len(args) == 2 and str(args[0]) == 'Dnasequenceannotation.so_id' and str(args[1]) == 'count(nex.dnasequenceannotation.annotation_id)':
        dnaseq = factory.DnasequenceannotationFactory()
        return MockQuery((dnaseq.so_id, 20))
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.So'>":
        so = factory.SoFactory()
        return MockQuery(so)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ContigUrl'>":
        ctgurl = factory.ContigUrlFactory()
        return MockQuery(ctgurl)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.ProteinsequenceDetail'>":
        prtseq = factory.ProteinsequenceDetailFactory()
        return MockQuery(prtseq)


def reference_side_effect(*args, **kwargs):
            if len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdbentity = factory.ReferencedbentityFactory()
                refdbentity.journal = journal
                return MockQuery(refdbentity)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Locusdbentity'>":
                locus = factory.LocusdbentityFactory()
                return MockQuery(locus)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetReference'>":
                datasetref = factory.DatasetReferenceFactory()
                datasetf = factory.DatasetFactory()
                datasetref.dataset = datasetf
                return MockQuery(datasetref)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dataset'>":
                dataset = factory.DatasetFactory()
                return MockQuery(dataset)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.DatasetKeyword'>":
                datasetkw = factory.DatasetKeywordFactory()
                datasetkw.keyword = factory.KeywordFactory()
                return MockQuery(datasetkw)
            elif len(args) == 1 and str(args[0]) == 'Referencedocument.html':
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdb = factory.ReferencedbentityFactory()
                refdb.journal = journal
                refdoc = factory.ReferencedocumentFactory()
                return MockQuery(refdoc.html)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceUrl'>":
                refurl = factory.ReferenceUrlFactory()
                return MockQuery(refurl)
            elif len(args) == 1 and str(args[0]) == 'Referencetype.display_name':
                reftype = factory.ReferencetypeFactory()
                return MockQuery((reftype.display_name))
            elif len(args) == 2 and str(args[0]) == 'Referenceauthor.display_name' and str(args[1]) == 'Referenceauthor.obj_url':
                refauthor = factory.ReferenceauthorFactory()
                return MockQuery((refauthor.display_name, refauthor.obj_url))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceRelation'>":
                refrel = factory.ReferenceRelationFactory()
                refrel.child = factory.ReferencedbentityFactory()
                refrel.parent = factory.ReferencedbentityFactory()
                return MockQuery((refrel))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.ReferenceUrl'>":
                refurl = factory.ReferenceUrlFactory()
                return MockQuery(refurl)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Physinteractionannotation'>":
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdbentity = factory.ReferencedbentityFactory()
                refdbentity.journal = journal
                intannot = factory.PhysinteractionannotationFactory()
                intannot.reference = refdbentity
                intannot.source = source
                db1 = factory.DbentityFactory(dbentity_id=1)
                db2 = factory.DbentityFactory(dbentity_id=2)
                intannot.dbentity1 = db1
                intannot.dbentity2= db2
                return MockQuery((intannot))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Geninteractionannotation'>":
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdbentity = factory.ReferencedbentityFactory()
                refdbentity.journal = journal
                db1 = factory.DbentityFactory(dbentity_id=1)
                db2 = factory.DbentityFactory(dbentity_id=2)
                genannot = factory.GeninteractionannotationFactory()
                genannot.dbentity1 = db1
                genannot.dbentity2= db2
                genannot.reference = refdbentity
                genannot.source = source
                return MockQuery((genannot))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Goannotation'>":
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdbentity = factory.ReferencedbentityFactory()
                refdbentity.journal = journal
                ecof = factory.EcoFactory()
                go = factory.GoFactory()
                db = factory.DbentityFactory()
                goannot = factory.GoannotationFactory()
                goannot.reference = refdbentity
                goannot.dbentity = db
                goannot.eco = ecof
                goannot.go = go
                goannot.source = source
                return MockQuery(goannot)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.EcoAlias'>":
                # ecof = factory.EcoFactory()
                ecoalias = factory.EcoAliasFactory()
                # ecoalias.eco = ecof
                return MockQuery(ecoalias)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.EcoUrl'>":
                ecourl = factory.EcoUrlFactory()
                return MockQuery(ecourl)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Goextension'>":
                ro = factory.RoFactory()
                goext = factory.GoextensionFactory()
                goext.ro = ro
                return MockQuery(goext)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Dbentity'>":
                db = factory.DbentityFactory()
                return MockQuery(db)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Gosupportingevidence'>":
                goev = factory.GosupportingevidenceFactory()
                return MockQuery(goev)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdbentity = factory.ReferencedbentityFactory()
                refdbentity.journal = journal
                pheno = factory.PhenotypeFactory()
                db = factory.DbentityFactory()
                phenoannot = factory.PhenotypeannotationFactory()
                phenoannot.reference = refdbentity
                phenoannot.phenotype = pheno
                phenoannot.dbentity = db
                return MockQuery(phenoannot)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.PhenotypeannotationCond'>":
                cond = factory.PhenotypeannotationCondFactory()
                return MockQuery(cond)
            elif len(args) == 1 and str(args[0]) == 'Chebi.obj_url':
                chebi = factory.ChebiFactory()
                return MockQuery(chebi.obj_url)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
                s_name = factory.StraindbentityFactory()
                return MockQuery(s_name)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Apo'>":
                apo = factory.ApoFactory()
                return MockQuery(apo)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Regulationannotation'>":
                target = factory.DbentityFactory()
                regulator = factory.DbentityFactory()
                regannot = factory.RegulationannotationFactory()
                regannot.target = target
                regannot.regulator = regulator
                return MockQuery((regannot))
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Literatureannotation'>":
                source = factory.SourceFactory()
                journal = factory.JournalFactory()
                book = factory.BookFactory()
                refdbentity = factory.ReferencedbentityFactory()
                refdbentity.journal = journal
                dbentity = factory.DbentityFactory()
                litannot = factory.LiteratureannotationFactory()
                litannot.dbentity = dbentity
                litannot.reference = refdbentity
                return MockQuery(litannot)
            elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
                s_name = factory.StraindbentityFactory()
                return MockQuery(s_name)


def reference_phenotype_side_effect(*args, **kwargs):
    
    if len(args) == 1 and str(args[0]) == "<class 'src.models.Referencedbentity'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        return MockQuery(refdbentity)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Phenotypeannotation'>":
        source = factory.SourceFactory()
        journal = factory.JournalFactory()
        book = factory.BookFactory()
        refdbentity = factory.ReferencedbentityFactory()
        refdbentity.journal = journal
        #pheno = factory.PhenotypeFactory()
        db = factory.DbentityFactory()
        phenoannot = factory.PhenotypeannotationFactory()
        phenoannot.reference = refdbentity
        #phenoannot.phenotype = pheno
        phenoannot.dbentity = db
        return MockQuery(phenoannot)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.PhenotypeannotationCond'>":
        cond = factory.PhenotypeannotationCondFactory()
        return MockQuery(cond)
    elif len(args) == 1 and str(args[0]) == 'Chebi.obj_url':
        chebi = factory.ChebiFactory()
        return MockQuery(chebi.obj_url)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Straindbentity'>":
        s_name = factory.StraindbentityFactory()
        return MockQuery(s_name)
    elif len(args) == 1 and str(args[0]) == "<class 'src.models.Apo'>":
        apo = factory.ApoFactory()
        return MockQuery(apo)
