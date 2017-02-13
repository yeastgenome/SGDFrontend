import React, { Component } from 'react';

class Table extends Component {
  formatHeader(d) {
    return d;
  }

  renderHeader() {
    let headerNodes = this.props.fields.map( (d,i) => {
      return <th key={'th' + i}>{this.formatHeader(d)}</th>;
    });
    return (
      <thead>
        <tr>{headerNodes}</tr>
      </thead>
    );
  }

  renderSingleEntry(entry, entryI) {
    let nodes = this.props.fields.map( (d, i) => {
      let data = entry[d];
      return <td key={`td${entryI}.${i}`}>{data}</td>;
    });
    return (
      <tr key={'tr' + entryI}>
        {nodes}
      </tr>
    );
  }

  renderBody() {
    let rowNodes = this.props.entries.map(this.renderSingleEntry.bind(this));
    return (
      <tbody>
        {rowNodes}
      </tbody>
    );
  }

  render() {
    return (
      <div>
        <table>
          {this.renderHeader()}
          {this.renderBody()}
        </table>
      </div>
    );
  }
}

Table.propTypes = {
  entries: React.PropTypes.array,
  fields: React.PropTypes.array
};

export default Table;
