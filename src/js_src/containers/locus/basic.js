import React, { Component } from 'react';
import { connect } from 'react-redux';
import t from 'tcomb-form';

import FlexiForm from '../../components/forms/flexiForm';
import Loader from '../../components/loader';
import { setMessage, setError } from '../../actions/metaActions';
import { updateData } from './locusActions';

const DESCRIPTION_LENGTH = 500;
const HEADLINE_LENGTH = 70;

class LocusBasic extends Component {
  // give some feedback for changes to description, such as updated headline
  handleChange(data) {
    // TODO properly get headline and reflect
    let description = data['description'];
    if (description.length > DESCRIPTION_LENGTH) {
      this.props.dispatch(setError(`Description cannot be greater than ${DESCRIPTION_LENGTH} characters.`));
    }
    let headline = description.slice(0, HEADLINE_LENGTH);
    headline = headline.substring(headline.indexOf(';') + 1);
    console.log(headline);
  }

  handleSuccess(data) {
    this.props.dispatch(updateData(data));
    this.props.dispatch(setMessage('Locus updated.'));
  }

  render() {
    let data = this.props.data;
    if (!data || this.props.isPending) return <Loader />;
    let Alias = t.struct({
      alias: t.String,
      pmids: t.maybe(t.String),
      type: t.enums.of([
        'Uniform',
        'Non-uniform',
        'Retired name'
      ], 'Type')
    });
    let Qualifier = t.enums.of([
      'Verified',
      'Uncharacterized',
      'Dubious'
    ], 'Qualifier');
    let bgiSchema = t.struct({
      gene_name: t.maybe(t.String),
      gene_name_pmids: t.maybe(t.String),
      name_description: t.maybe(t.String),
      name_description_pmids : t.maybe(t.String),
      aliases: t.list(Alias),
      feature_type: t.maybe(t.String),
      qualifier: Qualifier,
      description: t.maybe(t.String),
      headline: t.String,
      description_pmids : t.maybe(t.String),
      ncbi_protein_name: t.maybe(t.String)
    });
    let aliasLayout = locals => {
      return (
        <div className='row'>
          <div className='columns small-2'>{locals.inputs.alias}</div>
          <div className='columns small-2'>{locals.inputs.type}</div>
          <div className='columns small-2'>{locals.inputs.pmids}</div>
          <div className='columns small-6'>{locals.inputs.removeItem}</div>
        </div>
      );
    };
    let bgiOptions = {
      fields: {
        description: {
          type: 'textarea'
        },
        headline: {
          type: 'static'
        },
        name_description: {
          type: 'textarea'
        },
        aliases: {
          disableOrder: true,
          item: {
            template: aliasLayout
          }
        }
      }
    };
    let url = `/locus/${this.props.params.id}/basic`;
    return (
      <div className='row'>
        <div className='columns small-12 medium-6'>
          <FlexiForm defaultData={this.props.data.basic} onChange={this.handleChange.bind(this)} onSuccess={this.handleSuccess.bind(this)} requestMethod='PUT' tFormSchema={bgiSchema} tFormOptions={bgiOptions} updateUrl={url} />
        </div>
      </div>
    );
  }
}

LocusBasic.propTypes = {
  data: React.PropTypes.object,
  dispatch: React.PropTypes.func,
  isPending: React.PropTypes.bool,
  params: React.PropTypes.object
};

function mapStateToProps(state) {
  let _data = state.locus.get('data') ? state.locus.get('data').toJS() : null;
  return {
    data: _data,
    isPending: state.locus.get('isPending')
  };
}

export { LocusBasic as LocusBasic };
export default connect(mapStateToProps)(LocusBasic);
