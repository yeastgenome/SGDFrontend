import React, { Component } from 'react';

import style from './style.css';
import CategoryLabel from '../../components/categoryLabel';
import DetailList from '../../components/detailList';
import { makeFieldDisplayName } from '../../lib/searchHelpers';
import { NON_HIGHLIGHTED_FIELDS } from '../../constants';
import ActionList from './actionList';

const MATCH_LABEL = 'match_by';
const MAX_CHAR = 100;
const SGD_LINK_URL = 'https://www.yeastgenome.org';

class ResultsTable extends Component {
  getFields() {
    let fields = ['display_name', MATCH_LABEL, 'actions'];
    return fields;
  }

  renderHeader() {
    let fields = this.getFields();
    let nodes = fields.map( (d) => {
      let processedName;
      if (d === 'display_name') {
        processedName = 'name';
      } else {
        processedName = d;
      }
      return <th className={style.tableHeadCell} key={`srH.${d}`}>{makeFieldDisplayName(processedName)}</th>;
    });
    return (
      <tr>
        {nodes}
      </tr>
    );
  }

  renderTruncatedContent(original) {
    original = original || '';
    if (Array.isArray(original)) {
      original = original.join(', ');
    }
    if (original.length > MAX_CHAR) {
      return original.slice(0, MAX_CHAR) + '...';
    } else {
      return original;
    }
  }

  renderActions(d) {
    return <ActionList category={d.category} href={d.href} id={d.id} />;
  }

  renderRows() {
    let entries = this.props.entries;
    let fields = this.getFields();
    let rowNodes = entries.map( (d, i) => {
      let href = `${SGD_LINK_URL}${d.href}`;
      let nodes = fields.map( (field) => {
        let _key = `srtc.${i}.${field}`;
        switch(field) {
        case 'display_name':
        case 'symbol':
          return <td key={_key}><CategoryLabel category={d.category} hideLabel /> <a href={href} target='_new'>{d[field]}</a></td>;
        case MATCH_LABEL:
          return <td key={_key}>{this.renderHighlight(d.highlight, d.homologs)}</td>;
        case 'species':
          return <td key={_key}><i dangerouslySetInnerHTML={{ __html: d.species }} /></td>;
        case 'actions':
          return <td key={_key}>{this.renderActions(d)}</td>;
        default:
          return <td dangerouslySetInnerHTML={{ __html: this.renderTruncatedContent(d[field]) }} key={_key} />;
        }
      });
      return (
        <tr key={`tr${i}`}>
          {nodes}
        </tr>
      );
    });
    return (
      <tbody>
        {rowNodes}
      </tbody>
    );
  }

  renderHighlight(highlight) {
    let _data = highlight;
    let _fields = Object.keys(_data).filter( d => {
      return (NON_HIGHLIGHTED_FIELDS.indexOf(d) < 0);
    });
    return (
      <div>
        <DetailList data={_data} fields={_fields} />
      </div>
    );
  }

  render() {
    let emptyNode = (this.props.entries.length === 0) ? <p className={style.tableEmpty}>No results</p> : null;
    return (
      <div className={style.tableContainer}>
        <table className='table'>
          <thead className='thead-default'>
            {this.renderHeader()}
          </thead>
          {this.renderRows()}
        </table>
        {emptyNode}
      </div>
    );
  }
}

ResultsTable.propTypes = {
  entries: React.PropTypes.array
};

export default ResultsTable;
