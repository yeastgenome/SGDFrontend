import React, { Component } from 'react';

import style from './style.css';
import CategoryLabel from '../../components/categoryLabel';
import DetailList from '../../components/detailList';
import { NON_HIGHLIGHTED_FIELDS } from '../../constants';
import ActionList from './actionList';

const DEFAULT_FIELDS = ['symbol', 'gene_symbol', 'name', 'gene_synonyms', 'synonyms', 'sourceHref', 'id', 'species', 'type'];
const LINK_URL = 'http://yeastgenome.org';

class ResultsList extends Component {
  renderHighlightedValues(highlight) {
    let _data = highlight;
    let _fields = Object.keys(_data).filter( d => {
      return (DEFAULT_FIELDS.indexOf(d) < 0) && (NON_HIGHLIGHTED_FIELDS.indexOf(d) < 0);
    });
    return <DetailList data={_data} fields={_fields} />;
  }

  renderHeader(d) {
    let href = `${LINK_URL}${d.href}`;
    return (
      <div>
        <span className={style.resultCatLabel}><CategoryLabel category={d.category} /></span>
        <h5>
          <a dangerouslySetInnerHTML={{ __html: d.display_name }} href={href} target='_new' />
        </h5>
      </div>
    );
  }

  renderDetailFromFields(d, fields) {
    return <DetailList data={d} fields={fields} />;
  }

  renderEntry(d, i, fields) {
    return (
      <div className={style.resultContainer} key={`sr${i}`}>
        {this.renderHeader(d)}
        {this.renderDetailFromFields(d, fields)}
        {this.renderHighlightedValues(d.highlight)}
        <ActionList category={d.category} href={d.href} />
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
