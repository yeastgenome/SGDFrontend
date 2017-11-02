import React, { Component } from 'react';
import { connect } from 'react-redux';
import t from 'tcomb-form';

import Loader from '../loader';
import { setError, clearError } from '../../actions/metaActions';
import fetchData from '../../lib/fetchData';

// takes a tForm schema object and renders a form which will 
class FlexiForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      isPending: false
    };
  }

  handleSubmit(e) {
    e.preventDefault();
    let value = this.formInput.getValue();
    let method = this.state.data ? 'PUT' : 'POST';
    this.setState({ isPending: true });
    let formOptions = {
      type: method,
      data: value,
      headers: {
        'X-CSRF-Token': window.CSRF_TOKEN
      }
    };
    fetchData(this.props.updateUrl, formOptions).then( (data) => {
      this.setState({ isPending: false });
      this.props.dispatch(clearError());
      if (this.props.onSuccess) this.props.onSuccess(data);
    }).catch( () => {
      this.setState({ isPending: false });
      let errorMessage = 'Unable to login. Please verify your username and password are correct.';
      this.props.dispatch(setError(errorMessage));
    });
  }

  render() {
    if (this.state.isPending) return <Loader />;
    let submitText = this.props.submitText || 'Update';
    return (
      <form className='sgd-curate-form' onSubmit={this.handleSubmit.bind(this)}>
        <t.form.Form options={this.props.tFormOptions} ref={input => this.formInput = input} type={this.props.tFormSchema} value={this.state.data} />
          <div className='form-group'>
            <button type='submit' className='button'>{submitText}</button>
          </div>
      </form>
    );
  }
}

FlexiForm.propTypes = {
  dispatch: React.PropTypes.func,
  getUrl: React.PropTypes.string,
  onSuccess: React.PropTypes.func,// (data) =>
  submitText: React.PropTypes.string,
  tFormSchema: React.PropTypes.func.isRequired,
  tFormOptions: React.PropTypes.object,
  updateUrl: React.PropTypes.string.isRequired,
};

function mapStateToProps() {
  return {};
}

export default connect(mapStateToProps)(FlexiForm);
