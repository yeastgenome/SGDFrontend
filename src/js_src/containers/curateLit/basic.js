import React, { Component } from 'react';
import { connect } from 'react-redux';

import StringField from '../../components/forms/stringField';
import { selectActiveLitEntry } from '../../selectors/litSelectors';

class CurateLitBasic extends Component {
  render() {
    let d = this.props.data;
    return (
      <div>
        <StringField defaultValue={d.title} displayName='Title' paramName='title' />
        <div className='row'>
          <div className='columns small-3'>
            <StringField defaultValue={d.journal} displayName='Journal' paramName='journal' />
          </div>
          <div className='columns small-2'>
            <StringField defaultValue={d.pmid} displayName='PMID' paramName='pmid' />
          </div>
          <div className='columns small-2'>
            <StringField defaultValue={d.doi} displayName='DOI' paramName='doi' />
          </div>
          <div className='columns small-1'>
            <StringField defaultValue={d.year} displayName='Year' paramName='year' />
          </div>
          <div className='columns small-4'>
            <StringField defaultValue={d.full_text_url} displayName='Full Text URL' paramName='full_text_url' />
          </div>
        </div>
        <StringField defaultValue={d.citation} displayName='Citation' paramName='citation' />

      </div>
    );
  }
}

CurateLitBasic.propTypes = {
  data: React.PropTypes.object
};

function mapStateToProps(state) {
  return {
    data: selectActiveLitEntry(state),
  };
}

export default connect(mapStateToProps)(CurateLitBasic);
