import React, { Component } from 'react';
import { Link } from 'react-router';

import style from './style.css';
// import CategoryLabel from './categoryLabel';
import DetailList from '../../components/detailList';
import thumbA from './fixtureFig0.jpg';
import thumbB from './fixtureFig1.jpg';

const RENDERED_FIELDS = ['title', 'author', 'journal'];
const BASE_CURATE_URL = '/curate_literature';

class LitList extends Component {
  renderHeader(d) {
    let href = `${BASE_CURATE_URL}/${d.id}`;
    return (
      <div>  
        <h5 className={style.listHeader}>
          <Link to={href}>{d.citation}</Link>
        </h5>
        <span className={`label secondary ${style.statusLabel}`}>status: {d.status}</span>
      </div>
    );
  }

  renderDetailFromFields(d, fields) {
    return <DetailList data={d} fields={fields} />;
  }

  renderThumb() {
    let isA = (Math.random() > 0.5);
    let imgSrc = isA ? thumbA : thumbB;
    return (
      <img className={style.litThumb} src={imgSrc} />
    );
  }

  renderEntry(d, i, fields) {
    return (
      <div className={style.resultContainer} key={`sr${i}`}>
        {this.renderThumb()}
        {this.renderHeader(d)}
        <div className={style.detailContainer}>
          {this.renderDetailFromFields(d, fields)}
        </div>
        <hr />
      </div>
    );
  }

  renderRows() {
    return this.props.entries.map( (d, i) => {
      let fields = RENDERED_FIELDS;
      return this.renderEntry(d, i, fields);
    });
  }

  render() {
    return (
      <div>
        {this.renderRows()}
      </div>
    );
  }
}

LitList.propTypes = {
  entries: React.PropTypes.array
};

export default LitList;
