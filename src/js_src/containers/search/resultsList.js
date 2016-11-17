import React, { Component } from 'react';
import { Link } from 'react-router';

import style from './style.css';
import CategoryLabel from './categoryLabel';
import DetailList from './detailList';
import { NON_HIGHLIGHTED_FIELDS } from '../../constants';

const DEFAULT_FIELDS = ['symbol', 'gene_symbol', 'name', 'gene_synonyms', 'synonyms', 'sourceHref', 'id', 'species', 'type'];

class ResultsList extends Component {
  renderHighlightedValues(highlight) {
    let _data = highlight;
    let _fields = Object.keys(_data).filter( d => {
      return (DEFAULT_FIELDS.indexOf(d) < 0) && (NON_HIGHLIGHTED_FIELDS.indexOf(d) < 0);
    });
    return <DetailList data={_data} fields={_fields} />;
  }

  renderHeader(d) {
    return (
      <div>
        <span className={style.resultCatLabel}><CategoryLabel category={d.category} /></span>
        <h4>
          <Link dangerouslySetInnerHTML={{ __html: d.display_name }} to={d.href} />
        </h4>
      </div>
    );
  }

  renderDetailFromFields(d, fields) {
    return <DetailList data={d} fields={fields} />;
  }

  renderEntry(d, i, fields) {
    let publicUrl = `http://yeastgenome.org${d.href}`;
    return (
      <div className={style.resultContainer} key={`sr${i}`}>
        {this.renderHeader(d)}
        {this.renderDetailFromFields(d, fields)}
        {this.renderHighlightedValues(d.highlight)}
        <div className='button-group'>
          <Link className='button' to={d.href}><i className='fa fa-edit' /> Curate</Link>
          <a className='button hollow' href={publicUrl} target='_new'>View on SGD</a>
        </div>
        <hr />
      </div>
    );
  }

  renderRows() {
    return this.props.entries.map( (d, i) => {
      let fields = [];
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

ResultsList.propTypes = {
  entries: React.PropTypes.array
};

export default ResultsList;
