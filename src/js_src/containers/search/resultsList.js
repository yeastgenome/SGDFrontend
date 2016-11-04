import React, { Component } from 'react';

import style from './style.css';
import CategoryLabel from './categoryLabel';
import DetailList from './detailList';
import LogList from './logList';
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
          <a dangerouslySetInnerHTML={{ __html: d.display_name }} href={d.href} target='_new' />
        </h4>
      </div>
    );
  }

  renderDetailFromFields(d, fields) {
    return <DetailList data={d} fields={fields} />;
  }

  renderNonGeneEntry(d, i, fields) {
    return (
      <div className={style.resultContainer} key={`sr${i}`}>
        {this.renderHeader(d)}
        {this.renderDetailFromFields(d, fields)}
        {this.renderHighlightedValues(d.highlight)}
        <hr />
      </div>
    );
  }

  renderGeneEntry(d, i) {
    let topFields = ['name', 'synonyms'];
    let bottomFields = ['species', 'gene_type'];
    let logHighlight = d.highlight['homologs.symbol'] || d.highlight['homologs.panther_family'];
    return (
      <div className={style.resultContainer} key={`sr${i}`}>
        {this.renderHeader(d)}
          {this.renderDetailFromFields(d, topFields)}
          <div className={style.detailContainer}>
            <span className={style.detailLabel}><strong>Source:</strong> </span>
            <span><a dangerouslySetInnerHTML={{ __html: d.id }} href={d.sourceHref} target='_new' /></span>
          </div>
          {this.renderDetailFromFields(d, bottomFields)}
          <LogList label='Homologs' logs={d.homologs} rawHighlight={logHighlight} />
          {this.renderHighlightedValues(d.highlight)}
        <hr />
      </div>
    );
  }

  renderRows() {
    return this.props.entries.map( (d, i) => {
      if (d.category === 'gene') {
        return this.renderGeneEntry(d, i);
      } else {
        let fieldVals = {
          'disease': ['synonyms', 'omim_id'],
          'go': ['synonyms', 'go_branch'],
        };
        let fields = fieldVals[d.category] || [];
        return this.renderNonGeneEntry(d, i, fields);
      }
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
