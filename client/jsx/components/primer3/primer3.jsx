import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import _ from 'underscore';

const t = require('tcomb-form');
const Form = t.form.Form;

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
        method: 'SEQUENCING',
        num_strands: 'ONE',
        which_strand: 'CODING'
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
	        this.setState({ result: returnData.toString() });
	        console.log(returnData);
	        for k, v in returnData.items():
                console.log('{:<30} {:<25} {:<25}'.format(k, repr(returnData.get(k)), repr(v)))
	    }
	});
    if (value) {
      console.log(value);
    }
  },

  renderExampleForm() {

    const Method = t.enums.of(['PCR', 'SEQUENCING'], 'Method');

    const Strand = t.enums.of(['ONE', 'BOTH'], 'Strand');

    const Coding = t.enums.of(['CODING', 'NONCODIG'], 'Coding');

    Method.getTcombFormFactory = (options) => {
        return t.form.Radio;
    };

    Strand.getTcombFormFactory = (options) => {
        return t.form.Radio;
    };

    Coding.getTcombFormFactory = (options) => {
        return t.form.Radio;
    };

    const PcrFormSchema = t.struct({
       gene_name: t.String,
       sequence: t.maybe(t.String),
       distance_from_start_codon: t.Number,
       distance_from_stop_codon: t.Number,
       lenght_dna_primers: t.Number,
       optimum_tm: t.Number,
       minimum_tm: t.Number,
       maximum_tm: t.Number,
       optimum_primer_length: t.Number,
       minimum_length: t.Number,
       maximum_length: t.Number,
       optimum_gc: t.Number,
       minimum_gc: t.Number,
       maximum_gc: t.Number,
       self_anneal: t.Number,
       self_end_anneal: t.Number,
       pair_anneal: t.Number,
       pair_end_anneal: t.Number
    });


    const rOptions = t.struct({
       optimum_gc: t.Number,
       minimum_gc: t.Number,
       maximum_gc: t.Number
    });

    const GCContent = t.struct({
       optimum_gc: t.Number,
       minimum_gc: t.Number,
       maximum_gc: t.Number
    });

    const Length = t.struct({
       distance_between_primers: t.Number,
       optimum_primer_length: t.Number,
       minimum_length: t.Number,
       maximum_length: t.Number,
    });

    const Distance = t.struct({
       distance_from_start_codon: t.String,
       distance_from_stop_codon: t.String,
       length_dna_primers: t.String,
    });

    const SeqFormSchema = t.struct({
       gene_name: t.String,
       sequence: t.maybe(t.String),
       method: Method,
       which_strand: Coding,
       num_strands: Strand,
       len_options: Length,
       dis_options: Distance,
       gc_options: GCContent,
       len_options: Length,
       self_anneal: t.Number,
       self_end_anneal: t.Number
    });

    const gcLayout = locals => {
      return (
        <div className='row'>
          <div className='columns small-4'>{locals.inputs.optimum_gc}</div>
          <div className='columns small-4'>{locals.inputs.minimum_gc}</div>
          <div className='columns small-4'>{locals.inputs.maximum_gc}</div>
        </div>
      );
    };

    const lenLayout = locals => {
      return (
        <div className='row'>
          <div className='columns small-3'>{locals.inputs.distance_between_primers}</div>
          <div className='columns small-3'>{locals.inputs.optimum_primer_length}</div>
          <div className='columns small-3'>{locals.inputs.minimum_length}</div>
          <div className='columns small-3'>{locals.inputs.maximum_length}</div>
        </div>
      );
    };

    const disLayout = locals => {
      return (
        <div className='row'>
          <div className='columns small-4'>{locals.inputs.distance_from_start_codon}</div>
          <div className='columns small-4'>{locals.inputs.distance_from_stop_codon}</div>
          <div className='columns small-4'>{locals.inputs.length_dna_primers}</div>
        </div>
      );
    };

    var options = {

        fields: {
            gene_name: {type: 'textbox'},
            sequence: {type: 'textarea'},
            gc_options: {
                template: gcLayout
            },
            len_options: {
                template: lenLayout
            },
            dis_options: {
                template: disLayout
            }
       }
    };

    return (
      <form onSubmit={this.handleSubmit}>
        <t.form.Form ref="primerForm" type={SeqFormSchema}
        value={this.state.value} onChange={this.onChange} options={options}/>
        <div className="form-group">
          <button type="submit" className="button primary">Save</button>
        </div>
      </form>
    );
  },

  render () {
    if (this.state.result) {
        return <p>{this.state.result}</p>;
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
