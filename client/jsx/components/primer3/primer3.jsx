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
      value: DEFAULT_VALUE,
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


  componentDidMount() {
    if(this.props.queryParams.name){
        let geneName = this.props.queryParams.name;
        let tempVal = this.state.value;
        tempVal.gene_name = geneName;
        this.setState({value: tempVal});
    }
  },

  onChange(value) {
    this.setState({value});
  },

  resetForm() {
    this.setState({value: null});
  },

  handleReset(e) {
    e.preventDefault();
    this.setState({
      value: DEFAULT_VALUE,
      result: null,
      error: null,
      gene_name: null,
      sequence: null
    });
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
          this.setState({ result: returnData.result, error: null, gene_name: returnData.gene_name,
          sequence: returnData.seq, input: returnData.input});
        }
	    }
  	});
  },


  renderResults () {
    let data = this.state.result; //list of maps
    let gene_name = this.state.gene_name
    if (gene_name == null){ gene_name = 'Input Sequence'}
    let gname_str = 'Primer pairs for  :    ' + gene_name
    //let sequence = 'Input Sequence:   ' + this.state.sequence
    //let newsequence = addNewlines(sequence)
    let input = this.state.input
    let rowData = [];
    let name, pos, len, size, tm, gc, any_th, end_th, hairpin, seq;
    name = pos = len = size = tm = gc = any_th = end_th = hairpin = seq = " ";
    let right_count, left_count;
    right_count = left_count = 0;
    const DISPLAY_KEYS = Object.keys(data);
    let nodes = DISPLAY_KEYS.map( (d,i) => {
        let val = data[d];
        if (val != null){
            const DISPLAY_KEYS_1 =  Object.keys(val);
            let nodes_1 = DISPLAY_KEYS_1.map(  (d1, i1) => { //for each element in map {another map --> pair,right,left}
                let val1 = val[d1]
                    const DISPLAY_KEYS_2 =  Object.keys(val1);
                    let nodes_2 = DISPLAY_KEYS_2.map( (d2, i2) => {
                        if(d1 != 'internal' || d1 != '__proto__') {
                            let val2 = val1[d2]
                            if(d1 == 'pair'){
                                if(d2 == 'product_size') size = val2
                            }else if (d1 == 'right' || d1=='left') {
                                if(d2 == 'position') {
                                    if(input == 'name'){
                                        pos = val2 - 1000
                                    }else if(input == 'seq'){
                                        pos = val2
                                    }
                                }
                                if(d2 == 'length') len = val2
                                if(d2 == 'tm') tm = val2.toFixed(2)
                                if(d2 == 'gc_percent') gc = val2.toFixed(2)
                                if(d2 == 'self_end_th') end_th = val2.toFixed(2)
                                if(d2 == 'self_any_th') any_th = val2.toFixed(2)
                                if(d2 == 'hairpin_th') hairpin = val2.toFixed(2)
                                if(d2 == 'sequence') seq = val2

                            }
                        }
                    });
                    if(d1 == 'right' || d1 == 'left'){
                        if(d1 == 'right'){
                            name = 'primer-right-'+right_count
                            right_count = getCounter(right_count)
                        }else if(d1== 'left') {
                            name = 'primer-left-'+left_count
                            left_count = getCounter(left_count)
                        }
                        //console.log(name, pos, len, size, tm, gc, any_th, end_th, hairpin, seq)
                        rowData.push([name, pos, len, size, tm, gc, any_th, end_th, hairpin, seq])
                    }

            });
        }
    });
    // sort to be in pairs
    rowData = rowData.sort( function(a, b) {
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
      }
      catch(error) {
        return 0;
      }
    });
    let _data = {
      headers: [
          ['primer', 'start', 'len', 'product size', 'tm', 'gc%', 'any_th', 'end_th', 'hairpin', 'seq']
      ],
      rows: rowData
    };
    return (
      <div>
        <h2 style={[style.title]}>{gname_str}</h2>
        <hr />
        <DataTable data={_data} usePlugin={true} pluginOptions={{ 'aaSorting': [] }} />
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
       max_three_prime_pair_complementarity: t.Number
    });

    const formLayout = locals => {

      var param = this.state.param;
        if (param['sequence_id']) {
            var seqID = param['sequence_id'];
            seq = window.localStorage.getItem(seqID);
            local.inputs.sequence = seq
        }

      return (
       <div>
        <span style={{ textAlign: "center" }}><h1>Primer Design: Uses Primer3-py package <a href='https://sites.google.com/view/yeastgenome-help/analyze-help/primer-design' target='_new'><i className='fa primer-help'/> <img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a></h1><hr/></span>
        <span>Sequences of <a href='http://wiki.yeastgenome.org/index.php/Primer_Set_Sequences' target='_new'><i className='fa primer-seqs' />primer sets </a> available to the community<hr/></span>
         <span> Design your own primers: <a href='https://sites.google.com/view/yeastgenome-help/analyze-help/primer-design' target='_new'><i className='fa primer-help'/> <img src="https://d1x6jdqbvd5dr.cloudfront.net/legacy_img/icon_help_circle_dark.png"></img></a> </span>
         <p><b> Please input gene name OR sequence</b></p>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.gene_name}</div>
         </div>
         <p><b> OR </b></p>
         <div className='row'>
          <div className='columns small-8'>{locals.inputs.sequence}</div>
         </div>

        <span><a href='http://primer3.ut.ee/primer3web_help.htm#SEQUENCE_TARGET' target='_new'><i className='fa primer-help' />Target Region</a> </span>
        <p> (NOTE: primers will be chosen from the flanking regions just <b> outside </b> of this defined region) </p>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.input_start}</div>
          <div className='columns small-4'>{locals.inputs.input_end}</div>
          <div className='columns small-4'>{locals.inputs.maximum_product_size}</div>
        </div>

        <span><a href='http://primer3.ut.ee/primer3web_help.htm#SEQUENCE_FORCE_LEFT_START' target='_new'><i className='fa primer-help' />Force Start position of primers</a></span>
         <div className='row'>
          <div className='columns small-6'>{locals.inputs.end_point}</div>
         </div>

        <span><a href='http://primer3.ut.ee/primer3web_help.htm#PRIMER_MIN_SIZE' target='_new'><i className='fa primer-help' />Primer Length</a></span>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.minimum_length}</div>
          <div className='columns small-4'>{locals.inputs.optimum_primer_length}</div>
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
                label: 'Enter the DNA Sequence (NOTE: Paste in DNA sequence only; all headers, comments, numbers and leading spaces or carriage returns should be removedNOTE: Paste in DNA sequence only; all headers, comments, numbers and leading spaces or carriage returns should be removed)'
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
                label: 'Optimum percent GC:'
            },
            minimum_gc: {
                label: 'Minimum percent GC:'
            },
            maximum_gc: {
                label: 'Maximum percent GC:'
            },
            minimum_length:{
                label: 'Minimum primer length:'
            },
            optimum_primer_length:{
                label: 'Optimum primer length:'
            },
            maximum_length:{
                label: 'Maximum primer length:'
            },
            input_start:{
                label: 'Start: bp from DNA sequence start OR gene START codon, where neg # = upstream:'
            },
            input_end:{
                label: 'End: bp from DNA sequence start OR from gene START codon:'
            },
            maximum_product_size:{
                label: 'Maximum product size in bp, cannot be less than target size (Optional):'
            },
            end_point:{
                label: 'Forces the 3\' endpoints of the left and right primers to Target Start and End respectively:'
            }
       },
       template: formLayout
    }


    return (
      <form onSubmit={this.handleSubmit} style={{ marginBottom: '3rem' }}>
        <t.form.Form ref="primerForm" type={PrimerFormSchema}
        value={this.state.value} onChange={this.onChange} options={options} resetForm={this.resetForm}/>
        {this._renderError()}
        <div className="form-group">
          <button type="submit" className="button primary">Pick Primers</button>
          <span> OR </span>
          <button onClick={this.handleReset} className="button primary">Reset to Defaults</button>
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

function addNewlines(seq) {
  var result = '';
  while ($.trim(seq).length > 0) {
    result += seq.substring(0,80) + '\n';
    seq = seq.substring(80);
  }
  return result;
}

function getCounter(c){
    var cc = c+1
    return cc
}


function mapStateToProps(_state) {
  return {
    queryParams: _state.routing.location.query
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
  sequence: ''
};
