import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import _ from 'underscore';

import t from 'tcomb-form';
const Form = t.form.Form;

const DataTable = require('../widgets/data_table.jsx');
import apiRequest from '../../lib/api_request.jsx';
import { StringField, CheckField, TextField, SelectField, MultiSelectField, RadioSelector} from '../../components/widgets/form_helpers.jsx';

const PRIMER3URL = '/backend/primer3';

const Primer3 = React.createClass({

  getInitialState () {
    return {
      result: null,
      value: {
        distance_from_start_codon: '35',
        distance_from_stop_codon: '35',
        length_dna_primers: '35',
        distance_between_primers: '250',
        optimum_tm: '56',
        minimum_tm: '52',
        maximum_tm: '60',
        optimum_primer_length: '20',
        minimum_length: '18',
        maximum_length: '21',
        optimum_gc: '45',
        minimum_gc: '30',
        maximum_gc: '60',
        self_anneal: '24',
        self_end_anneal: '12',
        pair_anneal: '24',
        pair_end_anneal: '12',
        end_point: 'NO'
      },
      isLoadPending: false, // loading existing data
      isUpdatePending: false, // sending update to server
      isComplete: false,
      error: null
    };
  },

  onChange(value) {
    this.setState({value});
  },

  handleSubmit(e) {
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
	        this.setState({ result: returnData });
	    }
	});
    if (value) {
      console.log(value);
    }
  },

  renderResults(){
    let data = this.state.result;
    //console.log(data);
    const DISPLAY_KEYS = Object.keys(data);
    let nodes = DISPLAY_KEYS.map( (d,i) => {
        let val = data[d];
        console.log(d, val);
        return <span key={`prim3${i}`}><strong>{d}:</strong> {val}<br /></span>;
    });
    return <span>{nodes}</span>;
  },


  renderExampleForm() {

    const Endpoint = t.enums.of(['YES', 'NO'], 'Endpoint');

    Endpoint.getTcombFormFactory = (options) => {
        return t.form.Radio;
    };

    const PcrFormSchema = t.struct({
       gene_name: t.maybe(t.String),
       sequence: t.maybe(t.String),

       distance_from_start_codon: t.Number,
       distance_from_stop_codon: t.Number,
       optimum_primer_length: t.Number,

       length_dna_primers: t.Number,
       minimum_length: t.Number,
       maximum_length: t.Number,

       end_point: Endpoint,

       optimum_tm: t.Number,
       minimum_tm: t.Number,
       maximum_tm: t.Number,

       optimum_gc: t.Number,
       minimum_gc: t.Number,
       maximum_gc: t.Number,

       self_anneal: t.Number,
       self_end_anneal: t.Number,
       pair_anneal: t.Number,
       pair_end_anneal: t.Number
    });

    const formLayout = locals => {
      return (
       <div>
        <span style={{ textAlign: "center" }}><h1>Primer Design: Based on Primer3 package <a href='https://pypi.python.org/pypi/primer3-py' target='_new'><i className='fa primer-help' /></a> </h1><hr/></span>
        <br/>
        <span>Sequences of <a href='http://wiki.yeastgenome.org/index.php/Primer_Set_Sequences' target='_new'><i className='fa primer-seqs' />primer sets </a> available to the community</span>
        <span>DNA Source<a href='https://sites.google.com/view/yeastgenome-help/analyze-help/design-primers' target='_new'><i className='fa primer-help' />[info]</a></span>
         <div className='row'>
          <div className='columns small-6'>{locals.inputs.gene_name}</div>
         </div>
         <p><b> Please input gene name OR sequence</b></p>
         <div className='row'>
          <div className='columns small-6'>{locals.inputs.sequence}</div>
         </div>

         <span><a href='https://sites.google.com/view/yeastgenome-help/analyze-help/design-primers' target='_new'><i className='fa primer-help' />Location</a></span>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.distance_from_start_codon}</div>
          <div className='columns small-4'>{locals.inputs.distance_from_stop_codon}</div>
          <div className='columns small-4'>{locals.inputs.length_dna_primers}</div>
        </div>

         <div className='row'>
          <div className='columns small-2'>{locals.inputs.end_point}</div>
         </div>

        <span><a href='https://sites.google.com/view/yeastgenome-help/analyze-help/design-primers' target='_new'><i className='fa primer-help' />Primer Length</a></span>
         <div className='row'>
          <div className='columns small-3'>{locals.inputs.optimum_primer_length}</div>
          <div className='columns small-4'>{locals.inputs.minimum_length}</div>
          <div className='columns small-4'>{locals.inputs.maximum_length}</div>
         </div>
        <span><a href='https://sites.google.com/view/yeastgenome-help/analyze-help/design-primers' target='_new'><i className='fa primer-help' />Primer Composition</a></span>
         <div className='row'>
          <div className='columns small-4'>{locals.inputs.optimum_gc}</div>
          <div className='columns small-4'>{locals.inputs.minimum_gc}</div>
          <div className='columns small-4'>{locals.inputs.maximum_gc}</div>
         </div>
        <span><a href='https://sites.google.com/view/yeastgenome-help/analyze-help/design-primers' target='_new'><i className='fa primer-help' />Melting Temperature</a></span>

         <div className='row'>
          <div className='columns small-4'>{locals.inputs.optimum_tm}</div>
          <div className='columns small-4'>{locals.inputs.minimum_tm}</div>
          <div className='columns small-4'>{locals.inputs.maximum_tm}</div>
        </div>
        <span><a href='https://sites.google.com/view/yeastgenome-help/analyze-help/design-primers' target='_new'><i className='fa primer-help' />Primer Annealing</a></span>
        <div className='row'>
          <div className='columns small-3'>{locals.inputs.self_anneal}</div>
          <div className='columns small-3'>{locals.inputs.self_end_anneal}</div>
          <div className='columns small-3'>{locals.inputs.pair_anneal}</div>
          <div className='columns small-3'>{locals.inputs.pair_end_anneal}</div>
        </div>

        </div>
      );
    };

    var options = {
        fields: {
            gene_name:{
                type: 'textbox',
                label: 'Locus: Enter a standard gene name or systematic ORF name (i.e. ACT1, YKR054C)'
            },

            sequence: {
                type: 'textarea',
                label: 'Enter the DNA Sequence (comments should be removed)'
            },
            distance_from_start_codon: {
                label: 'Distance from START codon (positive numbers are UPSTREAM):  (Enter 0 to start at the first basepair of the start codon)'
            },
            distance_from_stop_codon:{
                label: 'Distance from STOP codon (positive numbers are DOWNSTREAM): (Enter 0 to end at the last basepair of the stop codon)'
            },
            self_anneal: {
                label: 'Self Anneal:'
            },
            self_end_anneal: {
                label: 'Self End Anneal:'
            },
            pair_anneal: {
                label: 'Pair Anneal:'
            },
            pair_end_anneal: {
                label: 'Pair End Anneal:'
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
            end_point: {
                label: 'Select YES to Amplify a region with EXACT endpoints indicated in the "distance from" windows above'
            }

       },
       template: formLayout
    }

    return (
      <form onSubmit={this.handleSubmit}>
        <t.form.Form ref="primerForm" type={PcrFormSchema}
        value={this.state.value} onChange={this.onChange} options={options}/>
        <div className="form-group">
          <button type="submit" className="button primary">Save</button>
        </div>
      </form>
    );
  },



  render () {
    if (this.state.result) {
        return this.renderResults();
    }
    return this.renderExampleForm();
  },



  _renderError () {
    if (!this.state.error) return null;
    return (
      <div className='callout warning'>
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
  };
}

export default connect(mapStateToProps)(Radium(Primer3));
