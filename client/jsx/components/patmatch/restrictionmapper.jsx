import React from 'react';
import _ from 'underscore';
import $ from 'jquery';

const DataTable = require('../widgets/data_table.jsx');
const Params = require('../mixins/parse_url_params.jsx');
const RestBarChart = require('./restmap_bar_chart.jsx');
import createReactClass from 'create-react-class';

const style = {
  textFontRed: { fontSize: 18, color: 'red' },
  textFont: { fontSize: 18 },
};

const MAX_NUM_ENZYME = 15;

const restUrl = '/run_restmapper';

const RestrictionMapper = createReactClass({
  displayName: 'RestrictionMapper',

  getInitialState() {
    var param = Params.getParams();
    if (param['seqname']) {
      param['gene'] = param['seqname'];
    }
    return {
      isComplete: false,
      isPending: false,
      userError: null,
      gene: '',
      seq: '',
      resultData: {},
      notFound: null,
      type: 'all',
      param: param,
    };
  },

  render() {
    var page_to_display = this.getPage();

    return (
      <div>
        <span style={{ textAlign: 'center' }}>
          <h1>
            Restriction Site Mapper
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://sites.google.com/view/yeastgenome-help/analyze-help/restriction-mapper?authuser=0"
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
    if (param['gene']) {
      this.runRestTools('gene', param['gene']);
    } else if (
      param['seq_id'] &&
      window.localStorage.getItem(param['seq_id'])
    ) {
      this.runRestTools('seq', window.localStorage.getItem(param['seq_id']));
    }
  },

  getPage() {
    var param = this.state.param;
    var seq_id = param['seq_id'];
    var seq = '';
    if (seq_id) {
      seq = window.localStorage.getItem(seq_id);
    }

    if (param['gene'] && seq) {
      return (
        <div>
          <span style={style.textFont}>
            Enter either a gene name or a DNA sequence.
          </span>
        </div>
      );
    }

    if (this.state.isComplete) {
      var data = this.state.resultData;

      var cuts = data['data'];
      var seqLength = data['seqLength'];

      if (seqLength == 0 || typeof seqLength == 'undefined') {
        var message = '';
        if (param['gene']) {
          message = 'Please enter a single valid gene name.';
        } else {
          message = 'Please enter a valid DNA sequence.';
        }
        return (
          <div>
            <span style={style.textFont}>{message}</span>
          </div>
        );
      }

      var notCutEnzymeTable = '';
      var downloadLink = '';
      if (
        param['type'] == 'all' ||
        param['type'] == 'enzymes that do not cut'
      ) {
        notCutEnzymeTable = this.getNotCutEnzymeTable(data['notCutEnzyme']);
        if (param['type'] == 'all') {
          downloadLink = this.getDownloadLinks(
            data['downloadUrl'],
            data['downloadUrl4notCutEnzyme']
          );
        } else {
          downloadLink = this.getDownloadLinks(
            '',
            data['downloadUrl4notCutEnzyme']
          );
        }
      } else {
        downloadLink = this.getDownloadLinks(data['downloadUrl'], '');
      }

      var desc = this.getDesc(data['seqName'], seqLength, data['chrCoords']);

      if (param['type'] == 'enzymes that do not cut') {
        return (
          <div>
            <div className="row">
              <p dangerouslySetInnerHTML={{ __html: desc }} />
              <p dangerouslySetInnerHTML={{ __html: downloadLink }} />
              <p>{notCutEnzymeTable}</p>
              <p dangerouslySetInnerHTML={{ __html: downloadLink }} />
            </div>
          </div>
        );
      }

      var graphNode = <RestBarChart data={cuts} seqLength={seqLength} />;

      var graphStyle = {
        width: '1000px',
        marginLeft: 'auto',
        marginRight: 'auto',
      };

      return (
        <div>
          <div className="row">
            <p dangerouslySetInnerHTML={{ __html: desc }} />
            <p dangerouslySetInnerHTML={{ __html: downloadLink }} />
            <div>
              <table style={graphStyle}>
                <tbody>
                  <tr>
                    <td>{graphNode}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>{notCutEnzymeTable}</p>
            <p dangerouslySetInnerHTML={{ __html: downloadLink }} />
          </div>
        </div>
      );
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
      if (param['gene'] || seq) {
        return <p>Please wait while we retrieve the requested information.</p>;
      }

      return this.getFrontPage();
    }
  },

  getFrontPage() {
    var geneNode = this.getGeneNode();
    var seqNode = this.getSeqNode();
    var enzymeNode = this.getEnzymeNode();
    var submitNode = this.getSubmitNode();

    var searchSection = {
      headers: [
        [
          <span style={style.textFont} key={0}>
            <strong>Step 1: Enter a Gene Name</strong>
          </span>,
          <span style={style.textFontRed} key={1}>
            <strong>OR</strong>
          </span>,
          <span style={style.textFont} key={2}>
            <strong>Type or Paste a DNA Sequence</strong>
          </span>,
        ],
      ],
      rows: [
        [geneNode, '', seqNode],
        [enzymeNode, '', submitNode],
      ],
    };

    return (
      <div>
        <div>
          <span style={style.textFont}>
            This form allows you to perform restriction site analysis by
            entering a gene name (note: the S288C genomic sequence of the gene
            will be used), or by pasting in a DNA sequence. For alternate
            strains, non-gene features, and/or specific chromosomal coordinates,
            please use our{' '}
            <a href="/seqTools" target="gsr_win">
              Gene/Sequence Resources
            </a>{' '}
            tool, selecting the <strong>Restriction Site Mapper</strong> link
            from the GSR results page.
          </span>
        </div>
        <p></p>
        <div className="row">
          <div className="large-12 columns">
            <form onSubmit={this.onSubmit} target="restmap_infowin">
              <DataTable data={searchSection} />
            </form>
          </div>
        </div>
      </div>
    );
  },

  getGeneNode() {
    // return (<div style={{ textAlign: "top" }}>
    //	<p>Enter a single standard gene name (or ORF or SGDID);<br/>
    //	   for non-gene features (such as RNAs, CENs or ARSs)<br/>
    //	   use the GSR tool as described above. Example: SIR2,<br/>
    //	   YHR023W, or SGD:S000000001.
    //	<input type='text' name='gene' ref='gene' onChange={this._onChange}  size='50'></input>
    //	</p>
    // </div>);

    return (
      <div style={{ textAlign: 'top' }}>
        <p>
          Enter a single standard gene name (or ORF or SGDID); for non-gene
          features (such as RNAs, CENs or ARSs) use the GSR tool as described
          above. <br />
          Example: SIR2, YHR023W, or SGD:S000000001.
        </p>
        <input
          type="text"
          name="gene"
          ref={(gene) => (this.gene = gene)}
          onChange={this._onChange}
          size="50"
        ></input>
      </div>
    );
  },

  getSeqNode() {
    var param = this.state.param;

    var seqID = param['sequence_id'];
    if (seqID) {
      seqID = seqID.replace('%28', '(');
      seqID = seqID.replace('%29', ')');
    }
    var sequence = '';
    if (seqID) {
      sequence = window.localStorage.getItem(seqID);
    }
    var min = 1;
    var max = 10000;
    var localSeqID = min + Math.random() * (max - min);

    //  <textarea ref='seq' name='seq' value={sequence} onChange={this.onChange} rows='5' cols='75'></textarea>

    if (sequence) {
      return (
        <div>
          <textarea
            ref={(seq) => (this.seq = seq)}
            value={sequence}
            onChange={this.onChange}
            rows="5"
            cols="200"
          ></textarea>
          <input
            type="hidden"
            name="seq_id"
            ref={(seq_id) => (this.seq_id = seq_id)}
            value={localSeqID}
          ></input>
          Only DNA sequences containing A, G, C, and T are allowed. Any other
          characters will be removed automatically before analysis.
        </div>
      );
    } else {
      return (
        <div>
          <textarea
            ref={(seq) => (this.seq = seq)}
            onChange={this.onChange}
            rows="5"
            cols="75"
          ></textarea>
          <input
            type="hidden"
            name="seq_id"
            ref={(seq_id) => (this.seq_id = seq_id)}
            value={localSeqID}
          ></input>
          <p>
            Only DNA sequences containing A, G, C, and T are allowed. Any other
            characters will be removed automatically before analysis.
          </p>
        </div>
      );
    }
  },

  getEnzymeNode() {
    var enzymes = [
      'all',
      "3'overhang",
      "5'overhang",
      'blunt end',
      'cut once',
      'cut twice',
      'Six-base cutters',
      'enzymes that do not cut',
    ];

    var _elements = _.map(enzymes, (e) => {
      return <option value={e}>{e}</option>;
    });

    return (
      <div>
        <span style={style.textFont}>
          <strong>Step 2: Choose Restriction Enzyme Set: </strong>
        </span>
        <p>
          <select
            ref={(type) => (this.type = type)}
            name="type"
            value={this.state.type}
            onChange={this.onTypeChange}
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  },

  getSubmitNode: function () {
    return (
      <div>
        <p>
          <input
            type="submit"
            value="Display Result"
            className="button secondary"
          ></input>
          <input
            type="reset"
            value="Reset Form"
            className="button secondary"
          ></input>
        </p>
      </div>
    );
  },

  getNotCutEnzymeTable(notCutEnzymes) {
    var tableRows = [];
    var cells = [];
    var headers = [];
    var headerDone = 0;
    var i = 0;
    _.map(notCutEnzymes, (e) => {
      if (i == MAX_NUM_ENZYME) {
        tableRows.push(cells);
        cells = [];
        i = 0;
        headerDone = 1;
      }
      cells.push(e);
      if (headerDone == 0) {
        headers.push('');
      }
      i = i + 1;
    });

    if (i != 0) {
      for (var j = i; j < MAX_NUM_ENZYME; j++) {
        cells.push(' ');
      }
      tableRows.push(cells);
    }

    var notCutTable = { headers: [headers], rows: tableRows };

    return (
      <div>
        <center>
          <span style={style.textFont}>
            <strong>Enzymes that do not cut: </strong>
          </span>
          <DataTable data={notCutTable} />
        </center>
      </div>
    );
  },

  onChange(e) {
    this.setState({ text: e.target.value });
  },

  onTypeChange(e) {
    this.setState({ type: e.target.value });
  },

  onSubmit(e) {
    var seq_id = this.seq_id.value.trim();
    var seq = this.seq.value.trim();
    seq = seq.replace(/%0D/g, '');
    seq = seq.replace(/%0A/g, '');
    seq = seq.toUpperCase().replace(/[^ATCG]/g, '');
    if (seq) {
      window.localStorage.setItem(seq_id, seq);
    }
  },

  runRestTools(searchType, value) {
    var paramData = {};
    var param = this.state.param;
    paramData['type'] = param['type'];
    var seq_id = param['seq_id'];

    if (searchType == 'gene') {
      var gene = value;
      gene = gene.replace('SGD:', '');
      gene = gene.replace('SGD%3A', '');
      paramData['name'] = gene;
      this.sendRequest(paramData);
      if (!seq_id) {
        window.localStorage.clear();
      }
      return;
    }

    if (searchType == 'seq') {
      // var seq = param['seq'];
      // seq = seq.replace(/%0D/g, '');
      // seq = seq.replace(/%0A/g, '');
      // seq = seq.toUpperCase().replace(/[^ATCG]/g, '');
      paramData['seq'] = value;
      this.sendRequest(paramData);
      window.localStorage.clear();
      return;
    }
  },

  sendRequest(paramData) {
    $.ajax({
      url: restUrl,
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

  getDownloadLinks(url, url4notCutEnzyme) {
    var links = '';
    if (url && url4notCutEnzyme) {
      links =
        "<a href='" +
        url +
        "' target='dl_win'>Download Restriction Site Results</a> | <a href='" +
        url4notCutEnzyme +
        "' target='dl_win'>Download 'Do Not Cut' Enzyme List</a>";
    } else if (url4notCutEnzyme) {
      links =
        "<a href='" +
        url4notCutEnzyme +
        "' target='dl_win'>Download 'Do Not Cut' Enzyme List</a>";
    } else {
      links =
        "<a href='" +
        url +
        "' target='dl_win'>Download Restriction Site Results</a>";
    }
    return '<center><h3>' + links + '</h3></center>';
  },

  getDesc(seqName, seqLength, chrCoords) {
    if (seqName == 'null' || seqName == '') {
      return (
        '<center><h3>The unnamed sequence (sequence length: ' +
        seqLength +
        ')</h3></center>'
      );
    } else {
      return (
        "<center><h3>The genomic sequence for <font color='red'>" +
        seqName +
        '</font>, ' +
        chrCoords +
        ' (sequence length: ' +
        seqLength +
        ')</h3></center>'
      );
    }
  },
});

module.exports = RestrictionMapper;
