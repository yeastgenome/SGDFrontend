import React from 'react';
import Radium from 'radium';
import { connect } from 'react-redux';
import t from 'tcomb-form';
import createReactClass from 'create-react-class';
const DataTable = require('../widgets/data_table.jsx');
import PropTypes from 'prop-types';
const PRIMER3URL = '/run_primer3';
const queryString = require('query-string');

const Primer3 = createReactClass({
  displayName: 'Primer3',
  propTypes: {
    queryParams: PropTypes.any,
    history: PropTypes.any,
    // :PropTypes.any,
    // :PropTypes.any,
    // :PropTypes.any,
    // :PropTypes.any,
  },

  getInitialState() {
    return {
      result: null,
      value: DEFAULT_VALUE,
      isLoadPending: false, // loading existing data
      isUpdatePending: false, // sending update to server
      isComplete: false,
      error: null,
    };
  },

  componentDidUpdate(prevProps) {
    if (prevProps.queryParams.results && !this.props.queryParams.results) {
      this.setState({ result: null });
    }
  },

  componentDidMount() {
    if (this.props.queryParams.name) {
      let geneName = this.props.queryParams.name;
      let tempVal = this.state.value;
      tempVal.gene_name = geneName;
      this.setState({ value: tempVal });
    }
    if (this.props.queryParams.sequence_id) {
      var seqId = this.props.queryParams.sequence_id;
      var seq = window.localStorage.getItem(seqId);
      let tempVal = this.state.value;
      tempVal.sequence = seq;
      this.setState({ sequence: seq });
    }
  },

  onChange(value) {
    this.setState({ value });
  },

  resetForm() {
    this.setState({ value: null });
  },

  handleReset(e) {
    e.preventDefault();
    this.setState({
      value: DEFAULT_VALUE,
      result: null,
      error: null,
      gene_name: null,
      sequence: null,
    });
  },

  handleSubmit(e) {
    this.props.history.push('/primer3?result=1');
    e.preventDefault();
    const value = this.primerForm.getValue();
    let strValue = JSON.stringify(value);
    $.ajax({
      url: PRIMER3URL,
      type: 'POST',
      data: strValue,
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      processData: true,
      success: (returnData) => {
        if (returnData.error) {
          this.setState({ error: returnData.error });
        } else {
          this.setState({
            result: returnData.result,
            error: null,
            gene_name: returnData.gene_name,
            sequence: returnData.seq,
            input: returnData.input,
          });
        }
      },
    });
  },

  renderResults() {
    let data = this.state.result; //list of maps
    let gene_name = this.state.gene_name;
    if (gene_name == null) {
      gene_name = 'Input Sequence';
    }
    let gname_str = 'Primer pairs for  :    ' + gene_name;
    //let sequence = 'Input Sequence:   ' + this.state.sequence
    //let newsequence = addNewlines(sequence)
    let input = this.state.input;
    let rowData = [];
    let name, pos, len, size, tm, gc, any_th, end_th, hairpin, seq;
    name = pos = len = size = tm = gc = any_th = end_th = hairpin = seq = ' ';
    let right_count, left_count;
    right_count = left_count = 0;
    const DISPLAY_KEYS = Object.keys(data);
    DISPLAY_KEYS.forEach((d, i) => {
      if (data[d] != null) {
        let val = data[d];
        const DISPLAY_KEYS_1 = Object.keys(val);

        DISPLAY_KEYS_1.forEach((d1, i1) => {
          //for each element in map {another map --> pair,right,left}
          let val1 = val[d1];

          const DISPLAY_KEYS_2 = Object.keys(val1);

          DISPLAY_KEYS_2.forEach((d2, i2) => {
            if (d1 != 'internal') {
              let val2 = val1[d2];
              if (d1 == 'pair') {
                if (d2 == 'product_size') size = val2;
              } else if (d1 == 'right' || d1 == 'left') {
                if (d2 == 'position') {
                  if (input == 'name') {
                    pos = val2 - 1000;
                  } else if (input == 'seq') {
                    pos = val2;
                  }
                }
                if (d2 == 'length') len = val2;
                if (d2 == 'tm') tm = val2.toFixed(2);
                if (d2 == 'gc_percent') gc = val2.toFixed(2);
                if (d2 == 'self_end_th') end_th = val2.toFixed(2);
                if (d2 == 'self_any_th') any_th = val2.toFixed(2);
                if (d2 == 'hairpin_th') hairpin = val2.toFixed(2);
                if (d2 == 'sequence') seq = val2;
              }
            }
          });

          if (d1 == 'right' || d1 == 'left') {
            if (d1 == 'right') {
              name = 'primer-right-' + right_count;
              right_count = getCounter(right_count);
            } else if (d1 == 'left') {
              name = 'primer-left-' + left_count;
              left_count = getCounter(left_count);
            }
            //console.log(name, pos, len, size, tm, gc, any_th, end_th, hairpin, seq)
            rowData.push([
              name,
              pos,
              len,
              size,
              tm,
              gc,
              any_th,
              end_th,
              hairpin,
              seq,
            ]);
          }
        });
      }
    });

    // sort to be in pairs
    rowData = rowData.sort(function (a, b) {
      try {
        let aNum = parseInt(a[0].match(/\d+$/)[0]);
        let bNum = parseInt(b[0].match(/\d+$/)[0]);
        if (aNum < bNum) {
          return -1;
        } else if (aNum > bNum) {
          return 1;
        } else if (aNum === bNum) {
          if (a[0].match('left')) {
            return -1;
          } else if (b[0].match('left')) {
            return 1;
          }
        }
      } catch (error) {
        return 0;
      }
    });
    let _data = {
      headers: [
        [
          'primer',
          'start',
          'len',
          'product size',
          'tm',
          'gc%',
          'any_th',
          'end_th',
          'hairpin',
          'seq',
        ],
      ],
      rows: rowData,
    };
    return (
      <div>
        <h2 style={[style.title]}>{gname_str}</h2>
        <hr />
        <DataTable
          data={_data}
          usePlugin={true}
          pluginOptions={{ aaSorting: [] }}
        />
      </div>
    );
  },

  renderForm() {
    const Endpoint = t.enums.of(['NO', 'YES'], 'Endpoint');

    Endpoint.getTcombFormFactory = (options) => {
      return t.form.Radio;
    };

    const PrimerFormSchema = t.struct({
      gene_name: t.maybe(t.String),
      sequence: t.maybe(t.String),
      input_start: t.Number,
      input_end: t.Number,
      maximum_product_size: t.maybe(t.Number),

      end_point: Endpoint,

      minimum_length: t.Number,
      optimum_primer_length: t.Number,
      maximum_length: t.Number,

      minimum_tm: t.Number,
      optimum_tm: t.Number,
      maximum_tm: t.Number,

      minimum_gc: t.Number,
      optimum_gc: t.Number,
      maximum_gc: t.Number,

      max_self_complementarity: t.Number,
      max_three_prime_self_complementarity: t.Number,
      max_pair_complementarity: t.Number,
      max_three_prime_pair_complementarity: t.Number,
    });

    const formLayout = (locals) => {
      return (
        <div>
          <span style={{ textAlign: 'center' }}>
            <h1>
              Primer Design: Uses{' '}
              <a
                href="https://pypi.org/project/primer3-py/0.5.5/"
                target="_new"
              >
                {' '}
                Primer3-py
              </a>{' '}
              package{' '}
              <a
                href="https://sites.google.com/view/yeastgenome-help/analyze-help/primer-design"
                target="_new"
              >
                <i className="fa primer-help" />{' '}
                <img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img>
              </a>
            </h1>
            <hr />
          </span>
          <span>
            Sequences of{' '}
            <a
              href="http://wiki.yeastgenome.org/index.php/Primer_Set_Sequences"
              target="_new"
            >
              <i className="fa primer-seqs" />
              primer sets{' '}
            </a>{' '}
            available to the community
            <hr />
          </span>
          <span>
            {' '}
            Design your own primers:{' '}
            <a
              href="https://sites.google.com/view/yeastgenome-help/analyze-help/primer-design"
              target="_new"
            >
              <i className="fa primer-help" />{' '}
              <img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img>
            </a>{' '}
          </span>
          <p>
            <b> Please input gene name OR sequence</b>
          </p>
          <div className="row">
            <div className="columns small-4">{locals.inputs.gene_name}</div>
          </div>
          <p>
            <b> OR </b>
          </p>
          <div className="row">
            <div className="columns small-8">{locals.inputs.sequence}</div>
          </div>

          <span>
            <a
              href="http://primer3.ut.ee/primer3web_help.htm#SEQUENCE_TARGET"
              target="_new"
            >
              <i className="fa primer-help" />
              Target Region
            </a>{' '}
          </span>
          <p>
            {' '}
            (NOTE: primers will be chosen from the flanking regions just{' '}
            <b> outside </b> of this defined region){' '}
          </p>
          <div className="row">
            <div className="columns small-4">{locals.inputs.input_start}</div>
            <div className="columns small-4">{locals.inputs.input_end}</div>
            <div className="columns small-4">
              {locals.inputs.maximum_product_size}
            </div>
          </div>

          <span>
            <a
              href="http://primer3.ut.ee/primer3web_help.htm#SEQUENCE_FORCE_LEFT_START"
              target="_new"
            >
              <i className="fa primer-help" />
              Force Start position of primers
            </a>
          </span>
          <div className="row">
            <div className="columns small-6">{locals.inputs.end_point}</div>
          </div>

          <span>
            <b>Primer Length</b>
          </span>
          <div className="row">
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MIN_SIZE"
                  target="_new"
                >
                  {' '}
                  Minimum primer length:
                </a>
              </span>{' '}
              {locals.inputs.minimum_length}{' '}
            </div>
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_OPT_SIZE"
                  target="_new"
                >
                  {' '}
                  Optimum primer length:
                </a>
              </span>{' '}
              {locals.inputs.optimum_primer_length}{' '}
            </div>
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MAX_SIZE"
                  target="_new"
                >
                  {' '}
                  Maximum primer length:
                </a>
              </span>{' '}
              {locals.inputs.maximum_length}{' '}
            </div>
          </div>

          <span>
            <b>Primer Composition</b>
          </span>
          <div className="row">
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MIN_GC"
                  target="_new"
                >
                  {' '}
                  Minimum percent GC:
                </a>
              </span>{' '}
              {locals.inputs.minimum_gc}{' '}
            </div>
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_OPT_GC_PERCENT"
                  target="_new"
                >
                  {' '}
                  Optimum percent GC:
                </a>
              </span>{' '}
              {locals.inputs.optimum_gc}{' '}
            </div>
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MAX_GC"
                  target="_new"
                >
                  {' '}
                  Maximum percent GC:
                </a>
              </span>{' '}
              {locals.inputs.maximum_gc}{' '}
            </div>
          </div>

          <span>
            <b>Melting Temperature</b>
          </span>
          <div className="row">
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MIN_TM"
                  target="_new"
                >
                  {' '}
                  Minimum Tm:
                </a>
              </span>{' '}
              {locals.inputs.minimum_tm}{' '}
            </div>
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_OPT_TM"
                  target="_new"
                >
                  {' '}
                  Optimum Tm:
                </a>
              </span>{' '}
              {locals.inputs.optimum_tm}{' '}
            </div>
            <div className="columns small-4">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MAX_TM"
                  target="_new"
                >
                  {' '}
                  Maximum Tm:
                </a>
              </span>{' '}
              {locals.inputs.maximum_tm}{' '}
            </div>
          </div>

          <span>
            <b>Primer Annealing</b>
          </span>
          <div className="row">
            <div className="columns small-3">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MAX_SELF_ANY"
                  target="_new"
                >
                  {' '}
                  Max Self Complementarity:
                </a>
              </span>{' '}
              {locals.inputs.max_self_complementarity}{' '}
            </div>
            <div className="columns small-3">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_MAX_SELF_END"
                  target="_new"
                >
                  {' '}
                  Max 3&apos; Self Complementarity:
                </a>
              </span>{' '}
              {locals.inputs.max_three_prime_self_complementarity}{' '}
            </div>
            <div className="columns small-3">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_PAIR_MAX_COMPL_ANY"
                  target="_new"
                >
                  {' '}
                  Max Pair Complementarity:{' '}
                </a>
              </span>{' '}
              {locals.inputs.max_pair_complementarity}{' '}
            </div>
            <div className="columns small-3">
              {' '}
              <span>
                <a
                  href="http://primer3.ut.ee/primer3web_help.htm#PRIMER_PAIR_MAX_COMPL_END"
                  target="_new"
                >
                  {' '}
                  Max 3&apos; Pair Complementarity:
                </a>
              </span>{' '}
              {locals.inputs.max_three_prime_pair_complementarity}{' '}
            </div>
          </div>
        </div>
      );
    };

    var options = {
      auto: 'none',
      fields: {
        gene_name: {
          label:
            'Locus: Enter a standard gene name or systematic ORF name (i.e. ACT1, YKR054C)',
          size: 'lg',
        },

        sequence: {
          type: 'textarea',
          label:
            'Enter the DNA sequence (Sequence MUST be provided in RAW format without headers or comments, although numbers and spaces are okay.)',
        },
        input_start: {
          label:
            'Start: bp from DNA sequence start OR gene START codon, where neg # = upstream:',
        },
        input_end: {
          label: 'End: bp from DNA sequence start OR from gene START codon:',
        },
        maximum_product_size: {
          label:
            'Maximum product size in bp, cannot be less than target size (Optional):',
        },
        end_point: {
          label:
            "Forces the 3' endpoints of the left and right primers to Target Start and End respectively:",
        },
      },
      template: formLayout,
    };

    return (
      <form onSubmit={this.handleSubmit} style={{ marginBottom: '3rem' }}>
        <t.form.Form
          ref={(primerForm) => (this.primerForm = primerForm)}
          type={PrimerFormSchema}
          value={this.state.value}
          onChange={this.onChange}
          options={options}
          resetForm={this.resetForm}
        />
        {this._renderError()}
        <div className="form-group">
          <button type="submit" className="button primary">
            Pick Primers
          </button>
          <span> OR </span>
          <button onClick={this.handleReset} className="button primary">
            Reset to Defaults
          </button>
        </div>
      </form>
    );
  },

  render() {
    if (this.state.result) {
      return this.renderResults();
    }
    return this.renderForm();
  },

  _renderError() {
    if (!this.state.error) return null;
    return (
      <div className="alert-box warning">
        <p>{this.state.error}</p>
      </div>
    );
  },
});

const style = {
  container: {
    marginBottom: '2rem',
  },
  controlContainer: {
    marginBottom: '1rem',
  },
  controlButton: {
    marginRight: '0.5rem',
  },
};

function getCounter(c) {
  var cc = c + 1;
  return cc;
}

function mapStateToProps(_state) {
  return {
    queryParams: queryString.parse(_state.router.location.search),
  };
}

export default connect(mapStateToProps)(Radium(Primer3));

const DEFAULT_VALUE = {
  input_start: '500',
  input_end: '900',
  minimum_tm: '57',
  optimum_tm: '59',
  maximum_tm: '62',
  minimum_length: '18',
  optimum_primer_length: '20',
  maximum_length: '23',
  minimum_gc: '30',
  optimum_gc: '50',
  maximum_gc: '70',
  max_self_complementarity: '8',
  max_three_prime_self_complementarity: '3',
  max_pair_complementarity: '8',
  max_three_prime_pair_complementarity: '3',
  end_point: 'NO',
  sequence: '',
};
