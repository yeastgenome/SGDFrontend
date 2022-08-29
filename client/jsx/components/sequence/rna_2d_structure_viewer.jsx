'use strict';

var React = require('react');
var _ = require('underscore');
import createReactClass from 'create-react-class';
var DataTable = require('../widgets/data_table.jsx');
var HelpIcon = require('../widgets/help_icon.jsx');
import PropTypes from 'prop-types';

module.exports = createReactClass({
  displayName: 'HistoryTable',

  propTypes: {
    data: PropTypes.array,
    dataType: PropTypes.string,
  },

  getDefaultProps: function () {
    return {
      data: [], // * []
      dataType: 'SEQUENCE',
    };
  },

  render: function () {
    // filter data to desired type
    var historyData = _.where(this.props.data, {
      history_type: this.props.dataType,
    });

    // format history data for table
    var _tableRows = _.map(historyData, (e) => {
      var noteNode = <span dangerouslySetInnerHTML={{ __html: e.note }} />;
      var refsNode = _.map(e.references, (r, i) => {
        var pubmedNode = r.pubmed_id ? (
          <small> PMID:{r.pubmed_id}</small>
        ) : null;
        var sepNode = i > 0 && i !== e.references.length - 1 ? ', ' : null;
        return (
          <span key={i}>
            <a href={r.link}>{r.display_name}</a>
            {pubmedNode}
            {sepNode}
          </span>
        );
      });
      return [e.date_created, noteNode, refsNode];
    });
    var _tableData = {
      headers: [['Date', 'Note', 'References']],
      rows: _tableRows,
    };

    var _dataTableOptions = {
      bPaginate: false,
      oLanguage: { sEmptyTable: 'No history.' },
    };

    return (
      <section id="history">
        <h2>
          History{' '}
          <HelpIcon
            isInfo={true}
            text="Documentation regarding nomenclature for this locus. May also contain notes and references for the mapping of this gene."
          />
        </h2>
        <hr />
        <DataTable
          data={_tableData}
          usePlugin={true}
          pluginOptions={_dataTableOptions}
        />
      </section>
    );
  },
});
