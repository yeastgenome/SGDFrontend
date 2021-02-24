import React, { Component } from 'react';
import _ from 'underscore';
import $ from 'jquery';

const Checklist = require('../widgets/checklist.jsx');
const Params = require('../mixins/parse_url_params.jsx');
const ExampleTable = require('./example_table.jsx');
const DataTable = require('../widgets/data_table.jsx');
const PatmatchUrl = '/run_patmatch';
const LETTERS_PER_LINE = 60;

class SearchForm extends Component {
  constructor(props) {
    super(props);
    var param = Params.getParams();

    var submitted = null;
    if (param['pattern']) {
      submitted = 1;
    }

    var get_seq = 0;
    if (param['seqname']) {
      get_seq = 1;
    }

    this._getConfigData();

    this.state = {
      isComplete: false,
      isPending: false,
      userError: null,
      configData: {},
      genome: 'S288C',
      seqtype: 'protein',
      dataset: null,
      pattern: null,
      maxHits: null,
      strand: null,
      mismatch: null,
      deletion: null,
      insersion: null,
      substitution: null,
      resultData: {},
      seqname: null,
      beg: null,
      end: null,
      param: param,
      didPatmatch: 0,
      submitted: submitted,
      seqFetched: false,
      getSeq: get_seq,
      hitsNode: '500',
    };

    this._onChange = this._onChange.bind(this);
    this._doPatmatch = this._doPatmatch.bind(this);
  }

