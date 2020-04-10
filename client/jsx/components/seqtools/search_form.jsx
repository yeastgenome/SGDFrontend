import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const DataTable = require('../widgets/data_table.jsx');
const Params = require('../mixins/parse_url_params.jsx');
const GSR = require('./gsr_helpers.jsx');

const style = {
  button: {
    fontSize: 18,
    background: 'none',
    border: 'none',
    color: '#7392b7',
  },
  textFont: { fontSize: 18 },
};

const SeqtoolsUrl = '/run_seqtools';

const MAX_GENE_TO_SHOW = 4;
const MAX_GENE = 50;
const MAX_SEQ_LENGTH_FOR_TOOLS = 10000000;

const GeneSequenceResources = React.createClass({
  getInitialState() {
    var param = Params.getParams();
    return {
      isComplete: false,
      isPending: false,
      userError: null,
      chr: 0,
      strains: ['S288C'],	
      strain: 'S288C',	
      resultData: {},
      notFound: null,
      param: param,
    };
  },

  render() {
    var page_to_display = this.getPage();

    return (
      <div>
        <span style={{ textAlign: 'center' }}>
          <h1>
            Gene/Sequence Resources{' '}
            <a
              target="_blank"
              href="https://sites.google.com/view/yeastgenome-help/sequence-help/genesequence-resources"
            >
              <img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img>
            </a>
          </h1>
          <hr />
        </span>
        {page_to_display}
      </div>
    );
  },

  componentDidMount() {
    var param = this.state.param;
    if (param['genes']) {
      this.runSeqTools('genes');
    } else if (param['chr']) {
      this.runSeqTools('chr');
    } else if (param['seq_id']) {
      this.runSeqTools('seq');
    } else if (param['emboss']) {
      this.runSeqTools('emboss');
    }
  },

  getPage() {
    var param = this.state.param;

    if (this.state.isComplete) {
      var data = this.state.resultData;

      if (param['submit']) {
        var genes = Object.keys(data).sort();

        if (genes.length == 0) {
          return (
            <div>
              <span style={style.textFont}>
                No sequence available for the input gene(s)/feature(s) in the
                selected strain(s)
              </span>
            </div>
          );
        }

        if (data['ERROR']) {
          return (
            <div>
              <span style={style.textFont}>{data['ERROR']}</span>
            </div>
          );
        }

        var [_geneList, _genes, _resultTable] = this.getResultTable4gene(data);
        var [_desc, _queryStr] = this.getDesc4gene(_geneList, _genes);
        var _geneSetLinks = this.getGeneSetLinks();
        var _allDownloadLinks = this.getAllDownloadLinks(_queryStr);

        return (
          <div>
            <p dangerouslySetInnerHTML={{ __html: _desc }} />
            {_allDownloadLinks}
            <p dangerouslySetInnerHTML={{ __html: _geneSetLinks }} />
            <p>{_resultTable} </p>
          </div>
        );
      } else if (param['submit2']) {
        var _resultTable = this.getResultTable4chr(data);
        var _desc = this.getDesc4chr(data);

        return (
          <div>
            <p dangerouslySetInnerHTML={{ __html: _desc }} />
            <p>{_resultTable} </p>
          </div>
        );
      } else if (param['submit3']) {
        var _resultTable = this.getResultTable4seq(data['residue']);
        var _desc = this.getDesc4seq();
        var _complementBox = this.getComplementBox(data['residue']);

        return (
          <div>
            <p dangerouslySetInnerHTML={{ __html: _desc }} />
            {_complementBox}
            <p>{_resultTable} </p>
          </div>
        );
      } else if (param['emboss']) {
        var _text = this.getDesc4emboss();

        return (
          <div>
            {_text}
            <pre>
              <span style={{ fontSize: 15 }}> {data['content']} </span>
            </pre>
          </div>
        );
      }
    } else if (this.state.isPending) {
      return (
        <div>
          <div className="row">
            <p>
              <b>Something wrong with your search!</b>
            </p>
          </div>
        </div>
      );
    } else {
      if (param['submit'] || param['submit2'] || param['submit3']) {
        return <p>Please wait while we retrieve the requested information.</p>;
      }

      return this.getFrontPage();
    }
  },

  getFrontPage() {
    var descText = GSR.TopDescription();

    var geneNodeLeft = this.getGeneNodeLeft();
    var geneNodeRight = this.getGeneNodeRight();
    var chrNodeLeft = this.getChrNodeLeft();
    var chrNodeRight = this.getChrNodeRight();
    var seqNodeLeft = this.getSeqNodeLeft();
    var seqNodeRight = this.getSeqNodeRight();

    var _nameSection = {
      headers: [
        [
          <span style={style.textFont}>
            <a name="gene">1. Search a list of genes</a>
          </span>,
          '',
        ],
      ],
      rows: [[geneNodeLeft, geneNodeRight]],
    };

    var _chrSection = {
      headers: [
        [
          <span style={style.textFont}>
            <strong style={{ color: 'red' }}>OR</strong>{' '}
            <a name="chr">
              2. Search a specified chromosomal region of S288C genome
            </a>
          </span>,
          '',
        ],
      ],
      rows: [[chrNodeLeft, chrNodeRight]],
    };

    var _seqSection = {
      headers: [
        [
          <span style={style.textFont}>
            <strong style={{ color: 'red' }}>OR</strong>{' '}
            <a name="seq">3. Analyze a raw DNA or Protein sequence</a>
          </span>,
          '',
        ],
      ],
      rows: [[seqNodeLeft, seqNodeRight]],
    };

    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: descText }} />
        <div className="row">
          <div className="large-12 columns">
            <form onSubmit={this.onSubmit} target="infowin">
              <DataTable data={_nameSection} />
            </form>
            <form onSubmit={this.onSubmit2} target="infowin">
              <DataTable data={_chrSection} />
            </form>
            <form onSubmit={this.onSubmit3} target="infowin">
              <DataTable data={_seqSection} />
            </form>
          </div>
        </div>
      </div>
    );
  },

  getComplementBox(seq) {
    var param = this.state.param;
    var rev = param['rev3'];

    if (rev == 'on' && param['seqtype'] == 'DNA') {
      return (
        <div>
          <h3>The reverse complement of this sequence:</h3>
          <p>
            <textarea value={seq} rows="7" cols="200"></textarea>
          </p>
        </div>
      );
    } else {
      return <div></div>;
    }
  },

  getResultTable4seq(seq) {
    var param = this.state.param;
    var seqtype = param['seqtype'];

    var min = 1;
    var max = 10000;
    var seqID = min + Math.random() * (max - min);

    var headerRow = ['', ''];

    var rows = [];

    // sequence analysis row

    var seqAnalRow = [<span style={style.textFont}>Sequence Analysis</span>];
    window.localStorage.setItem(seqID, seq);
    if (seqtype == 'DNA') {
      seqAnalRow.push(this.getToolsLinks4DNA(seqID, seq));
    } else {
      seqAnalRow.push(this.getToolsLinks4protein(seqID, seq));
    }
    rows.push(seqAnalRow);

    return this.display_result_table(headerRow, rows);
  },

  getResultTable4chr(data) {
    var num2chrMapping = GSR.NumToRoman();
    var chr = num2chrMapping[data['chr']];
    var start = data['start'];
    var end = data['end'];
    var rev = data['rev'];
    if (rev != 1) {
      rev = 0;
    }
    var headerRow = ['', ''];

    var rows = [];

    // browser row

    var browserRow = [
      <span style={style.textFont}>Genome Display (S288C)</span>,
    ];

    var url = 'https://browse.yeastgenome.org/?loc=chr' + chr;
    if (typeof start != 'undefined') {
      url += ':' + start + '..' + end;
    }
    browserRow.push(
      <span style={style.textFont}>
        <a href={url} target="infowin2">
          JBrowse
        </a>
      </span>
    );
    rows.push(browserRow);

    // sequence download row

    var seqDLRow = [
      <span style={style.textFont}>
        <br />
        Sequence Downloads
        <br />* DNA of Region
      </span>,
    ];
    var fastaUrl =
      SeqtoolsUrl +
      '?format=fasta&chr=' +
      data['chr'] +
      '&start=' +
      start +
      '&end=' +
      end +
      '&rev=' +
      rev;
    var gcgUrl =
      SeqtoolsUrl +
      '?format=gcg&chr=' +
      data['chr'] +
      '&start=' +
      start +
      '&end=' +
      end +
      '&rev=' +
      rev;
    seqDLRow.push(
      <span style={style.textFont}>
        <br />
        <br />
        <a href={fastaUrl} target="infowin">
          Fasta
        </a>{' '}
        |{' '}
        <a href={gcgUrl} target="infowin">
          GCG
        </a>
      </span>
    );
    rows.push(seqDLRow);

    // sequence analysis row

    var seqAnalRow = [<span style={style.textFont}>Sequence Analysis</span>];
    var seq = data['residue'];
    var seqID = chr + '_' + start + '_' + end + '_' + rev;
    window.localStorage.setItem(seqID, seq);
    seqAnalRow.push(this.getToolsLinks4chr(seqID, seq));
    rows.push(seqAnalRow);

    return this.display_result_table(headerRow, rows);
  },

  getResultTable4gene(data) {
    var [
      genes,
      displayName4gene,
      sgdid4gene,
      seq4gene,
      hasProtein4gene,
      hasCoding4gene,
      hasGenomic4gene,
      chrCoords4gene,
      queryGeneList,
    ] = this.getDataFromJson4gene(data);

    var param = this.state.param;

    var headerRow = [''];
    for (var i = 0; i <= genes.length; i++) {
      headerRow.push('');
    }
    var geneList = '';
    var rows = [];
    var geneRow = [<span style={style.textFont}>Gene Name</span>];
    _.map(genes, (gene) => {
      geneRow.push(
        <span style={style.textFont}>{displayName4gene[gene]}</span>
      );
      if (geneList != '') {
        geneList += ', ';
      }
      geneList += displayName4gene[gene];
    });
    rows.push(geneRow);

    // gene name row

    var locusRow = [
      <span style={style.textFont}>Locus and Homolog Details</span>,
    ];
    _.map(genes, (gene) => {
      var sgdUrl = 'https://www.yeastgenome.org/locus/' + sgdid4gene[gene];
      var allianceUrl =
        'http://www.alliancegenome.org/gene/' + sgdid4gene[gene];
      locusRow.push(
        <span style={style.textFont}>
          <a href={sgdUrl} target="infowin2">
            SGD
          </a>{' '}
          |{' '}
          <a href={allianceUrl} target="infowin2">
            Alliance
          </a>
        </span>
      );
    });
    rows.push(locusRow);

    // check to see if there is seq for any of the genes

    var hasProtein = 0;
    var hasCoding = 0;
    var hasGenomic = 0;
    _.map(genes, (gene) => {
      hasProtein += hasProtein4gene[gene];
      hasCoding += hasCoding4gene[gene];
      hasGenomic += hasGenomic4gene[gene];
    });
    var hasSeq = hasProtein + hasCoding + hasGenomic;

    if (hasSeq == 0) {
      return <div>No sequence for selected genes</div>;
    }

    // browser row

    var browserRow = [
      <span style={style.textFont}>Genome Display (S288C)</span>,
    ];
    _.map(genes, (gene) => {
      var chrCoords = chrCoords4gene[gene];
      var chr = chrCoords['chr'];
      if (chr == 'Mito') {
        chr = 'mt';
      }
      var start = chrCoords['start'];
      var end = chrCoords['end'];
      var url =
        'https://browse.yeastgenome.org/?loc=chr' +
        chr +
        ':' +
        start +
        '..' +
        end +
        '&tracks=All%20Annotated%20Sequence%20Features%2CProtein-Coding-Genes%2CDNA&highlight=';
      browserRow.push(
        <span style={style.textFont}>
          <a href={url} target="infowin2">
            JBrowse
          </a>
        </span>
      );
    });
    rows.push(browserRow);

    // alignment row

    var alignRow = [<span style={style.textFont}>Alignment/Variation</span>];
    var hasRow = 0;
    _.map(genes, (gene) => {
      var chrCoords = chrCoords4gene[gene];
      var locus_type = chrCoords['locus_type'];

      if (locus_type == 'ORF') {
        var variantUrl =
          'https://www.yeastgenome.org/variant-viewer#/' +
          sgdid4gene[gene].replace('SGD:', '');
        var strainUrl = '/strainAlignment?locus=' + gene;
        alignRow.push(
          <span style={style.textFont}>
            <br />
            <a href={variantUrl} target="infowin2">
              Variant Viewer
            </a>
            <br />
            <a href={strainUrl} target="infowin2">
              Strain Alignment
            </a>
          </span>
        );
        hasRow = hasRow + 1;
      } else {
        alignRow.push(<span> - </span>);
      }
    });
    if (hasRow > 0) {
      rows.push(alignRow);
    }

    // sequence download row

    var seqDLRow = [];
    if (hasCoding > 0 && hasProtein > 0) {
      seqDLRow = [
        <span style={style.textFont}>
          <br />
          Sequence Downloads
          <br />* DNA of Region
          <br />* Coding Sequence of Selected ORF
          <br />* Protein Translation of Selected ORF
        </span>,
      ];
    } else if (hasCoding > 0) {
      seqDLRow = [
        <span style={style.textFont}>
          <br />
          Sequence Downloads
          <br />* DNA of Region
          <br />* Coding Sequence of Selected Gene
        </span>,
      ];
    } else {
      seqDLRow = [
        <span style={style.textFont}>
          <br />
          Sequence Downloads
          <br />* DNA of Region
        </span>,
      ];
    }

    var strains = window.localStorage.getItem('strains');

    var extraParams = '';
    var up = 0;
    var down = 0;
    var rev = 0;
    if (
      (param['rev1'] && param['rev1'] == 'on') ||
      (param['rev'] && param['rev'] == '1')
    ) {
      extraParams = '&rev=1';
      rev = 1;
    }
    if (param['up'] && param['up'] != '') {
      extraParams += '&up=' + param['up'];
      up = param['up'];
    }
    if (param['down'] && param['down'] != '') {
      extraParams += '&down=' + param['down'];
      down = param['down'];
    }

    _.map(genes, (gene) => {
      var queryStr = '&genes=' + gene + '&strains=' + strains;
      var genomicFastaUrl =
        SeqtoolsUrl + '?format=fasta&type=genomic' + queryStr + extraParams;
      var genomicGcgUrl =
        SeqtoolsUrl + '?format=gcg&type=genomic' + queryStr + extraParams;
      var codingFastaUrl =
        SeqtoolsUrl + '?format=fasta&type=coding' + queryStr + extraParams;
      var codingGcgUrl =
        SeqtoolsUrl + '?format=gcg&type=coding' + queryStr + extraParams;
      var proteinFastaUrl =
        SeqtoolsUrl + '?format=fasta&type=protein' + queryStr + extraParams;
      var proteinGcgUrl =
        SeqtoolsUrl + '?format=gcg&type=protein' + queryStr + extraParams;
      var thisHasCoding = hasCoding4gene[gene];
      var thisHasProtein = hasProtein4gene[gene];
      if (thisHasProtein > 0) {
        seqDLRow.push(
          <span style={style.textFont}>
            <br />
            <br />
            <a href={genomicFastaUrl} target="infowin">
              Fasta
            </a>{' '}
            |{' '}
            <a href={genomicGcgUrl} target="infowin">
              GCG
            </a>
            <br />
            <a href={codingFastaUrl} target="infowin">
              Fasta
            </a>{' '}
            |{' '}
            <a href={codingGcgUrl} target="infowin">
              GCG
            </a>
            <br />
            <a href={proteinFastaUrl} target="infowin">
              Fasta
            </a>{' '}
            |{' '}
            <a href={proteinGcgUrl} target="infowin">
              GCG
            </a>
          </span>
        );
      } else if (thisHasCoding > 0) {
        if (hasProtein > 0) {
          seqDLRow.push(
            <span style={style.textFont}>
              <br />
              <br />
              <a href={genomicFastaUrl} target="infowin">
                Fasta
              </a>{' '}
              |{' '}
              <a href={genomicGcgUrl} target="infowin">
                GCG
              </a>
              <br />
              <a href={codingFastaUrl} target="infowin">
                Fasta
              </a>{' '}
              |{' '}
              <a href={codingGcgUrl} target="infowin">
                GCG
              </a>
              <br /> -
            </span>
          );
        } else {
          seqDLRow.push(
            <span style={style.textFont}>
              <br />
              <br />
              <a href={genomicFastaUrl} target="infowin">
                Fasta
              </a>{' '}
              |{' '}
              <a href={genomicGcgUrl} target="infowin">
                GCG
              </a>
              <br />
              <a href={codingFastaUrl} target="infowin">
                Fasta
              </a>{' '}
              |{' '}
              <a href={codingGcgUrl} target="infowin">
                GCG
              </a>
            </span>
          );
        }
      } else {
        if (hasCoding > 0 && hasProtein > 0) {
          seqDLRow.push(
            <span style={style.textFont}>
              <br />
              <br />
              <a href={genomicFastaUrl} target="infowin">
                Fasta
              </a>{' '}
              |{' '}
              <a href={genomicGcgUrl} target="infowin">
                GCG
              </a>
              <br /> -
              <br /> -
            </span>
          );
        } else if (hasCoding > 0) {
          seqDLRow.push(
            <span style={style.textFont}>
              <br />
              <br />
              <a href={genomicFastaUrl} target="infowin">
                Fasta
              </a>{' '}
              |{' '}
              <a href={genomicGcgUrl} target="infowin">
                GCG
              </a>
              <br /> -
            </span>
          );
        } else {
          seqDLRow.push(
            <span style={style.textFont}>
              <br />
              <br />
              <a href={genomicFastaUrl} target="infowin">
                Fasta
              </a>{' '}
              |{' '}
              <a href={genomicGcgUrl} target="infowin">
                GCG
              </a>
            </span>
          );
        }
      }
    });
    rows.push(seqDLRow);

    var ID = up + '_' + down + '_' + rev;
    var seqAnalRow = [<span style={style.textFont}>Sequence Analysis</span>];
    _.map(genes, (gene) => {
      var s = seq4gene[gene];
      var seqInfo = s['genomic'];
      var selectedStrains = Object.keys(seqInfo).sort();
      _.map(selectedStrains, (strain) => {
        var seqID = gene + '_' + strain + '_' + ID;
        var seq = seqInfo[strain];
        window.localStorage.setItem(seqID, seq);
      });
      // seqAnalRow.push(this.getToolsLinks(gene, strains, ID));
      seqAnalRow.push(this.getToolsLinks(gene, selectedStrains, ID));
    });
    rows.push(seqAnalRow);

    return [
      geneList,
      queryGeneList,
      this.display_result_table(headerRow, rows),
    ];
  },

  getToolsLinks4DNA(seqID, seq) {
    var blastButton = this.getToolButtonChr('/blast-sgd', 'BLAST', seqID, '');
    var fungalBlastButton = this.getToolButtonChr(
      '/blast-fungal',
      'Fungal BLAST',
      seqID,
      ''
    );

    var primerButton = this.getToolButtonChr(
      '/primer3',
      'Design Primers',
      seqID,
      ''
    );
    var restrictionButton = this.getToolButtonChr(
      '/restrictionMapper',
      'Restriction Site Mapper',
      seqID,
      ''
    );
    var translatedProteinButton = this.getToolButtonChr(
      '/seqTools',
      'Translated Protein Sequence',
      seqID,
      'transeq'
    );
    var sixframeButton = this.getToolButtonChr(
      '/seqTools',
      '6 Frame Translation',
      seqID,
      'remap'
    );

    var seqlen = seq.length;

    if (seqlen > 20) {
      if (seq.length <= MAX_SEQ_LENGTH_FOR_TOOLS) {
        return (
          <div className="row">
            <div className="large-12 columns">
              {blastButton}
              {fungalBlastButton}
              {primerButton}
              {restrictionButton}
              {translatedProteinButton}
              {sixframeButton}
            </div>
          </div>
        );
      } else {
        return (
          <div className="row">
            <div className="large-12 columns">
              {blastButton}
              {fungalBlastButton}
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="row">
          <div className="large-12 columns">
            {blastButton}
            {fungalBlastButton}
            {primerButton}
            <form method="GET" action="/nph-patmatch" target="toolwin">
              <input type="hidden" name="seqtype" value="dna" />
              <input type="hidden" name="seq" value={seq} />
              <input
                type="submit"
                value="Genome Pattern Matching"
                style={style.button}
              />
            </form>
            {restrictionButton}
          </div>
        </div>
      );
    }
  },

  getToolsLinks4protein(seqID, seq) {
    var blastButton = this.getToolButtonRawSeq(
      '/blast-sgd',
      'BLAST',
      seqID,
      'protein'
    );
    var fungalBlastButton = this.getToolButtonRawSeq(
      '/blast-fungal',
      'Fungal BLAST',
      seqID,
      'protein'
    );

    var seqlen = seq.length;

    if (seqlen > 20) {
      return (
        <div className="row">
          <div className="large-12 columns">
            {blastButton}
            {fungalBlastButton}
          </div>
        </div>
      );
    } else {
      return (
        <div className="row">
          <div className="large-12 columns">
            {blastButton}
            {fungalBlastButton}
            <form method="GET" action="/nph-patmatch" target="toolwin">
              <input type="hidden" name="seq" value={seq} />
              <input
                type="submit"
                value="Genome Pattern Matching"
                style={style.button}
              />
            </form>
          </div>
        </div>
      );
    }
  },

  getToolsLinks4chr(seqID, seq) {
    var blastButton = this.getToolButtonChr('/blast-sgd', 'BLAST', seqID, '');
    var fungalBlastButton = this.getToolButtonChr(
      '/blast-fungal',
      'Fungal BLAST',
      seqID,
      ''
    );

    if (seq.length <= MAX_SEQ_LENGTH_FOR_TOOLS) {
      var primerButton = this.getToolButtonChr(
        '/primer3',
        'Design Primers',
        seqID,
        ''
      );
      var restrictionButton = this.getToolButtonChr(
        '/restrictionMapper',
        'Restriction Site Mapper',
        seqID,
        ''
      );
      var restrictFragmentsButton = this.getToolButtonChr(
        '/seqTools',
        'Restriction Fragments',
        seqID,
        'restrict'
      );
      var sixframeButton = this.getToolButtonChr(
        '/seqTools',
        '6 Frame Translation',
        seqID,
        'remap'
      );

      return (
        <div className="row">
          <div className="large-12 columns">
            {blastButton}
            {fungalBlastButton}
            {primerButton}
            {restrictionButton}
            {restrictFragmentsButton}
            {sixframeButton}
          </div>
        </div>
      );
    } else {
      return (
        <div className="row">
          <div className="large-12 columns">
            {blastButton}
            {fungalBlastButton}
          </div>
        </div>
      );
    }
  },

  getToolsLinks(gene, strains, ID) {
    var strainPulldown = this.getStrainPulldown(strains);
    var blastButton = this.getToolButton(gene, '/blast-sgd', 'BLAST', ID, '');
    var fungalBlastButton = this.getToolButton(
      gene,
      '/blast-fungal',
      'Fungal BLAST',
      ID,
      ''
    );
    var primerButton = this.getToolButton(
      gene,
      '/primer3',
      'Design Primers',
      ID,
      ''
    );
    var restrictionButton = this.getToolButton(
      gene,
      '/restrictionMapper',
      'Restriction Site Mapper',
      ID,
      ''
    );
    var restrictFragmentsButton = this.getToolButton(
      gene,
      '/seqTools',
      'Restriction Fragments',
      ID,
      'restrict'
    );
    var sixframeButton = this.getToolButton(
      gene,
      '/seqTools',
      '6 Frame Translation',
      ID,
      'remap'
    );

    return (
      <div className="row">
        <div className="large-12 columns">
          {strainPulldown}
          {blastButton}
          {fungalBlastButton}
          {primerButton}
          {restrictionButton}
          {restrictFragmentsButton}
          {sixframeButton}
        </div>
      </div>
    );
  },

  getToolButton(name, program, button, ID, emboss) {
    var strain = this.state.strain;
    if (strain == '') {
      strain = window.localStorage.getItem('strain');
    }
    var seqID = name + '_' + strain + '_' + ID;
    var seq = window.localStorage.getItem(seqID);

    if (emboss == '') {
      return (
        <form method="GET" action={program} target="toolwin">
          <input type="hidden" name="sequence_id" value={seqID} />
          <input type="submit" value={button} style={style.button} />
        </form>
      );
    } else {
      return (
        <form method="GET" action={program} target="toolwin">
          <input type="hidden" name="sequence_id" value={seqID} />
          <input type="hidden" name="emboss" value={emboss} />
          <input type="submit" value={button} style={style.button} />
        </form>
      );
    }
  },

  getToolButtonRawSeq(program, button, seqID, seqtype) {
    if (seqtype != '') {
      return (
        <form method="GET" action={program} target="toolwin">
          <input type="hidden" name="sequence_id" value={seqID} />
          <input type="hidden" name="type" value={seqtype} />
          <input type="submit" value={button} style={style.button} />
        </form>
      );
    } else {
      return (
        <form method="GET" action={program} target="toolwin">
          <input type="hidden" name="sequence_id" value={seqID} />
          <input type="submit" value={button} style={style.button} />
        </form>
      );
    }
  },

  getToolButtonChr(program, button, seqID, emboss) {
    if (emboss != '') {
      return (
        <form method="GET" action={program} target="toolwin">
          <input type="hidden" name="sequence_id" value={seqID} />
          <input type="hidden" name="emboss" value={emboss} />
          <input type="submit" value={button} style={style.button} />
        </form>
      );
    } else {
      return (
        <form method="GET" action={program} target="toolwin">
          <input type="hidden" name="sequence_id" value={seqID} />
          <input type="submit" value={button} style={style.button} />
        </form>
      );
    }
  },

  getToolButtonChr4post(program, button, seq) {
    return (
      <form method="POST" action={program} target="toolwin">
        <input type="hidden" name="seq" value={seq} />
        <input type="submit" value={button} style={style.button} />
      </form>
    );
  },

  display_result_table(headerRow, rows) {
    var _tableData = {
      headers: [headerRow],
      rows: rows,
    };

    var _dataTableOptions = {
      bPaginate: false,
      bFilter: false,
      bInfo: false,
      bSort: false,
      oLanguage: { sEmptyTable: '' },
    };

    return (
      <DataTable
        data={_tableData}
        usePlugin={true}
        pluginOptions={_dataTableOptions}
      />
    );
  },

  getDataFromJson4gene(data) {
    var keys = Object.keys(data).sort();
    var displayName4gene = {};
    var sgdid4gene = {};
    var featureType4gene = {};
    var hasProtein4gene = {};
    var hasCoding4gene = {};
    var hasGenomic4gene = {};
    var seq4gene = {};
    var chrCoords4gene = {};
    var queryGeneList = [];
    var genes = [];
    _.map(keys, (key) => {
      var [gene, queryGene] = key.split('|');
      queryGeneList.push(queryGene);
      genes.push(gene);
      var seqInfo = data[key];
      var proteinSeq4strain = {};
      var codingSeq4strain = {};
      var genomicSeq4strain = {};
      var seqTypes = Object.keys(seqInfo);
      hasProtein4gene[gene] = 0;
      hasCoding4gene[gene] = 0;
      hasGenomic4gene[gene] = 0;
      _.map(seqTypes, (seqType) => {
        if (seqType == 'chr_coords') {
          chrCoords4gene[gene] = seqInfo[seqType];
        } else {
          var strainInfo = seqInfo[seqType];
          var strains = Object.keys(strainInfo);
          _.map(strains, (strain) => {
            var strainDetails = strainInfo[strain];
            if (typeof displayName4gene[gene] == 'undefined') {
              var display_name = strainDetails['display_name'];
              if (display_name != gene) {
                displayName4gene[gene] = display_name + '/' + gene;
              } else {
                displayName4gene[gene] = display_name;
              }
              sgdid4gene[gene] = strainDetails['sgdid'];
            }
            // var headline = strainDetails['headline'];

            if (seqType == 'protein') {
              proteinSeq4strain[strain] = strainDetails['residue'];
              hasProtein4gene[gene] += 1;
            } else if (seqType == 'coding_dna') {
              codingSeq4strain[strain] = strainDetails['residue'];
              hasCoding4gene[gene] += 1;
            } else if (seqType == 'genomic_dna') {
              genomicSeq4strain[strain] = strainDetails['residue'];
              hasGenomic4gene[gene] += 1;
            }
          });
        }
      });

      seq4gene[gene] = {
        protein: proteinSeq4strain,
        coding: codingSeq4strain,
        genomic: genomicSeq4strain,
      };
    });

    return [
      genes,
      displayName4gene,
      sgdid4gene,
      seq4gene,
      hasProtein4gene,
      hasCoding4gene,
      hasGenomic4gene,
      chrCoords4gene,
      queryGeneList,
    ];
  },

  checkGenes(genes) {
    genes = genes.replace(/[^A-Za-z:\-0-9\(\)]/g, ' ');
    var re = /\+/g;
    genes = genes.replace(re, ' ');
    var re = / +/g;

    var geneList = genes.split(' ');

    var max = geneList.length;
    if (max > MAX_GENE) {
      max = MAX_GENE;
    }
    var displaySet = '';
    var allGenes = '';
    for (var i = 0; i < max; i++) {
      if (i < MAX_GENE_TO_SHOW) {
        if (i >= 1) {
          displaySet += '|';
        }
        displaySet += geneList[i];
      }
      if (i >= 1) {
        allGenes += '|';
      }
      allGenes += geneList[i];
    }

    return [displaySet, allGenes];
  },

  onSubmit(e) {
    var genes = this.refs.genes.value.trim();
    // var email = this.refs.email.value.trim();

    var [displaySet, allGenes] = this.checkGenes(genes);

    if (displaySet == '') {
      alert('Please enter one or more gene names.');
      e.preventDefault();
      return 1;
    }

    // if (geneCount > MAX_GENE && email == "") {
    //     alert("Please enter an email address in the email box so we can send the sequences to you.");
    //     e.preventDefault();
    //     return 1;
    // }

    // if (email != "") {
    //     if (email.match(/\@/g) == null) {
    //     	  alert("Please enter a valid email address");
    //     	  e.preventDefault();
    //     	  return 1;
    //     }
    // }

    var up = this.refs.up.value.trim();
    var down = this.refs.down.value.trim();
    if (isNaN(up) || isNaN(down)) {
      alert('Please enter a number for up & downstream basepairs.');
      e.preventDefault();
      return 1;
    }

    var strainList = document.getElementById('strains');
    var strains = '';
    for (var i = 0; i < strainList.options.length; i++) {
      if (strainList.options[i].selected) {
        if (strains) {
          strains = strains + '|' + strainList.options[i].value;
        } else {
          strains = strainList.options[i].value;
        }
      }
    }

    if (strains == '') {
      alert('Please pick one or more strains.');
      e.preventDefault();
      return 1;
    }

    window.localStorage.clear();
    window.localStorage.setItem('genes', displaySet);
    window.localStorage.setItem('displaySet', displaySet);
    window.localStorage.setItem('strains', strains);
    window.localStorage.setItem('allGenes', allGenes);
  },

  onSubmit2(e) {
    var chr = this.refs.chr.value.trim();
    if (chr == 0) {
      alert('Please pick a chromosome.');
      e.preventDefault();
      return 1;
    }

    var start = this.refs.start.value.trim();
    var end = this.refs.end.value.trim();
    if (isNaN(start) || isNaN(end)) {
      alert('Please enter a number for chromosomal coordinates.');
      e.preventDefault();
      return 1;
    }
  },

  onSubmit3(e) {
    var seq = this.refs.seq.value.trim();

    seq = seq.replace(/[^A-Za-z]/g, '');
    if (seq == '') {
      alert('Please enter a raw sequence.');
      e.preventDefault();
      return 1;
    }

    var seqtype = this.refs.seqtype.value.trim();

    if (seqtype == 'DNA') {
      var re = /[^ATCGatcg]/;
      var OK = re.exec(seq);
      if (OK != null) {
        alert(
          'Looks like you are entering a PROTEIN sequence instead of DNA sequence. Please pick a right sequence type and try it again.'
        );
        e.preventDefault();
        return 1;
      }
    } else {
      if (seq.match(/^[ATCGatcg]+$/g) !== null) {
        alert(
          'Looks like you are entering a DNA sequence instead of PROTEIN sequence. Please pick a right sequence type and try it again.'
        );
        e.preventDefault();
        return 1;
      }
    }

    var seq_id = this.refs.seq_id.value.trim();
    if (seq) {
      window.localStorage.setItem(seq_id, seq);
    }
  },

  getGeneNodeLeft() {
    var reverseCompNode = this.getReverseCompNode('rev1');

    var param = this.state.param;
    var seqname = param['seqname'];

    return (
      <div style={{ textAlign: 'top' }}>
        <h3>Enter a list of names:</h3>
        <p>
          Use space-separated standard gene names (and/or ORF and/or SGDID).{' '}
          <br />
          Example: SIR2 YHR023W SGD:S000000001. The maximum gene number for this
          search is {MAX_GENE}. It will take first {MAX_GENE} genes if more than{' '}
          {MAX_GENE} are provided.
          <textarea
            ref="genes"
            name="genes"
            value={seqname}
            onChange={this.onChange}
            rows="2"
            cols="50"
          ></textarea>
        </p>
        <h3>
          <b>If available,</b> add flanking basepairs
        </h3>
        <p>
          Upstream:{' '}
          <input
            type="text"
            ref="up"
            name="up"
            onChange={this.onChange}
            size="50"
          />
          Downstream:{' '}
          <input
            type="text"
            ref="down"
            name="down"
            onChange={this.onChange}
            size="50"
          />
        </p>
        {reverseCompNode}
      </div>
    );
  },

  getGeneNodeRight() {
    var strainNode = this.getStrainNode();
    var reverseCompNode = this.getReverseCompNode('rev1');

    return (
      <div>
        <h3>Pick one or more strains:</h3>
        {strainNode}
        <p>
          <input type="hidden" name="more" value="1" />
          <input
            type="submit"
            ref="submit"
            name="submit"
            value="Submit Form"
            className="button secondary"
          />{' '}
          <input
            type="reset"
            ref="reset"
            name="reset"
            value="Reset Form"
            className="button secondary"
          />
        </p>
      </div>
    );
  },

  getChrNodeLeft() {
    var chr2num = {
      '-- choose a chromosome --': 0,
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
      IX: 9,
      X: 10,
      XI: 11,
      XII: 12,
      XIII: 13,
      XIV: 14,
      XV: 15,
      XVI: 16,
      Mito: 17,
    };

    var chromosomes = Object.keys(chr2num);

    var _elements = _.map(chromosomes, (c) => { 
      return <option value={chr2num[c]}>{c}</option>;
    });

    return (
      <div>
        <h3>Pick a chromosome: </h3>
        <p>
          <select ref="chr" name="chr" value={this.state.chr} onChange={this.onChrChange}>
            {_elements}
          </select>
        </p>
        <p>
          Then enter coordinates (optional)
          <input
            type="text"
            ref="start"
            name="start"
            onChange={this.onChange}
            size="105"
          />
          to
          <input
            type="text"
            ref="end"
            name="end"
            onChange={this.onChange}
            size="105"
          />
          The entire chromosome sequence will be displayed if no coordinates are
          entered.{' '}
        </p>
      </div>
    );
  },

  getChrNodeRight() {
    var reverseCompNode = this.getReverseCompNode('rev2');

    return (
      <div>
        <p>
          <b>Note</b>: Enter coordinates in ascending order for the Watson
          strand and descending order for the Crick strand.
        </p>
        {reverseCompNode}
        <p>
          <input
            type="submit"
            ref="submit2"
            name="submit2"
            value="Submit Form"
            className="button secondary"
          />{' '}
          <input
            type="reset"
            ref="reset2"
            name="reset2"
            value="Reset Form"
            className="button secondary"
          />
        </p>
      </div>
    );
  },

  getSeqNodeLeft() {
    var seqtypeNode = this.getSeqtypeNode();

    var min = 1;
    var max = 10000;
    var localSeqID = min + Math.random() * (max - min);

    return (
      <div>
        <h3>Type or Paste a: </h3>
        {seqtypeNode}
        <p>
          Sequence:
          <textarea
            ref="seq"
            onChange={this.onChange}
            rows="3"
            cols="75"
          ></textarea>
        </p>
        <input
          type="hidden"
          name="seq_id"
          ref="seq_id"
          value={localSeqID}
        />
      </div>
    );
  },

  getSeqNodeRight() {
    var reverseCompNode = this.getReverseCompNode('rev3');

    return (
      <div>
        <p>
          The sequence <b>MUST</b> be provided in RAW format, no comments
          (numbers are okay).
        </p>
        {reverseCompNode}
        <p>
          <input
            type="submit"
            ref="submit3"
            name="submit3"
            value="Submit Form"
            className="button secondary"
          />{' '}
          <input
            type="reset"
            ref="reset3"
            name="reset3"
            value="Reset Form"
            className="button secondary"
          />
        </p>
      </div>
    );
  },

  getSeqtypeNode() {
    var _elements = [];
    _elements.push(<option value="DNA">DNA</option>);
    _elements.push(<option value="Protein">Protein</option>);
      
    return (
      <div>
        <p>
          <select name="seqtype" ref="seqtype" onChange={this.onChange}>
            {_elements}
          </select>
        </p>
      </div>
    );
  },

  getReverseCompNode(name) {
    if (name == 'rev3') {
      return (
        <div>
          <p>
            <input
              ref={name}
              name={name}
              id={name}
              type="checkbox"
              onChange={this.onChange}
            />{' '}
            Use the reverse complement (for DNA sequence only)
          </p>
        </div>
      );
    } else {
      return (
        <div>
          <p>
            <input
              ref={name}
              name={name}
              id={name}
              type="checkbox"
              onChange={this.onChange}
            />{' '}
            Use the reverse complement
          </p>
        </div>
      );
    }
  },

  getStrainPulldown(strains) {
    var defaultStrain = '';

    var _elements = _.map(strains, (s) => {
      return <option value={s}>{s}</option>;
    });

    window.localStorage.setItem('strain', defaultStrain);

    return (
      <div>
        <p>
          <select
            ref="strain"
            name="strain"
            id="strain"
	    value={this.state.strain}
            onChange={this.onChange4strain}
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  },

  getStrainNode() {
    var strain2label = GSR.StrainMapping();

    var strains = Object.keys(strain2label);

    var _elements = _.map(strains, (s) => {
      var label = strain2label[s];
      return <option value={s}>{label}</option>;
    });

    return (
      <div>
        <p>
          (Select or unselect multiple strains by pressing the Control (PC) or
          Command (Mac) key while clicking.)
          <select
            ref="strains"
            name="strains"
            id="strains"
            onChange={this.onStrainChange}
            size="11"
            multiple
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  },

  onStrainChange(e) {
    this.setState({ strains: e.target.value });
  },
    
  onChrChange(e) {
    this.setState({ chr: e.target.value });
  },
    
  onChange(e) {
    this.setState({ text: e.target.value });
  },

  onChange4strain(e) {
    this.setState({ strain: e.target.value });
  },

  runSeqTools(searchType) {
    var paramData = {};

    var param = this.state.param;

    if (searchType == 'genes') {
      var more = param['more'];
      if (more > 1) {
        var displaySet = '';
        var allGenes = window.localStorage.getItem('allGenes');
        console.log('allGenes=' + allGenes);
        var allGeneList = allGenes.split('|');
        for (var i = 0; i < allGeneList.length; i++) {
          if (
            i >= (more - 1) * MAX_GENE_TO_SHOW &&
            i < more * MAX_GENE_TO_SHOW
          ) {
            if (displaySet != '') {
              displaySet += '|';
            }
            displaySet += allGeneList[i];
          }
        }
        window.localStorage.setItem('displaySet', displaySet);
        paramData['genes'] = displaySet;
      } else {
        paramData['genes'] = window.localStorage.getItem('genes');
      }
      paramData['strains'] = window.localStorage.getItem('strains');

      if (param['up']) {
        paramData['up'] = param['up'];
      }
      if (param['down']) {
        paramData['down'] = param['up'];
      }
      if (param['rev1'] && param['rev1'] == 'on') {
        paramData['rev'] = 1;
      }
      this.sendRequest(paramData);
      return;
    }

    if (searchType == 'chr') {
      paramData['chr'] = param['chr'];
      if (param['start']) {
        paramData['start'] = param['start'];
      }
      if (param['end']) {
        paramData['end'] = param['end'];
      }
      if (param['rev2'] && param['rev2'] == 'on') {
        paramData['rev'] = 1;
      }
      this.sendRequest(paramData);
      window.localStorage.clear();
      return;
    }

    if (searchType == 'seq') {
      var seqID = param['seq_id'];
      var seq = window.localStorage.getItem(seqID);
      seq = seq.replace(/%0D/g, '');
      seq = seq.replace(/%0A/g, '');
      seq = seq.toUpperCase().replace(/[^A-Z]/g, '');
      paramData['seq'] = seq;
      paramData['seqtype'] = param['seqtype'];
      if (
        paramData['seqtype'] == 'DNA' &&
        param['rev3'] &&
        param['rev3'] == 'on'
      ) {
        paramData['rev'] = 1;
      }
      this.sendRequest(paramData);
      return;
    }

    if (searchType == 'emboss') {
      paramData['emboss'] = param['emboss'];
      if (param['sequence_id']) {
        paramData['seq'] = window.localStorage.getItem(param['sequence_id']);
      } else if (param['seqname']) {
        paramData['seqname'] = param['seqname'];
        if (param['strain']) {
          paramData['strain'] = param['strain'];
        }
      }
      this.sendRequest(paramData);
      return;
    }
  },

  validateGenes(name) {
    $.ajax({
      url: SeqtoolsUrl,
      dataType: 'json',
      data: { check: name },
      success: function (data) {
        this.setState({ notFound: data });
        if (data != '') {
          alert('These gene name(s) do not exist in the database: ' + data);
        }
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(SeqtoolUrl, status, err.toString());
      }.bind(this),
    });
  },

  sendRequest(paramData) {
    $.ajax({
      url: SeqtoolsUrl,
      data_type: 'json',
      type: 'POST',
      data: paramData,
      success: function (data) {
        this.setState({ isComplete: true, resultData: data });
      }.bind(this),
      error: function (xhr, status, err) {
        this.setState({ isPending: true });
      }.bind(this),
    });
  },

  getExtraParams(param) {
    var extraParams = '';
    if (param['rev1'] && param['rev1'] == 'on') {
      extraParams = '&rev=1';
    }
    if (param['up'] && param['up'] != '') {
      extraParams += '&up=' + param['up'];
    }
    if (param['down'] && param['down'] != '') {
      extraParams += '&down=' + param['down'];
    }

    return extraParams;
  },

  getAllDownloadLinks(queryStr) {
    var genomicFastaUrl =
      SeqtoolsUrl + '?format=fasta&type=genomic&' + queryStr;
    var genomicGcgUrl = SeqtoolsUrl + '?format=gcg&type=genomic&' + queryStr;
    var codingFastaUrl = SeqtoolsUrl + '?format=fasta&type=coding&' + queryStr;
    var codingGcgUrl = SeqtoolsUrl + '?format=gcg&type=coding&' + queryStr;
    var proteinFastaUrl =
      SeqtoolsUrl + '?format=fasta&type=protein&' + queryStr;
    var proteinGcgUrl = SeqtoolsUrl + '?format=gcg&type=protein&' + queryStr;

    return (
      <div>
        <p>
          <span style={style.textFont}>Download All Sequences: </span>
          <span style={style.textFont}>
            {' '}
            <a href={genomicFastaUrl}>Genomic DNA (.fsa)</a> |{' '}
            <a href={genomicGcgUrl}>Genomic DNA (.gcg)</a> |{' '}
            <a href={codingFastaUrl}>Coding DNA (.fsa)</a> |{' '}
            <a href={codingGcgUrl}>Coding DNA (.gcg)</a> |{' '}
            <a href={proteinFastaUrl}>Protein (.fsa)</a> |{' '}
            <a href={proteinGcgUrl}>Protein (.gcg)</a>
          </span>
        </p>
      </div>
    );
  },

  getGeneSetLinks() {
    var allGenes = window.localStorage.getItem('allGenes');
    var allGeneList = allGenes.split('|');
    if (allGeneList.length <= MAX_GENE_TO_SHOW) {
      return '';
    }

    var param = this.state.param;
    var more = param['more'];
    var extraParams = this.getExtraParams(param);

    var moreLinkQueryStr = 'genes=' + allGenes;
    moreLinkQueryStr += '&strains=' + param['strains'];
    moreLinkQueryStr += extraParams;
    moreLinkQueryStr += '&submit=Submit+Form';
    moreLinkQueryStr = moreLinkQueryStr.replace(/ /g, '|');
    console.log('moreLinkQueryStr=' + moreLinkQueryStr);

    var linkCount = allGeneList.length / 4;
    if (allGeneList.length % 4 != 0) {
      linkCount += 1;
    }

    var links = '';
    var prevLink = '';
    var nextLink = '';

    var index = 1;
    if (more > 1) {
      index = more;
    }
    for (var i = 1; i <= linkCount; i++) {
      if (links != '') {
        links += '&nbsp&nbsp&nbsp&nbsp';
      }
      if (index == i) {
        links += i;
        var next = i + 1;
        var prev = i - 1;
        if (prevLink == '' && i > 1) {
          prevLink =
            '<a href=/seqTools?' +
            moreLinkQueryStr +
            '&more=' +
            prev +
            '>Previous</a>';
        }
        if (nextLink == '' && i < linkCount - 1) {
          nextLink =
            '<a href=/seqTools?' +
            moreLinkQueryStr +
            '&more=' +
            next +
            '>Next</a>';
        }
      } else {
        links +=
          '<a href=/seqTools?' +
          moreLinkQueryStr +
          '&more=' +
          i +
          '>' +
          i +
          '</a>';
      }
    }

    if (prevLink != '') {
      links = prevLink + '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp' + links;
    }
    if (nextLink != '') {
      links = links + '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp' + nextLink;
    }

    // return "<h3><center>Display Gene Sets:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp" + links + "</center></h3></center>";
    return '<h3><center>' + links + '</center></h3></center>';
  },

  getDesc4gene(geneList, genes) {
    var param = this.state.param;
    var rev = param['rev1'];
    var up = param['up'];
    var down = param['down'];

    var displaySetGenes = window.localStorage.getItem('displaySet');

    var text = 'The currently displayed gene(s)/sequence(s) are ';

    text += "<font color='red'>" + geneList + '</font>';

    var extraParams = this.getExtraParams(param);

    var pickedSet = displaySetGenes.split('|');

    if (genes.length < pickedSet.length) {
      var noSeqGenes = '';
      _.map(pickedSet, (gene) => {
        if (genes.indexOf(gene) < 0) {
          if (noSeqGenes != '') {
            noSeqGenes += ', ';
          }
          noSeqGenes += gene;
        }
      });

      text +=
        ". No sequence available for <font color='red'>" +
        noSeqGenes +
        '</font> in the selected strain(s) in this gene set.';
    }

    if (up && down) {
      text +=
        ' <b>plus ' +
        up +
        ' basepair(s) of upstream sequence and ' +
        down +
        ' basepair(s) of downstream sequence.</b>';
    } else if (up) {
      text += ' <b>plus ' + up + ' basepair(s) of upstream sequence.</b>';
    } else if (down) {
      text += ' <b>plus ' + down + ' basepair(s) of downstream sequence.</b>';
    }

    text = '<h3>' + text + '</h3>';

    if (rev == 'on') {
      text +=
        "<h2><font color='red'>You have selected the reverse complement of this gene/sequence list.</font></h2>";
    }

    var allGenes = window.localStorage.getItem('allGenes');

    var queryStr =
      'genes=' + allGenes + '&strains=' + param['strains'] + extraParams;

    return [text, queryStr];
  },

  getDesc4chr(data) {
    var chrnum = data['chr'];

    var text = 'The current selection is: ';

    var num2chrMapping = GSR.NumToRoman();
    if (typeof data['start'] == 'undefined') {
      text +=
        "<font color='red'>chromosome " + num2chrMapping[chrnum] + '</font>';
    } else {
      text +=
        "<font color='red'>chromosome " +
        num2chrMapping[chrnum] +
        ' coordinates ' +
        data['start'] +
        ' to ' +
        data['end'] +
        '</font>';
    }
    text = '<h3>' + text + '</h3>';

    var param = this.state.param;

    if (param['rev2'] == 'on' || data['start'] > data['end']) {
      text +=
        "<h3><font color='red'>You have selected the reverse complement of this sequence. The reverse complement is on the Crick strand and will be displayed 5'->3' for all Sequence Downloads and Analysis options.</font></h3>";
    }

    return text;
  },

  getDesc4seq() {
    var param = this.state.param;
    var seqtype = param['seqtype'];
    return (
      "<h3>The current raw sequence you have entered is: <font color='red'>" +
      seqtype +
      ' sequence</font></h3>'
    );
  },

  getDesc4emboss() {
    var param = this.state.param;

    var emboss = param['emboss'];

    var title = '';

    if (emboss == 'restrict') {
      title = 'Restriction Fragments';
    } else if (emboss == 'remap') {
      title = 'Six Frame Translation';
    } else {
      title = 'Protein Translation';
    }

    if (param['seqname']) {
      var seqname = param['seqname'];
      var strain = 'S288C';
      if (param['strain']) {
        strain = param['strain'];
      }

      return (
        <div>
          <span style={style.textFont}>
            <strong>{title}</strong> for gene/sequence in strain{' '}
            <strong style={{ color: 'red' }}>
              {strain}: {seqname}
            </strong>
            <p></p>
          </span>
        </div>
      );
    }

    var pieces = param['sequence_id'].split('_');

    if (pieces.length == 5) {
      var gene = pieces[0];
      var strainName = pieces[1];
      var up = pieces[2];
      var down = pieces[3];
      var rev = pieces[4];

      var text = ' for gene/sequence in strain ';

      var updownText = '';
      if (up > 0 && down > 0) {
        updownText +=
          ' plus ' +
          up +
          ' basepair(s) of upstream sequence and ' +
          down +
          ' basepair(s) of downstream sequence.';
      } else if (up > 0) {
        updownText += ' plus ' + up + ' basepair(s) of upstream sequence.';
      } else if (down > 0) {
        updownText += ' plus ' + down + ' basepair(s) of downstream sequence.';
      }

      var revText = '';
      if (rev == 1) {
        revText =
          'You have selected the reverse complement of this gene/sequence.';
      }

      return (
        <div>
          <span style={style.textFont}>
            <strong>{title}</strong> {text}{' '}
            <strong style={{ color: 'red' }}>
              {strainName}: {gene}
            </strong>
            <strong>{updownText}</strong>
          </span>
          <p></p>
          <p style={{ fontSize: 18, color: 'red' }}>{revText}</p>
        </div>
      );
    } else if (pieces.length == 4) {
      var chr = pieces[0];
      var start = pieces[1];
      var end = pieces[2];
      var rev = pieces[3];

      var revText = '';
      if (rev == 1) {
        revText =
          'You have selected the reverse complement of this sequence region.';
      }

      return (
        <div>
          <span style={style.textFont}>
            <strong>{title}</strong> for{' '}
            <strong style={{ color: 'red' }}>
              Chromosome {chr} coordinates {start} to {end}
            </strong>
          </span>
          <p></p>
          <p style={{ fontSize: 18, color: 'red' }}>{revText}</p>
        </div>
      );
    } else {
      return (
        <div>
          <span style={style.textFont}>
            <strong>{title}</strong> for the raw DNA sequence.
          </span>
        </div>
      );
    }
  },
});

module.exports = GeneSequenceResources;
