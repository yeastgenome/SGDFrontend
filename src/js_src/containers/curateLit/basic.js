import React, { Component } from 'react';
import { connect } from 'react-redux';

import Tags from './tags';
import LitBasicInfo from '../../components/litBasicInfo';
import { selectActiveLitEntry, selectHasData } from '../../selectors/litSelectors';

class CurateLitBasic extends Component {
  render() {
    if (!this.props.hasData) return null;
    let d = this.props.data;
    let _abstract = d.abstract ? d.abstract.text : { text: '' };
    return (
      <div>
        <div className='callout'>
          <div className='text-right'>
            <a><i className='fa fa-edit' /> Edit</a>
          </div>
          <LitBasicInfo
            abstract={_abstract}
            citation={d.citation}
            hideGeneList
            fulltextUrl={''}
            pmid={d.pubmed_id.toString()}
          />
        </div>
        <Tags id={d.sgdid} />
      </div>
    );
  }
}

CurateLitBasic.propTypes = {
  data: React.PropTypes.object,
  hasData: React.PropTypes.bool
};

function mapStateToProps(state) {
  return {
    data: selectActiveLitEntry(state),
    hasData: selectHasData(state)
  };
}

export default connect(mapStateToProps)(CurateLitBasic);
