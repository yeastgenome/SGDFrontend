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

const Primer3 = React.createClass({

  getInitialState () {
    return {
      value: {
        distance_from_start_codon: '35',
        distance_from_stop_codon: '35',
        lenght_dna_primers: '35',
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
        pair_end_anneal: '12'
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
    const value = this.refs.primerForm.getValue()
    if (value) {
      console.log(value);
    }
  },

  renderExampleForm() {

   var options = {
    fields: {
         systematic_name: {type: 'textbox'},
         sequence: {type: 'textarea'}
       }
    };

    const Strand = t.enums({
        ONE: 'ONE',
        BOTh: 'BOTH'
    });

    const Coding = t.enums({
        CODING: 'CODING',
        NONCODING: 'NONCODING'
    });

    const PcrFormSchema = t.struct({
       systematic_name: t.String,
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

    const SeqFormSchema = t.struct({
       systematic_name: t.String,
       sequence: t.maybe(t.String),
       distance_from_start_codon: t.String,
       distance_from_stop_codon: t.String,
       lenght_dna_primers: t.String,
       num_strands: Strand,
       which_strand: Coding,
       distance_between_primers: t.Number,
       optimum_primer_length: t.Number,
       minimum_length: t.Number,
       maximum_length: t.Number,
       optimum_gc: t.Number,
       minimum_gc: t.Number,
       maximum_gc: t.Number,
       self_anneal: t.Number,
       self_end_anneal: t.Number
    });

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


function mytemplate(locals) {
    // in locals.inputs you find all the rendered fields
    return (
        <View>
            <View style={{marginTop: 10}}>
                <Text style={[{marginLeft: 20}, constants.styles.strong]}>Primer Annealing</Text>
                {locals.inputs.self_anneal}
                {locals.inputs.self_end_anneal}
                {locals.inputs.pair_anneal}
                {locals.inputs.pair_end_anneal}
            </View>
        </View>
    );
}

function mapStateToProps(_state) {
  return {
  };
}

export default connect(mapStateToProps)(Radium(Primer3));
