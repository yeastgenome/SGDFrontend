import React from 'react';
import { Link } from 'react-router';

import style from './style.css';
import Table from '../../components/table';

class LitTable extends Table {
  renderCitation(d) {
    let urlSegment = d.isTrage ? 'triage_lit' : 'curate_lit';
    let url = `${urlSegment}/${d.id}`;
    return <Link to={url}>{d.citation}</Link>;
  }

  renderAssignees(users) {
    return users.map( d => d.name ).join(', ');
  }

  renderTags(tags) {
    return tags.map( (d, i) => {
      return <span className={`label ${style.tag}`} key={'tag' + i}>{d}</span>;
    });
  }

  renderSingleEntry(entry, entryI) {
    let nodes = this.props.fields.map( (d, i) => {
      let data = entry[d];
      if (d === 'assignees') {
        data = this.renderAssignees(data);
      } else if (d === 'tags') {
        data = this.renderTags(data);
      } else if (d === 'citation') {
        data = this.renderCitation(entry);
      }
      return <td key={`td${entryI}.${i}`}>{data}</td>;
    });
    return (
      <tr key={'tr' + entryI}>
        {nodes}
      </tr>
    );
  }
}

LitTable.propTypes = {
  entries: React.PropTypes.array,
  fields: React.PropTypes.array
};

export default LitTable;
