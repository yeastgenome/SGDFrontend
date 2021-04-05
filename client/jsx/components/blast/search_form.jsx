var React = require('react');
var _ = require('underscore');
var $ = require('jquery');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

var RadioSelector = require('./radio_selector.jsx');
var BlastBarChart = require('./blast_bar_chart.jsx');
var Params = require('../mixins/parse_url_params.jsx');

var BLAST_URL = '/run_blast';

var SearchForm = createReactClass({
  displayName: 'SearchForm',

  propTypes: {
    blastType: PropTypes.any,
  },

  getDefaultProps: function () {
    return {
      blastType: '',
    };
  },

  getInitialState: function () {
    var param = Params.getParams();

    var submitted = '';
    if (param['program']) {
      submitted = 1;
    } else {
      this._getConfigData(this.props.blastType);
      if (param['name']) {
        this._getSeq(param['name'], param['type']);
      }
    }

    var defaultProgram = 'blastn';
    if (param['type'] == 'protein') {
      defaultProgram = 'blastp';
    }

    var defaultAlignToShow = '50';
    if (this.props.blastType == 'fungal') {
      defaultAlignToShow = '500';
    }

    // need to put the date in a config file..
    var lastUpdate = 'January 13, 2015';
    return {
      isComplete: false,
      isPending: false,
      userError: null,
      lastUpdate: lastUpdate,
      seqType: param['type'],
      queryComment: param['name'],
      seqData: {},
      configData: {},
      sequence: null,
      uploadedSeq: null,
      uploadFile: null,
      program: defaultProgram,
      database: [],
      outFormat: 'gapped alignments',
      matrix: 'BLOSUM62',
      cutoffScore: '0.01',
      wordLength: 'default',
      threshold: 'default',
      alignToShow: defaultAlignToShow,
      filtering: null,
      filter: null,
      resultData: {},
      submitted: submitted,
      param: param,
      didBlast: 0,
      selectedDatabase: [],
    };
  },

  render: function () {
    var formNode = this._getFormNode();

    if (this.props.blastType == 'sgd') {
      return (
        <div>
          <span style={{ textAlign: 'center' }}>
            <h1>
              <i>S. cerevisiae</i> NCBI-BLAST Search{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://sites.google.com/view/yeastgenome-help/sequence-help/blast"
              >
                <img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img>
              </a>
            </h1>
            <hr />
          </span>
          {formNode}
        </div>
      );
    } else {
      return (
        <div>
          <span style={{ textAlign: 'center' }}>
            <h1>
              Fungal Genomes Search using NCBI-BLAST{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://sites.google.com/view/yeastgenome-help/sequence-help/fungal-blast"
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
  },

  componentDidMount: function () {
    if (this.state.submitted) {
      this._doBlast();
    } else {
      this._setDefaultDatabase(this.state.configData);
    }
  },

  _getFormNode: function () {
    if (this.state.isComplete) {
      if (this.state.resultData.hits == '') {
        var errorReport = this.state.resultData.result;
        // return (<div dangerouslySetInnerHTML={{ __html: this.state.resultData.result}} />);
        // return (<div><p>{resultData.result}</p></div>);
        return <div dangerouslySetInnerHTML={{ __html: errorReport }} />;
      }

      var descText =
        "<p>Query performed by the Saccharomyces Genome Database; for full BLAST options and parameters, refer to the NCBI BLAST Documentation Links to GenBank, EMBL, PIR, SwissProt, and SGD are shown in bold type; links to locations within this document are in normal type. Your comments and suggestions are requested: <a href='/suggestion'>Send a Message to SGD</a></p><hr>";
      if (this.state.filter) {
        descText =
          descText +
          '<p><b>***Please Note Sequence Filtering is ON.***</b> Sequence filtering will mask out regions of low compositional complexity from your query sequence. Filtering can eliminate statistically significant but biologically uninteresting reports from the BLAST output. Low complexity regions found by a filter program are substituted using the letter "N" in nucleotide sequence (e.g., "NNNNN") and the letter "X" in protein sequences (e.g., "XXXXX"). In the BLAST output, filtered regions are shown in the query sequence as lower-case letters. Filtering is on by default, however it can be turned off by selecting "Off" from the Filter options on the BLAST form.</p><p>For more details on filtering see the <a href="http://blast.ncbi.nlm.nih.gov/blast_help.shtml">\
BLAST Help at NCBI</a>.</p><hr>';
      }

      var graph = this._getGraphNode(this.state.resultData.hits);
      var tableStyle = {
        width: '900px',
        marginLeft: 'auto',
        marginRight: 'auto',
      };

      var showHits = this.state.resultData.showHits;
      var totalHits = this.state.resultData.totalHits;

      var hitSummary = 'All hits shown';
      var hitSummary2 = '';

      if (Number(showHits) < Number(totalHits)) {
        hitSummary = 'The graph shows the highest hits per range';
        hitSummary2 =
          'Data has been omitted: ' +
          showHits +
          '/' +
          totalHits +
          ' hits displayed';
      }

      return (
        <div>
          <span style={{ textAlign: 'center' }}>
            <h3>{hitSummary}</h3>
          </span>
          <span style={{ textAlign: 'center' }}>
            <h3>{hitSummary2}</h3>
          </span>
          <div>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td>{graph}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div dangerouslySetInnerHTML={{ __html: descText }} />
          <div
            dangerouslySetInnerHTML={{
              __html: this.state.resultData.result,
            }}
          />
        </div>
      );
    } else if (this.state.isPending) {
      return (
        <div>
          <div className="row">
            <p>
              <b>Something went wrong with your BLAST search</b>
            </p>
          </div>
        </div>
      );
    } else {
      if (this.state.submitted) {
        return <p>Please wait... The search may take a while to run.</p>;
      }

      var seqData = this.state.seqData;
      var configData = this.state.configData;

      var seq = '';

      var param = this.state.param;
      if (param['sequence_id']) {
        var seqID = param['sequence_id'];
        seq = window.localStorage.getItem(seqID);
      } else {
        seq = seqData.seq;
      }

      var commentBoxNode = this._getCommentBoxNode();
      var submitNode = this._getSubmitNode();
      var seqBoxNode = this._getSeqBoxNode(seq);
      var blastProgramNode = this._getBlastProgramNode(configData);
      var databaseNode = this._getDatabaseNode(configData);
      var optionNode = this._getOptionsNode(configData);
      // need to put the date in a config file
      descText =
        "<p>Datasets updated: April 15, 2021</p><p>This form allows BLAST searches of S. cerevisiae sequence datasets. To search multiple fungal sequences, go to the <a href='/blast-fungal'>Fungal BLAST search form</a>.</p>";

      if (this.props.blastType == 'fungal') {
        descText =
          "<p>This form allows BLAST searches of multiple fungal sequence datasets. To restrict your search to S. cerevisiae with additional BLAST search options, go to the <a href='/blast-sgd'><i>S. cerevisiae</i> BLAST search form</a>.</p>";
      }

      return (
        <div>
          <div dangerouslySetInnerHTML={{ __html: descText }} />
          <form onSubmit={this._onSubmit} target="blast_result_win">
            <div className="row">
              <div className="large-12 columns">
                {commentBoxNode}
                {submitNode}
                {seqBoxNode}
                {blastProgramNode}
                {databaseNode}
                {submitNode}
                {optionNode}
              </div>
            </div>
          </form>
        </div>
      );
    }
  },

  _getGraphNode: function (data) {
    var legendColor = [
      { text: '< 10', color: '#0000FF' },
      { text: '10-50', color: '#00FFFF' },
      { text: '50-100', color: '#7FFF00' },
      { text: '100-200', color: '#8A2BE2' },
      { text: '> 200', color: '#DC143C' },
    ];

    var _labelRatio = 0.1;
    var _colorScale = (d) => {
      if (d.exp < -200) {
        return legendColor[4].color;
      } else if (d.exp < -100) {
        return legendColor[3].color;
      } else if (d.exp < -50) {
        return legendColor[2].color;
      } else if (d.exp < -10) {
        return legendColor[1].color;
      } else {
        return legendColor[0].color;
      }
    };

    var _maxY = data[0].query_length;
    var _left = 50;
    var _size = data.length;
    var _totalHits = this.state.resultData.totalHits;
    var barNode = (
      <BlastBarChart
        data={data}
        size={_size}
        maxY={_maxY}
        left={_left}
        yValue={function (d) {
          return d.value;
        }}
        start={function (d) {
          return d.start;
        }}
        labelValue={function (d) {
          return d.name;
        }}
        labelRatio={_labelRatio}
        colorScale={_colorScale}
        hasTooltip={true}
        hasYaxis={false}
        hasNoZeroWidth={true}
        legendColor={legendColor}
        totalHits={_totalHits}
      />
    );

    return barNode;
  },

  _getCommentBoxNode: function () {
    return (
      <div>
        <h3>Query Comment (optional, will be added to output for your use):</h3>

        <input
          type="text"
          ref={(queryComment) => (this.queryComment = queryComment)}
          onChange={this._onChange}
          value={this.state.queryComment}
          size="50"
        ></input>
        <p></p>
      </div>
    );
  },

  _getSubmitNode: function () {
    return (
      <div>
        <p>
          <input
            type="submit"
            value="Run NCBI-BLAST"
            className="button secondary"
          ></input>{' '}
          OR{' '}
          <input
            type="reset"
            value="Select Defaults"
            className="button secondary"
          ></input>
        </p>
      </div>
    );
  },

  _getSeqBoxNode: function (seq) {
    return (
      <div>
        {this._submitNode}
        <h3>
          Upload Local TEXT File: FASTA, GCG, and RAW sequence formats are okay
        </h3>
        WORD Documents do not work unless saved as TEXT.
        <input
          className="btn btn-default btn-file"
          type="file"
          name="uploadFile"
          onChange={this._handleFile}
          accept="image/*;capture=camera"
        />
        <h3>
          Type or Paste a Query Sequence : (FASTA or RAW format, or No Comments,
          Numbers are okay)
        </h3>
        <textarea
          ref={(sequence) => (this.sequence = sequence)}
          onChange={this._onChange}
          value={seq}
          rows="5"
          cols="50"
        ></textarea>
        <p></p>
      </div>
    );
  },

  _getBlastProgramNode: function (data) {
    var _elements = _.map(data.program, (p, index) => {
      return (
        <option value={p.script} key={index}>
          {p.label}
        </option>
      );
    });

    return (
      <div>
        <h3>Choose the Appropriate BLAST Program:</h3>

        <p>
          <select
            ref={(program) => (this.program = program)}
            name="program"
            value={this.state.program}
            onChange={this._onProgramChange}
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  },

  _setDefaultDatabase: function (data) {
    var database = data.database;
    var datagroup = data.datagroup;
    var _databaseDef = data.databasedef;
    var param = this.state.param;
    if (param['type'] == 'protein') {
      _databaseDef = data.databasedef4protein;
    }

    var defaultDatabase = [];
    _.map(database, (d) => {
      var dataset = d.dataset;
      if (dataset.match(/^label/)) {
        dataset = datagroup[dataset];
      }
      if ($.inArray(dataset, _databaseDef) > -1) {
        defaultDatabase.push(dataset);
      }
    });
    this.setState({ database: defaultDatabase });
  },

  _getDatabaseNode: function (data) {
    var database = data.database;
    var datagroup = data.datagroup;
    var _databaseDef = data.databasedef;

    var param = this.state.param;
    if (param['type'] == 'protein') {
      _databaseDef = data.databasedef4protein;
    }

    var i = 0;
    const selectedValue = [];
    var _elements = _.map(database, (d, index) => {
      i += 1;
      var dataset = d.dataset;
      if (dataset.match(/^label/)) {
        dataset = datagroup[dataset];
      }

      if (this.state.selectedDatabase.length == 0) {
        if ($.inArray(dataset, _databaseDef) > -1) {
          selectedValue.push(dataset);
        }
      } else {
        selectedValue.push(...this.state.selectedDatabase);
      }

      return (
        <option value={dataset} key={index} onClick={this.handleDatabaseSelect}>
          {d.label}
        </option>
      );
    });
    // value={this.state.database}
    return (
      <div>
        <h3>Choose one or more Sequence Datasets:</h3>
        Select or unselect multiple datasets by pressing the Control (PC) or
        Command (Mac) key while clicking. Selecting a category label selects all
        datasets in that category.
        <p>
          <select
            ref={(database) => (this.database = database)}
            id="database"
            onChange={this._onDatabaseChange}
            size={i}
            value={selectedValue}
            multiple={true}
          >
            {_elements}
          </select>
        </p>
      </div>
    );
  },

  handleDatabaseSelect(e) {
    let newValue = e.target.value.split(',');
    let allSelectedValues = [...this.state.selectedDatabase, ...newValue];
    let filteredArray = [];
    allSelectedValues.forEach((value) => {
      if (filteredArray.includes(value)) {
        filteredArray.splice(filteredArray.indexOf(value), 1);
      } else {
        filteredArray.push(value);
      }
    });
    this.setState({ selectedDatabase: filteredArray });
  },

  _getOptionsNode: function (data) {
    var outFormatMenu = this._getOutFormatMenu();
    var matrixMenu = this._getMatrixMenu(data);
    var cutoffMenu = this._getCutoffScoreMenu();
    var wordLengthMenu = this._getWordLengthMenu();
    var thresholdMenu = this._getThresholdMenu();
    var alignToShowMenu = this._getAlignToShowMenu();
    var filterMenu = this._getFilterMenu();

    return (
      <div>
        <b>Options:</b> For descriptions of BLAST options and parameters, refer
        to the BLAST documentation at NCBI.
        <br />
        <div className="col-lg-4 col-lg-offset-4">
          <table width="100%">
            <tbody>
              <tr>
                <th>Output format:</th>
                <td>{outFormatMenu}</td>
                <td>
                  <br />
                </td>
              </tr>
              <tr>
                <th>Comparison Matrix:</th>
                <td>{matrixMenu}</td>
                <td>
                  <br />
                </td>
              </tr>
              <tr>
                <th>Cutoff Score (E value):</th>
                <td>{cutoffMenu}</td>
                <td>
                  <br />
                </td>
              </tr>
              <tr>
                <th>Word Length (W value):</th>
                <td>{wordLengthMenu}</td>
                <td>Default = 11 for BLASTN, 3 for all others</td>
              </tr>
              <tr>
                <th>Expect threshold (E threshold):</th>
                <td>{thresholdMenu}</td>
                <td>
                  <br />
                </td>
              </tr>
              <tr>
                <th>Number of best alignments to show:</th>
                <td>{alignToShowMenu}</td>
                <td>
                  <br />
                </td>
              </tr>
              <tr>
                <th>Filter options:</th>
                <td>{filterMenu}</td>
                <td>DUST file for BLASTN, SEG filter for all others</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  _getOutFormatMenu: function () {
    var format = ['gapped alignments', 'ungapped alignments'];
    var _elements = [];
    format.forEach(function (f, index) {
      _elements.push(
        <option value={f} key={index}>
          {f}
        </option>
      );
    });

    return (
      <p>
        <select
          ref={(outFormat) => (this.outFormat = outFormat)}
          value={this.state.outFormat}
          onChange={this._onOutFormatChange}
        >
          {_elements}
        </select>
      </p>
    );
  },

  _getMatrixMenu: function (data) {
    if (!data.matrix) return null;
    var matrix = data.matrix;
    var _elements = this._getDropdownList(matrix);
    return (
      <p>
        <select
          ref={(matrix) => (this.matrix = matrix)}
          value={this.state.matrix}
          onChange={this._onMatrixChange}
        >
          {_elements}
        </select>
      </p>
    );
  },

  _getCutoffScoreMenu: function () {
    var cutoffScore = ['10', '1', '0.1', '0.01', '0.001', '0.0001', '0.00001'];
    var _elements = this._getDropdownList(cutoffScore);
    return (
      <p>
        <select
          ref={(cutoffScore) => (this.cutoffScore = cutoffScore)}
          value={this.state.cutoffScore}
          onChange={this._onCutoffScoreChange}
        >
          {_elements}
        </select>
      </p>
    );
  },

  _getWordLengthMenu: function () {
    var wordLength = [
      'default',
      '15',
      '14',
      '13',
      '12',
      '11',
      '10',
      '9',
      '8',
      '7',
      '6',
      '5',
      '4',
      '3',
      '2',
    ];
    var _elements = this._getDropdownList(wordLength);
    return (
      <p>
        <select
          ref={(wordLength) => (this.wordLength = wordLength)}
          value={this.state.wordLength}
          onChange={this._onWordLengthChange}
        >
          {_elements}
        </select>
      </p>
    );
  },

  _getThresholdMenu: function () {
    var threshold = ['default', '0.0001', '0.01', '1', '10', '100', '1000'];
    var _elements = this._getDropdownList(threshold);
    return (
      <p>
        <select
          ref={(threshold) => (this.threshold = threshold)}
          value={this.state.threshold}
          onChange={this._onThresholdChange}
        >
          {_elements}
        </select>
      </p>
    );
  },

  _getAlignToShowMenu: function () {
    var alignToShow = [
      '0',
      '25',
      '50',
      '100',
      '200',
      '400',
      '500',
      '800',
      '1000',
    ];
    alignToShow.unshift(this.state.alignToShow);
    var _elements = this._getDropdownList(alignToShow);
    return (
      <p>
        <select
          ref={(alignToShow) => (this.alignToShow = alignToShow)}
          value={this.state.alignToShow}
          onChange={this._onAlignToShowChange}
        >
          {_elements}
        </select>
      </p>
    );
  },

  _getFilterMenu: function () {
    var _elements = [
      { name: 'On', key: 'On' },
      { name: 'Off', key: 'Off' },
    ];
    return (
      <RadioSelector
        name="filter"
        elements={_elements}
        initialActiveElementKey="On"
      />
    );
  },

  _getDropdownList: function (elementList) {
    var _elements = [];
    elementList.forEach(function (m, index) {
      _elements.push(
        <option value={m} key={index}>
          {m}
        </option>
      );
    });
    return _elements;
  },

  _onProgramChange: function (e) {
    this.setState({ program: e.target.value });
  },

  _onOutFormatChange: function (e) {
    this.setState({ outFormat: e.target.value });
  },

  _onMatrixChange: function (e) {
    this.setState({ matrix: e.target.value });
  },

  _onCutoffScoreChange: function (e) {
    this.setState({ cutoffScore: e.target.value });
  },

  _onWordLengthChange: function (e) {
    this.setState({ wordLength: e.target.value });
  },

  _onThresholdChange: function (e) {
    this.setState({ threshold: e.target.value });
  },

  _onAlignToShowChange: function (e) {
    this.setState({ alignToShow: e.target.value });
  },

  _onDatabaseChange: function (e) {
    this.setState({ database: e.target.value });
  },

  _onChange: function (e) {
    this.setState({ text: e.target.value });
  },

  _getSeq: function (name, type) {
    var jsonUrl = BLAST_URL + '?name=' + name;
    if (type == 'protein' || type == 'pep') {
      jsonUrl = jsonUrl + '&type=' + type;
    }
    $.ajax({
      url: jsonUrl,
      dataType: 'json',
      success: function (data) {
        this.setState({ seqData: data });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(jsonUrl, status, err.toString());
      }.bind(this),
    });
  },

  _getConfigData: function (db) {
    var jsonUrl = BLAST_URL + '?conf=';
    if (db == 'sgd') {
      jsonUrl = jsonUrl + 'blast-sgd';
    } else {
      jsonUrl = jsonUrl + 'blast-fungal';
    }
    $.ajax({
      url: jsonUrl,
      dataType: 'json',
      success: function (data) {
        this.setState({ configData: data });
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(jsonUrl, status, err.toString());
      }.bind(this),
    });
  },

  _onSubmit: function (e) {
    var seq = this.sequence.value.trim();
    if (seq == '') {
      seq = this.state.uploadedSeq;
    }
    var program = this.program.value.trim();
    var dbs = document.getElementById('database');
    var database = '';
    for (var i = 0; i < dbs.options.length; i++) {
      if (dbs.options[i].selected) {
        if (database) {
          database = database + ' ' + dbs.options[i].value;
        } else {
          database = dbs.options[i].value;
        }
      }
    }
    var outFormat = this.outFormat.value;
    var matrix = this.matrix.value;
    var cutoffScore = this.cutoffScore.value;
    var wordLength = this.wordLength.value;
    var threshold = this.threshold.value;
    var alignToShow = this.alignToShow.value;
    var filter = 'on';
    if (document.getElementById('Off').checked) {
      filter = '';
    }
    seq = this._cleanUpSeq(seq);

    var newDatabase = this._checkParameters(
      seq,
      program,
      database,
      wordLength,
      cutoffScore
    );

    if (newDatabase) {
      database = newDatabase;
      // window.localStorage.clear();
      window.localStorage.setItem('seq', seq);
      window.localStorage.setItem('program', program);
      window.localStorage.setItem('database', database);
      window.localStorage.setItem('outFormat', outFormat);
      window.localStorage.setItem('matrix', matrix);
      window.localStorage.setItem('cutoffScore', cutoffScore);
      window.localStorage.setItem('wordLength', wordLength);
      window.localStorage.setItem('threshold', threshold);
      window.localStorage.setItem('alignToShow', alignToShow);
      window.localStorage.setItem('filter', filter);
    } else {
      e.preventDefault();
      return 1;
    }
  },

  _doBlast: function () {
    var seq = window.localStorage.getItem('seq');
    var program = window.localStorage.getItem('program');
    var database = window.localStorage.getItem('database');
    var outFormat = window.localStorage.getItem('outFormat');
    var matrix = window.localStorage.getItem('matrix');
    var cutoffScore = window.localStorage.getItem('cutoffScore');
    var wordLength = window.localStorage.getItem('wordLength');
    var threshold = window.localStorage.getItem('threshold');
    var alignToShow = window.localStorage.getItem('alignToShow');
    var filter = window.localStorage.getItem('filter');

    $.ajax({
      url: BLAST_URL,
      data_type: 'json',
      type: 'POST',
      data: {
        seq: seq,
        program: program,
        database: database,
        outFormat: outFormat,
        matrix: matrix,
        threshold: threshold,
        cutoffScore: cutoffScore,
        alignToShow: alignToShow,
        wordLength: wordLength,
        filter: filter,
        blastType: this.props.blastType,
      },
      success: function (data) {
        this.setState({
          isComplete: true,
          resultData: data,
          filter: filter,
        });
      }.bind(this),
      error: function (xhr, status, err) {
        this.setState({ isPending: true });
      }.bind(this),
    });
  },

  _cleanUpSeq: function (seq) {
    seq = seq.replace(/^>.*$/m, '');

    // get rid of anything that is no-alphabet characters
    if (seq) {
      seq = seq.replace(/[^a-zA-Z]/g, '');
    }
    return seq;
  },

  _checkParameters: function (seq, program, database, wordLength, cutoffScore) {
    // check sequence
    // get seq from the box or from upload file and remove unwanted characters
    if (!seq) {
      alert('Please enter a sequence');
      return 0;
    }

    // check database
    if (database == '-') {
      alert('Please select a database.');
      return 0;
    }

    // check sequence length and cutoffScore (s) value
    // if (cutoffScore != 'default' && cutoffScore < 60 && seq.length > 100) {
    //     alert("The maximum sequence length for an S value less than 60 is 100. Please adjust either the S value or sequence");
    //     return 0;
    // }

    // check sequence length and wordlength
    if (
      program == 'blastn' &&
      wordLength != 'default' &&
      wordLength < 11 &&
      seq.length > 10000
    ) {
      alert(
        'The maximum sequence length for a word length of less than 11 is 10000. Please fix either word length or sequence.'
      );
      return 0;
    }

    // check database and program to make sure they match...

    var configData = this.state.configData;
    var programs = configData.program;
    var datasets = configData.database;

    var programType = '';
    _.map(programs, (p) => {
      if (p.script == program) {
        programType = p.type;
      }
    });

    var dbType = {};
    _.map(datasets, (d) => {
      dbType[d.dataset] = d.type;
    });

    database = database.replace(/\,/g, ' ');

    var dblist = database.split(' ');
    var goodDatabase = '';
    var badDatabase = '';
    var good = 0;
    var removed = 0;
    var databaseType = '';
    var foundDB = {};
    dblist.forEach(function (d) {
      if (dbType[d] == 'both' || dbType[d] == programType) {
        if (foundDB[d] == undefined) {
          if (goodDatabase) {
            goodDatabase = goodDatabase + ' ';
          }
          goodDatabase = goodDatabase + d;
          good += 1;
        }
      } else {
        removed += 1;
        badDatabase = badDatabase + ' ' + d;
        databaseType = dbType[d];
      }
      foundDB[d] = 1;
    });

    if (removed >= 1) {
      if (databaseType) {
        if (databaseType == 'dna') {
          databaseType = 'DNA';
        }
        if (programType == 'dna') {
          programType = 'DNA';
        }
        if (removed > 1) {
          badDatabase = badDatabase.replace(/ /g, ', ');
          badDatabase = badDatabase.replace(/^, /, '');
          alert(
            'The following datasets contain ' +
              databaseType +
              ' sequence and thus do not work with ' +
              program.toUpperCase() +
              ', which requires ' +
              programType +
              ' sequences: ' +
              badDatabase +
              '\n\n' +
              'Click OK to see results with these datasets excluded.'
          );
        } else {
          alert(
            'The following dataset contains ' +
              databaseType +
              ' sequence and thus does not work with ' +
              program.toUpperCase() +
              ', which requires ' +
              programType +
              ' sequences: ' +
              badDatabase +
              '\n\n' +
              'Click OK to see results with this dataset excluded.'
          );
        }
      }
      if (!goodDatabase) {
        alert(
          'Your choice of datasets does not include one that is appropriate for ' +
            program +
            '. BLASTP and BLASTX require a protein sequence database and other BLAST programs require a nucleotide sequence database. Adjust either the program or database selection before submitting your search.'
        );
        return 0;
      }
    }

    return goodDatabase;
  },

  _handleFile: function (e) {
    var reader = new FileReader();
    var fileHandle = e.target.files[0];
    reader.onload = function (upload) {
      this.setState({
        uploadedSeq: upload.target.result,
      });
    }.bind(this);
    reader.readAsText(fileHandle);
  },
});

module.exports = SearchForm;
