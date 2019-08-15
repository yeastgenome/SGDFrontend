/*eslint-disable no-undef */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import t from 'tcomb-form';
import PropTypes from 'prop-types';
import FlexiForm from '../../components/forms/flexiForm';
import Loader from '../../components/loader';
import { setMessage } from '../../actions/metaActions';
import { updateData } from './locusActions';

class LocusGeneName extends Component {
  handleSuccess(data) {
    this.props.dispatch(updateData(data));
    this.props.dispatch(setMessage('Gene name updated and alias added.'));
  }

  render() {
    let data = this.props.data;
    if (!data || this.props.isPending) return <Loader />;
    let geneNameSchema = t.struct({
      gene_name: t.maybe(t.String),
      gene_name_pmids: t.maybe(t.String),
      old_gene_name_alias_type:  t.maybe(t.enums.of([
        'Uniform',
        'Non-uniform',
        'Retired name'
      ]))
    });
    let url = `/locus/${this.props.params.id}/basic`;
    return (
      <div className='row'>
        <div className='columns small-12 medium-6'>
          <FlexiForm defaultData={this.props.data.basic} onSuccess={this.handleSuccess.bind(this)} requestMethod='PUT' tFormSchema={geneNameSchema} updateUrl={url} />
          <p>The new name will be added as a locusnote. The old gene name (if it exists) will automatically become an alias, using PMIDS from old gene name.</p>
        </div>
      </div>
    );
  }
}

LocusGeneName.propTypes = {
  data: PropTypes.object,
  dispatch: PropTypes.func,
  isPending: PropTypes.bool,
  params: PropTypes.object
};

function mapStateToProps(state) {
  let _data = state.locus.get('data') ? state.locus.get('data').toJS() : null;
  return {
    data: _data,
    isPending: state.locus.get('isPending')
  };
}

export { LocusGeneName as LocusGeneName };
export default connect(mapStateToProps)(LocusGeneName);
