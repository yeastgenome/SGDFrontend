import React, { Component } from 'react';
import { connect } from 'react-redux';
import t from 'tcomb-form';

import FlexiForm from '../../components/forms/flexiForm';
import Loader from '../../components/loader';
import { setMessage } from '../../actions/metaActions';

class LocusBasic extends Component {
  handleSuccess() {
    this.props.dispatch(setMessage('Locus updated.'));
  }

  render() {
    let data = this.props.data;
    if (!data || this.props.isPending) return <Loader />;
    let bgiSchema = t.struct({
      gene_name: t.maybe(t.String),
      aliases: t.maybe(t.String),
      description: t.maybe(t.String),
      description_pmids : t.maybe(t.String),
      name_description: t.maybe(t.String),
      name_description_pmids : t.maybe(t.String)
    });
    let bgiOptions = {
      fields: {
        description: {
          type: 'textarea'
        },
        name_description: {
          type: 'textarea'
        }
      }
    };
    let url = `/locus/${this.props.params.id}/bgi`;
    return (
      <div>
        <FlexiForm defaultData={this.props.data.basic} onSuccess={this.handleSuccess.bind(this)} requestMethod='PUT' tFormSchema={bgiSchema} tFormOptions={bgiOptions} updateUrl={url} />
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
