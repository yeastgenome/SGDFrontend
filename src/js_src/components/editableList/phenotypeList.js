/*eslint-disable react/no-set-state */
import React, { Component } from 'react';
import MultiSelectField from '../forms/multiSelectField';

const LOCUS_URL = '/autocomplete_results?category=locus&q=';
const PHENO_URL = '/autocomplete_results?category=phenotype&q=';

class PhenotypeList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: props.defaultValues || []
    };
  }

  // call onUpdate prop if defined and values changed
  componentDidUpdate(prevProps, prevState) {
    if (this.state.values !== prevState.values && typeof this.props.onUpdate === 'function') {
      this.props.onUpdate(this.state.values);
    }
  }

  renderValues () {
    let nodes = this.state.values.map( (d, i) => {
      return <li key={`editLI${i}`}>{d}</li>;
    });
    return (
      <ul>{nodes}</ul>
    );
  }

  handleAddValue (e) {
    e.preventDefault();
    let content = this.refs.inputText.value;
    if (content === '') return; // ignore blank
    let newValues = this.state.values.slice();
    newValues.push(content);
    this.setState({ values: newValues });
    // clear input
    this.refs.inputText.value = '';
  }

  render () {
    return (
      <div>
        {this.renderValues()}
        <div className='row'>
          <div className='columns small-2'>
            <label>Locus</label>
            <MultiSelectField optionsUrl={LOCUS_URL} />
          </div>
          <div className='columns small-4'>
            <label>Phenotype</label>
            <MultiSelectField optionsUrl={PHENO_URL} />
          </div>
          <div className='columns small-2'>
            <label>Experiment Type</label>
            <input placeholder={this.props.placeholder} ref='firstText' type='text' />
          </div>
          <div className='columns small-1'>
            <label>Mutant</label>
            <input placeholder={this.props.placeholder} ref='firstText' type='text' />
          </div>
          <div className='columns small-1'>
            <label>Strain</label>
            <input placeholder={this.props.placeholder} ref='firstText' type='text' />
          </div>
          <div className='columns small-2'>
            <label>Chemical</label>
            <input placeholder={this.props.placeholder} ref='firstText' type='text' />
          </div>
        </div>
        <div className='text-right'>
          <a className='button secondary small' onClick={this.handleAddValue.bind(this)}>Add</a>
        </div>
      </div>
    );
  }
}

PhenotypeList.propTypes = {
  defaultValues: React.PropTypes.array,
  onUpdate: React.PropTypes.func, // onUpdate(values)
  placeholder: React.PropTypes.string
};

export default PhenotypeList;
