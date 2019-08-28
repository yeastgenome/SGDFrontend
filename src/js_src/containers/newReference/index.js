import React, { Component } from 'react';
import t from 'tcomb-form';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import PropTypes from 'prop-types';
import { setMessage } from '../../actions/metaActions';
import FlexiForm from '../../components/forms/flexiForm';
import CurateLayout from '../curateHome/layout';

const GET_CONFIRM_URL = '/reference/confirm';
const ADD_DATA_URL = '/reference';

class NewReference extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmationData: null
    };
  }

  handlePopulateConfirmation(data) {
    this.setState({ confirmationData: data });
  }

  handleSuccess() {
    this.props.dispatch(push({ pathname: '/' }));
    this.props.dispatch(setMessage('Reference(s) added successfully.'));
  }

  handleError() {
    this.setState({ confirmationData: null });
  }

  // really a static form
  renderCart() {
    let Reference = t.struct({
      name: t.maybe(t.String),
      pmid: t.Number,
      warning: t.maybe(t.String)
    });
    let confirmSchema = t.struct({
      references: t.maybe(t.list(Reference))
    });
    let refLayout = locals => {
      let value = locals.value;
      let warningNode = null;
      if (value.warning) warningNode = <span style={{ color: 'red' }}><br /><i className='fa fa-exclamation-circle' /> <i>{value.warning}</i></span>;
      return (
        <li>
          <span>{value.name}{warningNode}</span>
          {locals.inputs.pmid}
        </li>
      );
    };
    let formLayout = locals => {
      return (
        <div>
          <ul>
            {locals.inputs.references}
          </ul>
        </div>
      );
    };
    let confirmOptions = {
      template: formLayout,
      fields: {
        references: {
          label: 'References to add',
          disableOrder: true,
          disableRemove: false,
          disableAdd: true,
          item: {
            fields: {
              name: {
                label: 'Title',
                type: 'static'
              },
              pmid: {
                type: 'hidden'
              },
              warning: {
                label: 'Warning',
                type: 'static'
              }
            },
            template: refLayout
          },
          i18n: {
            remove: 'Remove from input list'
          }
        }
      }
    };

    return (
      <CurateLayout>
        <div className='row'>
          <div className='columns medium-12'>      
            <FlexiForm defaultData={this.state.confirmationData} onError={this.handleError.bind(this)} onSuccess={this.handleSuccess.bind(this)} requestMethod='POST' tFormSchema={confirmSchema} tFormOptions={confirmOptions} submitText='Add References' updateUrl={ADD_DATA_URL} timeout={150000} />
          </div>
        </div>
      </CurateLayout>
    );
  }

  render() {
    if (this.state.confirmationData) {
      return this.renderCart();
    }
    let refSchema = t.struct({
      pmids: t.String
    });
    let refOptions = {
      fields: {
        pmids: {
          label: 'PMIDs * (space-separated)'
        }
      }        
    };
    // form to get confirmation data
    return (
      <CurateLayout>
        <div>
          <h1>Add New References</h1>
          <Link to='/'>Cancel</Link>
          <p>Only 10 references can be added at once.</p>
          <div className='row'>
            <div className='columns medium-3'>      
              <FlexiForm onSuccess={this.handlePopulateConfirmation.bind(this)} requestMethod='POST' tFormSchema={refSchema} tFormOptions={refOptions} submitText='Confirm reference information' updateUrl={GET_CONFIRM_URL} timeout={150000} />
            </div>
          </div>
        </div>
      </CurateLayout>
    );
  }
}

NewReference.propTypes = {
  dispatch: PropTypes.func
};

function mapStateToProps() {
  return {
  };
}

export default connect(mapStateToProps)(NewReference);