  render() {
    var formNode = this._getFormNode();

    if (this.state.getSeq) {
      return <div>{formNode}</div>;
    } else {
      return (
        <div>
          <span style={{ textAlign: 'center' }}>
            <h1>
              Yeast Genome Pattern Matching{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://sites.google.com/view/yeastgenome-help/analyze-help/pattern-matching?authuser=0"
              >
                <img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img>
              </a>
            </h1>
            <hr />
          </span>
          {formNode}
        </div>
      );
    }
  }

  componentDidMount() {
    if (this.state.submitted) {
      this._doPatmatch();
    }
    // if (this.state.getSeq) {
    //      this._getSeq();
    // }
  }

  _getFormNode() {
    if (this.state.getSeq && !this.state.seqFetched) {
      this._getSeq();
      return;
    } else if (this.state.getSeq && this.state.seqFetched) {
      var seqNode = this._getSeqNode();

      return <div dangerouslySetInnerHTML={{ __html: seqNode }} />;
    } else if (this.state.isComplete) {
      // if (this.state.resultData.hits == '') {
      //     var errorReport = this.state.resultData.result;
      //     return (<div dangerouslySetInnerHTML={{ __html: errorReport }} />);
      // }

      var data = this.state.resultData.hits;
      var totalHits = this.state.resultData.totalHits;
      var uniqueHits = this.state.resultData.uniqueHits;
      var downloadUrl = this.state.resultData.downloadUrl;

      if (totalHits == 0) {
        return (
          <div>
            <p>
              No hits found for your pattern. Please modify your pattern and try
              again..
            </p>
          </div>
        );
      }

      var _summaryTable = this._getSummaryTable(totalHits, uniqueHits);
      var _resultTable = this._getResultTable(data, totalHits);

      return (
        <div>
          <center>{_summaryTable}</center>
          <p></p>

          <center>{_resultTable}</center>
          <p></p>

          <center>
            <blockquote style={{ fontFamily: 'Monospace', fontSize: 14 }}>
              <a href={downloadUrl}>Download Full Results</a>
            </blockquote>
          </center>
          <p></p>
        </div>
      );
    } else if (this.state.isPending) {
      return (
        <div>
          <div className="row">
            <p>
              <b>Something wrong with your patmatch search</b>
            </p>
          </div>
        </div>
      );
    } else {
      if (this.state.submitted) {
        return <p>Please wait... The search may take a while to run.</p>;
      }

      var configData = this.state.configData;

      var genomeBoxNode = this._getGenomeBoxNode(configData);
      var seqtypeNode = this._getSeqtypeNode();
      var patternBoxNode = this._getPatternBoxNode();
      var datasetNode = this._getDatasetNode(configData);
      var submitNode = this._getSubmitNode();
      var optionNode = this._getOptionsNode();
      var patternExampleNode = this._getPatternExampleNote();

      // need to put the date in a config file

      var descText =
        "<p>Pattern Matching allows you to search for short (<20 residues) nucleotide or peptide sequences, or ambiguous/degenerate patterns. It uses the same dataset as SGD's BLAST program. If you are searching for a sequence >20 bp or aa with no degenerate positions, please use BLAST, which is much faster. Pattern Matching allows for ambiguous characters, mismatches, insertions and deletions, but does not do alignments and so is not a replacement for <a target='_blank' href='/blast-sgd'>BLAST</a>. Please note, also, that PatMatch will not find overlapping hits.</p><p>Your comments and suggestions are appreciated: <a target='_blank' href='/suggestion'>Send a Message to SGD</a></p>";

      return (
        <div>
          <div dangerouslySetInnerHTML={{ __html: descText }} />
          <form onSubmit={this._onSubmit.bind(this)} target="infowin">
            <div className="row">
              <div className="large-12 columns">
                {genomeBoxNode}
                {seqtypeNode}
                {patternBoxNode}
                {datasetNode}
                {submitNode}
                {optionNode}
                {patternExampleNode}
              </div>
            </div>
          </form>
        </div>
      );
    }
  }

  _getSeqNode() {
    var param = this.state.param;
    var beg = param['beg'];
    var end = param['end'];
    var dataset = param['dataset'];
    var seqname = param['seqname'];
    var seq = this.state.resultData.seq;

    var seqlen = seq.length;
    var seqStart = 0;

    var seqEnd = seqlen;
    if (seqlen > 5000) {
      if (
        Math.ceil(beg / LETTERS_PER_LINE) * LETTERS_PER_LINE >
        LETTERS_PER_LINE * 4
      ) {
        seqStart =
          Math.ceil(beg / LETTERS_PER_LINE) * LETTERS_PER_LINE -
          LETTERS_PER_LINE * 4;
      }
      seqEnd = seqStart + LETTERS_PER_LINE * 9;
      if (seqEnd > seqlen) {
        seqEnd = seqlen;
      }
      seq = seq.substring(seqStart, seqEnd);
    }

    var tenChunked = seq.match(/.{1,10}/g).join(' ');
    var lineArr = tenChunked.match(/.{1,66}/g);
    // var maxLabelLength = ((lineArr.length * LETTERS_PER_LINE + 1).toString().length)
    var maxLabelLength = seqEnd.toString().length + 1;

    lineArr = _.map(lineArr, (line, i) => {
      var lineNum = seqStart + i * LETTERS_PER_LINE + 1;
      var numSpaces = maxLabelLength - lineNum.toString().length;
      var spacesStr = Array(numSpaces + 1).join(' ');

      if (beg >= lineNum && beg <= lineNum + 59) {
        var tmpBeg = beg - lineNum;
        var tmpEnd = end - lineNum;
        if (tmpEnd > 59) {
          tmpEnd = 59;
          beg = lineNum + 60;
        }
        var baseArr = line.split('');
        var k = 0;
        var newLine = '';
        _.map(baseArr, (base, j) => {
          if (k < tmpBeg || k > tmpEnd || base == ' ') {
            newLine += base;
          } else {
            newLine += "<strong style='color:blue;'>" + base + '</strong>';
          }
          if (base != ' ') {
            k++;
          }
        });
        line = newLine;
      }
      return `${spacesStr}${lineNum} ${line}`;
    });

    // var seqNode = _.map(lineArr, (l, i) => {
    //       return <span key={'seq' + i}>{l}<br /></span>;
    // });
    //
    // return (<div>
    //       <blockquote style={{ fontFamily: "Monospace", fontSize: 14 }}>
    //       <pre>
    //       {seqNode}
    //       </pre>
    //       </blockquote>
    //       </div>);

    var seqlines = '';
    _.map(lineArr, (l, i) => {
      seqlines += l + '\n';
    });

    // var spacesStr = Array(maxLabelLength + 1).join(" ");
    if (seqEnd < seqlen) {
      seqlines += ' ..........';
    }
    if (seqStart > 0) {
      seqlines = ' ..........\n' + seqlines;
    }

    var seqSection =
      "<blockquote style={{ fontFamily: 'Monospace', fontSize: 14 }}><pre>" +
      seqlines +
      '</pre></blockquote>';

    var datasetLabel = this._getDatasetLabel(dataset);

    var seqNode =
      '<center><h1>' +
      datasetLabel +
      ' for ' +
      seqname +
      "</h1><h3>The matching region is highlighted in the following retrieved sequence (in <span style='color:blue;'>blue</span>)</h3>" +
      seqSection +
      '</center>';

    return seqNode;
  }

  _getGenomeBoxNode(data) {
    var _elements = _.map(data.genome, (g, index) => {
      return (
        <option value={g.strain} key={index}>
          {g.label}
        </option>
      );
    });
    return (
      <div>
        <h3>Choose a genome to search: </h3>
        <p>
          <select
            ref={(genome) => (this.genome = genome)}
            name="genome"
            onChange={this._onChangeGenome.bind(this)}
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  }

  _getSeqtypeNode() {
    // var param = this.state.param;
    var pattern_type = { peptide: 'protein', nucleotide: 'dna' };
    var _elements = [];
    let index = 0;
    for (var key in pattern_type) {
      _elements.push(
        <option value={pattern_type[key]} key={index}>
          {key}
        </option>
      );
      index = index + 1;
    }

    return (
      <div>
        <h3>Enter a</h3>
        <p>
          <select
            name="seqtype"
            ref={(seqtype) => (this.seqtype = seqtype)}
            onChange={this._onChangeSeqtype.bind(this)}
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  }

  _getPatternBoxNode() {
    var param = this.state.param;
    var pattern = param['seq'];

    return (
      <div>
        <h3>
          sequence or pattern (<a href="#examples">syntax</a>)
        </h3>
        <textarea
          ref={(pattern) => (this.pattern = pattern)}
          value={pattern}
          name="pattern"
          onChange={(e) => this._onChange(e)}
          rows="1"
          cols="50"
        ></textarea>
      </div>
    );
  }

  _getDatasetNode(data) {
    // if( dataset.indexOf('orf_') >= 0 ){
    var _elements = [];
    // let selected = [];
    for (var key in data.dataset) {
      if (key == this.state.genome) {
        var datasets = data.dataset[key];
        for (var i = 0; i < datasets.length; i++) {
          var d = datasets[i];
          if (d.seqtype != this.state.seqtype) {
            continue;
          }
          // if (d.label.indexOf('Coding') >= 0 || d.label.indexOf('Trans') >= 0) {
          //   selected.push(d.dataset_file_name);
          // }
          _elements.push(
            <option value={d.dataset_file_name} key={i}>
              {d.label}
            </option>
          );
        }
      }
    }

    return (
      <div>
        <h3> Choose a Sequence Database (click and hold to see the list):</h3>
        <p>
          <select
            ref={(dataset) => (this.dataset = dataset)}
            name="dataset"
            onChange={this._onChange}
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  }

  _getSubmitNode() {
    return (
      <div>
        <p>
          <input
            type="submit"
            value="START PATTERN SEARCH"
            className="button secondary"
          ></input>{' '}
          OR{' '}
          <input
            type="reset"
            value="RESET FORM"
            className="button secondary"
          ></input>
        </p>
      </div>
    );
  }

  _getOptionsNode() {
    var maximumHitsNode = this._getMaximumHitsNode();
    var strandNode = this._getStrandNote();
    var mismatchNode = this._getMismatchNode();
    var mismatchTypeNode = this._getMismatchTypeNode();

    var descText =
      '<p>PLEASE WAIT FOR EACH REQUEST TO COMPLETE BEFORE SUBMITTING ANOTHER. These searches are done on a single computer at Stanford shared by many other people.</p><hr><h3>More Options:</h3>';

    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: descText }} />
        <br />
        Maximum hits:
        {maximumHitsNode}
        <br />
        If DNA, Strand:
        {strandNode}
        <br />
        Mismatch:
        {mismatchNode}
        {mismatchTypeNode}
      </div>
    );
  }

  _getMaximumHitsNode() {
    var hits = [
      '25',
      '50',
      '100',
      '200',
      '500',
      '1000',
      '2000',
      '5000',
      'no limit',
    ];
    let _elements = this._getDropdownList(hits);
    return (
      <select
        name="max_hits"
        ref={(max_hits) => (this.max_hits = max_hits)}
        onChange={(e) => this._onChange(e, 'hitsNode')}
        value={this.state.hitsNode}
      >
        {_elements}
      </select>
    );
  }

  _getStrandNote() {
    var strands = [
      'Both strands',
      'Strand in dataset',
      'Reverse complement of strand in dataset',
    ];
    let _elements = this._getDropdownList(strands);
    return (
      <select name="strand" ref={(strand) => (this.strand = strand)}>
        {_elements}
      </select>
    );
  }

  _getMismatchNode() {
    var mismatch = ['0', '1', '2', '3'];
    let _elements = this._getDropdownList(mismatch);
    return (
      <select name="mismatch" ref={(mismatch) => (this.mismatch = mismatch)}>
        {_elements}
      </select>
    );
  }

  _getMismatchTypeNode() {
    var _elements = [
      { key: 'insertion', name: 'Insertions' },
      { key: 'deletion', name: 'Deletions' },
      { key: 'substitution', name: 'Substitutions' },
    ];

    var _init_active_keys = ['insertion', 'deletion', 'substitution'];

    return (
      <div>
        <a href="#mismatch_note">
          (more information on use of the Mismatch option)
        </a>
        <Checklist
          elements={_elements}
          initialActiveElementKeys={_init_active_keys}
        />
      </div>
    );
  }

  _getPatternExampleNote() {
    var examples = ExampleTable.examples();

    return (
      <div>
        <a name="examples">
          <h3>Supported Pattern Syntax and Examples:</h3>
        </a>
        {examples}
        <h3>
          <a name="mismatch_note">Limits on the use of the Mismatch option</a>
        </h3>
        <p>
          At this time, the mismatch option (Insertions, Deletions, or
          Substitutions) can only be used in combination with exact patterns
          that do not contain ambiguous peptide or nucleotide characters (e.g. X
          for any amino acid or R for any purine) or regular expressions (e.g. L
          {'3, 5'}X{5}DGO). In addition, the mismatch=3 option can only be used
          for query strings of at least 7 in length.
        </p>
      </div>
    );
  }

  _getDropdownList(elementList) {
    var _elements = [];
    // let selected = '';
    elementList.forEach(function (m, index) {
      // if (m == activeVal) {
      //   selected = m;
      // }
      _elements.push(
        <option value={m} key={index}>
          {m}
        </option>
      );
    });
    return _elements;
  }

  // need to combine these three
  _onChange(e, selectedValue) {
    this.setState({ [selectedValue]: e.target.value });
  }

  _onChangeGenome(e) {
    this.setState({ genome: e.target.value });
  }

  _onChangeSeqtype(e) {
    this.setState({ seqtype: e.target.value });
  }

  _getConfigData() {
    var jsonUrl = PatmatchUrl + '?conf=patmatch.json';
    $.ajax({
      url: jsonUrl,
      dataType: 'json',
      success: (data) => {
        this.setState({ configData: data });
      },
      error: (xhr, status, err) => {
        console.error(jsonUrl, status, err.toString());
      },
    });
  }

  _onSubmit(e) {
    var genome = this.state.genome.trim();
    var seqtype = this.state.seqtype.trim();
    var pattern = this.pattern.value.trim();
    var dataset = this.dataset.value.trim();
    if (pattern) {
      window.localStorage.clear();
      window.localStorage.setItem('genome', genome);
      window.localStorage.setItem('seqtype', seqtype);
      window.localStorage.setItem('pattern', pattern);
      window.localStorage.setItem('dataset', dataset);
    } else {
      e.preventDefault();
      return 1;
    }
  }

  _doPatmatch() {
    var param = this.state.param;

    var genome = param['genome'];
    var seqtype = param['seqtype'];
    if (typeof seqtype == 'undefined' || seqtype == 'protein') {
      seqtype = 'pep';
    }
    var pattern = param['pattern'];
    var dataset = param['dataset'];
    if (typeof dataset == 'undefined') {
      if (seqtype == 'pep') {
        dataset = 'orf_pep';
      } else {
        dataset = 'orf_dna';
      }
    }

    var strand = param['strand'];
    if (typeof strand == 'undefined') {
      strand = 'Both strands';
    }

    if (pattern) {
      window.localStorage.clear();
      window.localStorage.setItem('genome', genome);
      window.localStorage.setItem('seqtype', seqtype);
      window.localStorage.setItem('pattern', pattern);
      window.localStorage.setItem('dataset', dataset);
      window.localStorage.setItem('strand', strand);
    }

    pattern = pattern.replace('%3C', '<');
    pattern = pattern.replace('%3E', '>');

    $.ajax({
      url: PatmatchUrl,
      data_type: 'json',
      type: 'POST',
      data: {
        seqtype: seqtype,
        pattern: pattern,
        dataset: dataset,
        strand: strand,
        max_hits: param['max_hits'],
        mismatch: param['mismatch'],
        insertion: param['insertion'],
        deletion: param['deletion'],
        substitution: param['substitution'],
      },
      success: (data) => {
        this.setState({ isComplete: true, resultData: data });
      },
      error: (xhr, status, err) => {
        this.setState({ isPending: true });
      },
    });
  }

  _getSeq() {
    var param = this.state.param;

    $.ajax({
      url: PatmatchUrl,
      data_type: 'json',
      type: 'POST',
      data: { seqname: param['seqname'], dataset: param['dataset'] },
      success: (data) => {
        this.setState({ seqFetched: true, resultData: data });
      },
      error: (xhr, status, err) => {
        this.setState({ isPending: true });
      },
    });
  }

  _getSummaryTable(totalHits, uniqueHits) {
    var dataset = window.localStorage.getItem('dataset');
    var pattern = window.localStorage.getItem('pattern');
    var seqtype = window.localStorage.getItem('seqtype');
    var strand = window.localStorage.getItem('strand');

    var configData = this.state.configData;
    var seqSearched = 0;
    var datasetDisplayName = '';
    for (var key in configData.dataset) {
      var datasets = configData.dataset[key];
      for (var i = 0; i < datasets.length; i++) {
        var d = datasets[i];
        if (d.dataset_file_name == dataset) {
          seqSearched = d.seqcount;
          datasetDisplayName = d.label.split(' = ')[1];
          break;
        }
      }
    }

    window.localStorage.setItem('dataset_label', datasetDisplayName);

    var _summaryRows = [];

    _summaryRows.push(['Total Hits', totalHits]);
    _summaryRows.push(['Number of Unique Sequence Entries Hit', uniqueHits]);
    _summaryRows.push(['Sequences Searched', seqSearched]);

    pattern = pattern.replace('%3C', '<');
    pattern = pattern.replace('%3E', '>');

    if (seqtype == 'dna' || seqtype.indexOf('nuc') >= 0) {
      _summaryRows.push(['Entered nucleotide pattern', pattern]);
    } else {
      _summaryRows.push(['Entered peptide pattern', pattern]);
    }
    _summaryRows.push(['Dataset', datasetDisplayName]);

    if (seqtype == 'dna' || seqtype.indexOf('nuc') >= 0) {
      _summaryRows.push(['Strand', strand]);
    }

    var _summaryData = { headers: [['', '']], rows: _summaryRows };

    return <DataTable data={_summaryData} />;
  }

  _getResultTable(data, totalHits) {
    var dataset = window.localStorage.getItem('dataset');

    var withDesc = 0;
    if (dataset.indexOf('orf_') >= 0) {
      withDesc = 1;
    }

    var notFeat = 0;
    if (dataset.indexOf('Not') >= 0) {
      notFeat = 1;
    }

    var _tableRows = [];

    _.map(data, (d) => {
      var beg = d.beg;
      var end = d.end;
      if (notFeat == 1) {
        var featStart = d.seqname.split(':')[1].split('-')[0];
        beg = beg - parseInt(featStart) + 1;
        end = end - parseInt(featStart) + 1;
      }
      var seqLink =
        '/nph-patmatch?seqname=' +
        d.seqname +
        '&dataset=' +
        dataset +
        '&beg=' +
        beg +
        '&end=' +
        end;

      if (notFeat == 1) {
        _tableRows.push([
          d.chr,
          d.orfs,
          d.count,
          d.matchingPattern,
          d.beg,
          d.end,
          <span key={0}>
            <a href={seqLink} target="infowin2">
              Sequence
            </a>
          </span>,
        ]);
      } else if (withDesc == 0) {
        _tableRows.push([
          d.seqname,
          d.count,
          d.matchingPattern,
          d.beg,
          d.end,
          <span key={1}>
            <a href={seqLink} target="infowin2">
              Sequence
            </a>
          </span>,
        ]);
      } else {
        var headline = d.desc.split(';')[0];
        var name = d.seqname;
        if (d.gene_name) {
          name = name + '/' + d.gene_name;
        }
        var lspLink = '/locus/' + d.seqname;

        _tableRows.push([
          <span key={2}>
            <a href={lspLink} target="infowin2">
              {name}
            </a>
          </span>,
          d.count,
          d.matchingPattern,
          d.beg,
          d.end,
          <span key={3}>
            <a href={seqLink} target="infowin2">
              Sequence
            </a>
          </span>,
          headline,
        ]);
      }
    });

    var header = [
      'Sequence Name',
      'Hit Number',
      'Matching Pattern',
      'Matching Begin',
      'Matching End',
      'Matching Result',
    ];
    if (withDesc == 1) {
      header = [
        'Sequence Name',
        'Hit Number',
        'Matching Pattern',
        'Matching Begin',
        'Matching End',
        'Matching Result',
        'Locus Information',
      ];
    } else if (notFeat == 1) {
      header = [
        'Chromosome',
        'Between ORF - ORF',
        'Hit Number',
        'Matching Pattern',
        'Matching Begin',
        'Matching End',
        'Matching Result',
      ];
    }

    var _tableData = {
      headers: [header],
      rows: _tableRows,
    };

    var pagination = true;
    if (totalHits <= 10) {
      pagination = false;
    }

    var _dataTableOptions = {
      bPaginate: pagination,
      oLanguage: { sEmptyTable: 'No Hits.' },
    };

    return (
      <DataTable
        data={_tableData}
        usePlugin={true}
        pluginOptions={_dataTableOptions}
      />
    );
  }

  _getDatasetLabel(dataset) {
    var configData = this.state.configData;
    var datasetDisplayName = '';
    var seqtype = '';
    for (var key in configData.dataset) {
      var datasets = configData.dataset[key];
      for (var i = 0; i < datasets.length; i++) {
        var d = datasets[i];
        if (d.dataset_file_name == dataset) {
          seqtype = d.seqtype;
          datasetDisplayName = d.label.split(' = ')[0];
          break;
        }
      }
    }

    if (seqtype == 'dna') {
      seqtype = 'DNA';
    } else {
      seqtype = 'Protein';
    }

    return datasetDisplayName + ' ' + seqtype + ' Sequence';
  }
}

module.exports = SearchForm;
