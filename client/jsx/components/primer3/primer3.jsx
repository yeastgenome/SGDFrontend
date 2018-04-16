import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import _ from 'underscore';

import t from 'tcomb-form';
const Form = t.form.Form;

var v = require('tcomb-validation');
var validate = v.validate;

const DataTable = require('../widgets/data_table.jsx');
import apiRequest from '../../lib/api_request.jsx';
import { StringField, CheckField, TextField, SelectField, MultiSelectField, RadioSelector} from '../../components/widgets/form_helpers.jsx';

const PRIMER3URL = '/backend/primer3';

const Primer3 = React.createClass({

  getInitialState () {
    return {
      result: null,
      value: {
        include_start: '500',
        include_end: '900',
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
        end_point: 'NO'
      },
      isLoadPending: false, // loading existing data
      isUpdatePending: false, // sending update to server
      isComplete: false,
      error: null
    };
  },

  componentDidUpdate(prevProps) {
    if (prevProps.queryParams.results && !this.props.queryParams.results) {
      this.setState({ result: null });
    }
  },

  onChange(value) {
    this.setState({value});
  },

  resetForm() {
    this.setState({value: null});
  },

  handleSubmit(e) {
    this.props.history.pushState(null, '/primer3', { 'results': 1 });
    e.preventDefault();
    const value = this.refs.primerForm.getValue();
    let strValue = JSON.stringify(value);
    $.ajax({
	    url: PRIMER3URL,
	    type: 'POST',
	    data: strValue,
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    processData: true,
	    success: ( returnData ) => {
        if (returnData.error) {
          this.setState({ error: returnData.error });
        } else {
          this.setState({ result: returnData, error: null });  
        }
	    }
  	});
  },



  renderResults () {
    let data = this.state.result;
    let rowData = [];
    const DISPLAY_KEYS = Object.keys(data);
    let nodes = DISPLAY_KEYS.map( (d,i) => {
    if ( d.match(/\d+$/) != null || d.indexOf('_TM') > 0 ||  d.indexOf('_GC_PERCENT') > 0  || d.indexOf('_SEQUENCE') > 0 || d.indexOf('_SELF_ANY_TH') > 0
          || d.indexOf('_SELF_END_TH') > 0 || d.indexOf('_HAIRPIN_TH') > 0 || d.indexOf('_SEQUENCE') > 0) {
         let val = data[d];
          rowData.push([d, val])
    }
    });
    let _data = {
      headers: [
          ['Parameter', 'Value']
      ],
      rows: rowData
    };
    return (
      <div>
        <h2>Primer Pairs</h2>
        <hr />
        <DataTable data={_data} usePlugin={true} order={1, "asc"}/>
      </div>
    );
  },


  renderForm() {

    const Endpoint = t.enums.of(['NO', 'YES'], 'Endpoint');

    Endpoint.getTcombFormFactory = (options) => {
        return t.form.Radio;
    };

    const PcrFormSchema = t.struct({

       gene_name: t.maybe(t.String),
       sequence: t.maybe(t.String),
       include_start: t.Number,
       include_end: t.Number,
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
       max_three_prime_pair_complementarity: t.Number
    });

    const formLayout = locals => {
      return (
       <div>
        <span style={{ textAlign: "center" }}><h1>Primer Design: Based on Primer3 package <a href='https://pypi.python.org/pypi/primer3-py' target='_new'><i className='fa primer-help' /></a> </h1><hr/></span>
        <br/>
        <span>Sequences of <a href='http://wiki.yeastgenome.org/index.php/Primer_Set_Sequences' target='_new'><i className='fa primer-seqs' />primer sets </a> available to the community</span>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.gene_name}</div>
         </div>
         <p><b> Please input gene name OR sequence</b></p>
         <div className='row'>
          <div className='columns small-8'>{locals.inputs.sequence}</div>
         </div>

        <span><a href='http://primer3.ut.ee/primer3web_help.htm#SEQUENCE_TARGET' target='_new'><i className='fa primer-help' />Target Region</a></span>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.include_start}</div>
          <div className='columns small-4'>{locals.inputs.include_end}</div>
          <div className='columns small-4'>{locals.inputs.maximum_product_size}</div>

        </div>

        <span><a href='http://primer3.ut.ee/primer3web_help.htm#SEQUENCE_FORCE_LEFT_START' target='_new'><i className='fa primer-help' />Force Start position of primers</a></span>
         <div className='row'>
          <div className='columns small-6'>{locals.inputs.end_point}</div>
         </div>

        <span><a href='http://primer3.ut.ee/primer3web_help.htm#PRIMER_MIN_SIZE' target='_new'><i className='fa primer-help' />Primer Length</a></span>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.minimum_length}</div>
          <div className='columns small-3'>{locals.inputs.optimum_primer_length}</div>
          <div className='columns small-4'>{locals.inputs.maximum_length}</div>
         </div>

        <span><a href='http://primer3.ut.ee/primer3web_help.htm#PRIMER_MIN_GC' target='_new'><i className='fa primer-help' />Primer Composition</a></span>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.minimum_gc}</div>
          <div className='columns small-4'>{locals.inputs.optimum_gc}</div>
          <div className='columns small-4'>{locals.inputs.maximum_gc}</div>
         </div>
        <span><a href='http://primer3.ut.ee/primer3web_help.htm#PRIMER_PRODUCT_MIN_TM' target='_new'><i className='fa primer-help' />Melting Temperature</a></span>

         <div className='row'>
          <div className='columns small-4'>{locals.inputs.minimum_tm}</div>
          <div className='columns small-4'>{locals.inputs.optimum_tm}</div>
          <div className='columns small-4'>{locals.inputs.maximum_tm}</div>
        </div>
        <span><a href='http://primer3.ut.ee/primer3web_help.htm#PRIMER_MAX_SELF_ANY' target='_new'><i className='fa primer-help' />Primer Annealing</a></span>
        <div className='row'>
          <div className='columns small-3'>{locals.inputs.max_self_complementarity}</div>
          <div className='columns small-3'>{locals.inputs.max_three_prime_self_complementarity}</div>
          <div className='columns small-3'>{locals.inputs.max_pair_complementarity}</div>
          <div className='columns small-3'>{locals.inputs.max_three_prime_pair_complementarity}</div>
        </div>

        </div>
      );
    };

    var options = {
        fields: {
            gene_name:{
                label: 'Locus: Enter a standard gene name or systematic ORF name (i.e. ACT1, YKR054C)',
                size: 'lg'
            },

            sequence: {
                type: 'textarea',
                label: 'Enter the DNA Sequence (comments should be removed)'
            },
            max_self_complementarity: {
                label: 'Max Self Complementarity:'
            },
            max_three_prime_self_complementarity: {
                label: 'Max 3\' Self Complementarity:'
            },
            max_pair_complementarity: {
                label: 'Max Pair Complementarity:'
            },
            max_three_prime_pair_complementarity: {
                label: 'Max 3\' Pair Complementarity:'
            },
            optimum_tm: {
                label: 'Optimum Tm:'
            },
            minimum_tm: {
                label: 'Minimum Tm:'
            },
            maximum_tm: {
                label: 'Maximum Tm:'
            },
            optimum_gc: {
                label: 'Optimum percent GC content:'
            },
            minimum_gc: {
                label: 'Minimum GC:'
            },
            maximum_gc: {
                label: 'Maximum GC:'
            },
            include_start:{
                label: 'Start at this 5\' location from START codon:'
            },
            include_end:{
                label: 'End at this 5\' location from START codon:'
            },
            maximum_product_size:{
                label: 'Maximum product size:'
            },
            end_point:{
                label: 'Forces the endpoints on 5\' and 3\' locations to above included regions:'
            }
       },
       template: formLayout
    }


    return (
      <form onSubmit={this.handleSubmit} style={{ marginBottom: '3rem' }}>
        <t.form.Form ref="primerForm" type={PcrFormSchema}
        value={this.state.value} onChange={this.onChange} options={options}/>
        {this._renderError()}
        <div className="form-group">
          <button type="submit" className="button primary">Pick Primers</button>
          <span> OR </span>
          <button type="reset" className="button primary">Reset to Defaults</button>
        </div>
      </form>
    );
  },



  render () {
    if (this.state.result) {
      return this.renderResults();
    }
    return this.renderForm();
  },



  _renderError () {
    if (!this.state.error) return null;
    return (
      <div className='alert-box warning'>
        <p>{this.state.error}</p>
      </div>
    );
  }

});

const style = {
  container: {
    marginBottom: '2rem'
  },
  controlContainer: {
    marginBottom: '1rem'
  },
  controlButton: {
    marginRight: '0.5rem'
  }
};

function mapStateToProps(_state) {
  return {
    queryParams: _state.routing.location.query
  };
}

export default connect(mapStateToProps)(Radium(Primer3));
