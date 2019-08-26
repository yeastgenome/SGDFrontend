import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Tags from './tags';
import { selectActiveLitEntry, selectHasData } from '../../selectors/litSelectors';

class CurateLitBasic extends Component {
  render() {
    if (!this.props.hasData) return null;
    let d = this.props.data;
    let _abstract = d.abstract ? d.abstract.text : { text: '' };
    return (
      <div>
        <div>
          <div>
            <p dangerouslySetInnerHTML={{ __html: _abstract }} />
          </div>
        </div>
        <Tags id={this.props.match.params.id} />
      </div>
    );
  }
}

CurateLitBasic.propTypes = {
  data: PropTypes.object,
  hasData: PropTypes.bool,
  match: PropTypes.object
};

function mapStateToProps(state) {
  return {
    data: selectActiveLitEntry(state),
    hasData: selectHasData(state)
  };
}

export default connect(mapStateToProps)(CurateLitBasic);
