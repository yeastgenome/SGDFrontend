import React from 'react';

import Table from '../../components/table';

class LitTable extends Table {
  renderAssignees(users) {
    return users.map( d => d.name ).join(', ');
  }

  renderTags(tags) {
    return tags.map( (d, i) => {
      return <span className='label' key={'tag' + i}>{d}</span>;
    });
  }

  renderSingleEntry(entry, entryI) {
    let nodes = this.props.fields.map( (d, i) => {
      let data = entry[d];
      if (d === 'assignees') {
        data = this.renderAssignees(data);
      } else if (d === 'tags') {
        data = this.renderTags(data);
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
