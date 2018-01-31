import React, { Component } from 'react';

import style from './style.css';
import { makeFieldDisplayName } from '../lib/searchHelpers';
import PREVIEW_URL from '../constants';

const JOIN_CHAR = ', ';

class DetailList extends Component {
  render() {
    let d = this.props.data;
    let fields = this.props.fields || Object.keys(d);
    let nodes = fields.map( (field) => {
      let valueNode;
      let value = d[field];
      if (Array.isArray(value)) {
        value = value.join(JOIN_CHAR);
        valueNode = <span dangerouslySetInnerHTML={{ __html: value }} />;
      } else if (typeof value === 'object' && value !== null) {
        let _href = PREVIEW_URL + value.link;
        valueNode = <a href={_href} target='_new'>{value.display_name}</a>;
      } else {
        valueNode = <span dangerouslySetInnerHTML={{ __html: value }} />;
      }
      
      return (
        <div className={style.detailLineContainer} key={`srField.${field}`}>
          <span className={style.detailLabel}><strong>{makeFieldDisplayName(field)}:</strong> </span>
          {valueNode}
        </div>
      );
    });
    return (
      <div className={style.detailContainer}>
        {nodes}
      </div>
    );
  }
}

DetailList.propTypes = {
  data: React.PropTypes.object,
  fields: React.PropTypes.array
};

export default DetailList;
