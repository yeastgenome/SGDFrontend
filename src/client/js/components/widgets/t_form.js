import React from 'react';
import ToSchema from 'tcomb-json-schema';
import { form, validate } from 'tcomb-form';
const Form = form.Form;
import { Link } from 'react-router';

// create form from JSON validation format
const TForm = React.createClass({
  propTypes: {
    onChange: React.PropTypes.func, // (value) => form value object
    onSubmit: React.PropTypes.func, // (value) => form value object
    validationObject: React.PropTypes.object.isRequired,
    cancelHref: React.PropTypes.string, // if a string, renders a cancel button to that 
    submitText: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      submitText: 'Submit'
    };
  },

  getInitialState () {
    return {
      errors: []
    };
  },

  /*
    example object
    {
      title: 'Paper',
      type: 'object',
      properties: {
        title: { type: 'string' },
        abstract: { type: 'string' }
      },
      required: ['title']
    }
  */

  render() {
    // convert json schema to tcomb schema obj
    let tcombSchema = ToSchema(this.props.validationObject);
    let cancelNode = (typeof this.props.cancelHref === 'string') ? <Link to={this.props.cancelHref} className='button secondary' style={styles.formButton}>Cancel</Link> : null;
    return (
      <div>
        <Form ref='form' type={tcombSchema} onChange={this.props.onChange} onSubmit={this.props.onSubmit} />
        {this._renderErrors()}
        <div className='button-group'>
          {cancelNode}
          <a className='button primary' onClick={this._onSubmit}>{this.props.submitText}</a>
        </div>
      </div>
    );
  },

  _renderErrors () {
    const errors = this.state.errors;
    if (errors.length === 0) return null;
    const errNodes = errors.map( (d, i) => {
      return <li key={`formErr${i}`}>{d.message}</li>;
    });
    return <ul style={styles.errZone}>{errNodes}</ul>;
  },

  _onSubmit (e) {
    if (e) e.preventDefault();
    const validation = this.refs.form.validate();
    this.setState({ errors: validation.errors });
    if (validation.errors.length === 0 && typeof this.props.onSubmit === 'function') {
      this.props.onSubmit(this.refs.form.getValue());
    }
  }
});

const styles = {
  errZone: {
    color: 'red'
  },  
  formButton: {
    marginRight: '0.5rem',
    border: 'none'
  }
};

export default TForm;
