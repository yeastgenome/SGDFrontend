import React, { Component } from 'react';
import _ from 'underscore';

import Table from '../../components/table';

class ColleaguesIndex extends Component {
  render() {
    // TEMP example data
    let entries = [
      {
        name: {
          name: 'Travis Sheppard',
          href: '/curate/colleague_triage/123'
        },
        type: 'update',
        received: '4/5/2017'
      }
    ];
    let _fields = _.keys(entries[0]);
    return (
      <div>
        <h1>Pending Colleague Updates</h1>
        <Table entries={entries} fields={_fields} />
      </div>
    );
  }
}

export default ColleaguesIndex;
