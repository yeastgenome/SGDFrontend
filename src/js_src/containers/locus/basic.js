import React, { Component } from 'react';
import { connect } from 'react-redux';
import t from 'tcomb-form';

import FlexiForm from '../../components/forms/flexiForm';
import Loader from '../../components/loader';
import { setMessage } from '../../actions/metaActions';
import { updateData } from './locusActions';

class LocusBasic extends Component {
  handleSuccess(data) {
    this.props.dispatch(updateData(data));
    this.props.dispatch(setMessage('Locus updated.'));
  }

  render() {
    let data = this.props.data;
    if (!data || this.props.isPending) return <Loader />;
    let Alias = t.struct({
      alias: t.String,
      pmids: t.maybe(t.String)
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
      description_pmids : t.maybe(t.String),
      ncbi_protein_name: t.maybe(t.String)
    });
    let aliasLayout = locals => {
      return (
        <div className='row'>
          <div className='columns small-3'>{locals.inputs.alias}</div>
          <div className='columns small-3'>{locals.inputs.pmids}</div>
          <div className='columns small-6'>{locals.inputs.removeItem}</div>
        </div>
      );
    };
    let bgiOptions = {
      fields: {
        description: {
          type: 'textarea'
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
          <FlexiForm defaultData={this.props.data.basic} onSuccess={this.handleSuccess.bind(this)} requestMethod='PUT' tFormSchema={bgiSchema} tFormOptions={bgiOptions} updateUrl={url} />
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
