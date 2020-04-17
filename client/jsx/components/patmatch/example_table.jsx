/* eslint-disable react/jsx-key */
/* eslint-disable react/display-name */
'use strict';

var React = require('react');

var DataTable = require('../widgets/data_table.jsx');

module.exports = {
  examples: function () {
    var rows = [];

    rows.push([
      'Peptide Searches',
      'IFVLWMAGCYPTSHEDQNKR',
      'Exact match',
      <span>
        <a href="/nph-patmatch?pattern=ELVIS" target="infowin">
          ELVIS
        </a>
      </span>,
    ]);
    rows.push([
      'Peptide Searches',
      'J',
      'Any hydrophobic residue (IFVLWMAGCY)',
      <span>
        <a href="/nph-patmatch?pattern=AAAAAAJJ" target="infowin">
          AAAAAAJJ
        </a>
      </span>,
    ]);
    rows.push([
      'Peptide Searches',
      'O',
      'Any hydrophilic residue (TSHEDQNKR)',
      <span>
        <a href="/nph-patmatch?pattern=GLFGO" target="infowin">
          GLFGO
        </a>
      </span>,
    ]);
    rows.push([
      'Peptide Searches',
      'B',
      'D or N',
      <span>
        <a href="/nph-patmatch?pattern=FLGB" target="infowin">
          FLGB
        </a>
      </span>,
    ]);
    rows.push([
      'Peptide Searches',
      'Z',
      'E or Q',
      <span>
        <a href="/nph-patmatch?pattern=GLFGZ" target="infowin">
          GLFGZ
        </a>
      </span>,
    ]);
    rows.push([
      'Peptide Searches',
      'X or .',
      'Any amino acid',
      <span>
        <a href="/nph-patmatch?pattern=DTXXDN..RQS" target="infowin">
          DTXXDN..RQS
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'ACTGU',
      'Exact match',
      <span>
        <a href="/nph-patmatch?seqtype=nuc&pattern=ACGGCGTA" target="infowin">
          ACGGCGTA
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'R',
      'Any purine base (AG)',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=AATTTGGRGGR"
          target="infowin"
        >
          AATTTGGRGGR
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'Y',
      'Any pyrimidine base (CT)',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=CCCATAYYGGYY"
          target="infowin"
        >
          CCCATAYYGGYY
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'S',
      'G or C',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=YGSTWCAMWTGTY"
          target="infowin"
        >
          YGSTWCAMWTGTY
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'W',
      'A or T',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=YGGTWCAMWTGTY"
          target="infowin"
        >
          YGGTWCAMWTGTY
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'M',
      'A or C',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=YGGTWCAMWTGTY"
          target="infowin"
        >
          YGGTWCAMWTGTY
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'K',
      'G or T',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=YGGTWCAMWTKTY"
          target="infowin"
        >
          YGGTWCAMWTKTY
        </a>
      </span>,
    ]);

    rows.push([
      'Nucleotide Searches',
      'V',
      'A or C or G',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=CGV...WH.{3,5}HW...CCG"
          target="infowin"
        >
          CGV...WH.{'3, 5'}HW...CCG
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'H',
      'A or C or T',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=CGH...WH.{3,5}HW...CCG"
          target="infowin"
        >
          CGH...WH.{'3, 5'}HW...CCG
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'D',
      'A or G or T',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=CGD...WH.{3,5}HW...CCG"
          target="infowin"
        >
          CGD...WH.{'3, 5'}HW...CCG
        </a>
      </span>,
    ]);
    rows.push([
      'Nucleotide Searches',
      'B',
      'C or G or T',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=CGB...WH.{3,5}HW...CCG"
          target="infowin"
        >
          CGB...WH.{'3, 5'}HW...CCG
        </a>
      </span>,
    ]);

    rows.push([
      'Nucleotide Searches',
      'N or X or .',
      'Any base',
      <span>
        <a
          href="/nph-patmatch?seqtype=nuc&pattern=ATGCNNNNNATCG"
          target="infowin"
        >
          ATGCNNNNNATCG
        </a>
      </span>,
    ]);
    rows.push([
      'All Searches',
      '[]',
      'A subset of elements',
      <span>
        <a
          href="/nph-patmatch?seqtype=pep&pattern=[WFY]XXXDN[RK][ST]"
          target="infowin"
        >
          [WFY]XXXDN[RK][ST]
        </a>
      </span>,
    ]);
    rows.push([
      'All Searches',
      '[^]',
      'An excluded subset of elements',
      <span>
        <a
          href="/nph-patmatch?seqtype=pep&pattern=NDBB...[VILM]Z[DE]...[^PG]"
          target="infowin"
        >
          NDBB...[VILM]Z[DE]...[^PG]
        </a>
      </span>,
    ]);
    rows.push([
      'All Searches',
      '()',
      'Specifies a sub-pattern',
      <span>
        <a
          href={'/nph-patmatch?seqtype=pep&pattern=(YDXXX){2,}'}
          target="infowin"
        >
          (YDXXX){'{2,}'}
        </a>
      </span>,
    ]);

    rows.push([
      'All Searches',
      '{m,n}',
      <span>
        <br />
        {'{m} = exactly m times'}
        <br />
        {'{m,} = at least m times'} <br />
        {'{,m} = 0 to m times'} <br />
        {'{m,n} = between m and n times'}
      </span>,
      <span>
        <a
          href={'/nph-patmatch?seqtype=pep&pattern=L{3,5}X{5}DGO'}
          target="infowin"
        >
          {'L{3,5}X{5}DGO'}
        </a>
      </span>,
    ]);

    rows.push([
      'All Searches',
      '<',
      "Constrains pattern to N-terminus or 5' end",
      <span>
        <br />
        <a href={'/nph-patmatch?seqtype=pep&pattern=<MNTD'} target="infowin">
          {'<MNTD'}
        </a>
        {' (pep)'} <br />
        <a
          href={'/nph-patmatch?seqtype=nuc&pattern=<ATGX{6,10}RTTRTT'}
          target="infowin"
        >
          {'<ATGX{6,10}RTTRTT'}
        </a>
        {' (nuc)'}
      </span>,
    ]);

    rows.push([
      'All Searches',
      '>',
      "Constrains pattern to C-terminus or 3' end",
      <span>
        <br />
        <a href={'/nph-patmatch?seqtype=pep&pattern=sjgo>'} target="infowin">
          {'sjgo>'}
        </a>
        {' (pep)'} <br />
        <a
          href={'/nph-patmatch?seqtype=nuc&pattern=yattrtga>'}
          target="infowin"
        >
          {'yattrtga>'}
        </a>
        {' (nuc)'}
      </span>,
    ]);

    var _tableData = {
      headers: [['Search type', 'Character', 'Meaning', 'Examples']],
      rows: rows,
    };

    // var _columns = [ { name: 'first', title: 'Search type' },
    //    	        { title: 'Character' },
    //		{ title: 'Meaning' },
    //		{ title: 'Examples' } ];
    //
    // var _rowsGroup = [ 'first:name' ];

    // return <DataTable data={_tableData} columns={_columns} rowsGroup={_rowsGroup}  />;

    var _dataTableOptions = {
      bPaginate: false,
      oLanguage: { sEmptyTable: '' },
    };
    return (
      <DataTable
        data={_tableData}
        usePlugin={true}
        pluginOptions={_dataTableOptions}
      />
    );
  },
};
