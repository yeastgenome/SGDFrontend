import React from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';

// internal dependencies
const DataTable = require('../components/widgets/data_table.jsx');
const DownloadButton = require('../components/widgets/download_button.jsx');
const HelpIcon = require('../components/widgets/help_icon.jsx');
const Legend = require('../components/viz/legend.jsx');
const NavBar = require('../components/widgets/navbar.jsx');
const SequenceToggler = require('../components/sequence/sequence_toggler.jsx');

const StyleGuide = React.createClass({
	render () {
    return (
      <div className='row'>
        <div className='columns small-3'>
          {this._renderNavBar()}
        </div>
        <div className='columns small-9'>
          <h1>Style Guide</h1>
          <hr />
          <div id='colors'>
            {this._renderColors()}
          </div>
          <div id='typeography'>
            <h2>Typeography</h2>
            <hr />
            <p>Headings are in a serif font.  Other text is in a sans-serif font.  The title of the page is an <code>h1</code> tag.  The sub-headings are <code>h2</code> tags, with an <code>hr</code> element underneath.  This page is a correct example.</p>
          </div>
          <div id='table'>
            {this._renderTable()}
          </div>
          <div id='help'>
            <h2>Help Icon</h2>
            <hr />
            <p>Add some inline text to help users. <HelpIcon text='To do the thing you want to do, eat more vegetables.' /></p>
          </div>
          <div id='buttons'>
            <h2>Buttons</h2>
            <hr />
            <a className='button small secondary'>Basic</a>
            <a className='button small'>More Attention</a>
            <DownloadButton url="http://yeastgenome.org/fake-download" />
          </div>
          <div id='sequence'>
            {this._renderSequence()}
          </div>
          <div id='forms'>
            {this._renderForms()}
          </div>
        </div>
      </div>
    );
  },

  _renderNavBar () {
    let _elements = [
      {
        name: 'Colors',
        target: 'colors'
      },
      {
        name: 'Typeography',
        target: 'typeography'
      },
      {
        name: 'Table',
        target: 'table'
      },
      {
        name: 'Help',
        target: 'help'
      },
      {
        name: 'Buttons',
        target: 'buttons'
      },
      {
        name: 'Sequence',
        target: 'sequence'
      },
      {
        name: 'Forms',
        target: 'forms'
      }
    ];
    return <NavBar elements={_elements} />;
  },

  _renderColors () {
    let _elements = [
      {
        text: 'Black',
        color: 'black'
      },
      {
        text: '#b9b9b9',
        color: '#b9b9b9'
      },
      {
        text: '#11728b',
        color: '#11728b'
      },
      {
        text: '#682A87',
        color: '#682A87'
      },
      {
        text: '#D70029',
        color: '#D70029'
      }
    ];
    return (
      <div>
        <h2>Colors</h2>
        <hr />
        <p>As much as possible, ONLY the following colors should be used on SGD.</p>
        <Legend elements={_elements} />
      </div>
    );
  },

  _renderTable () {
    let rowData = [];
    for (var i = 50; i >= 0; i--) {
      rowData.push([`val${i}`, 'value', i, 'Foobar', 'bizz buzz'])
    };
    let _data = {
      headers: [
        ['Col1', 'Col2', 'Col3', 'Col4', 'Col5']
      ],
      rows: rowData
    };
    return (
      <div>
        <h2>Table</h2>
        <hr />
        <DataTable data={_data} usePlugin={true} />
      </div>
    );
  },

  _renderSequence () {
    let _sequences = [
      {
        name: 'DNA Coding',
        sequence: 'ATG',
        key: 'dna1'
      },
      {
        name: 'Protein',
        sequence: 'MDSEVAALVIDNGSG',
        key: 'protein1'
      }
    ];
    return (
      <div>
        <h2>Sequence</h2>
        <hr />
        <SequenceToggler locusDisplayName='RAD54' sequences={_sequences} />
      </div>
    );
  },

  _renderForms () {
    return (
      <div>
        <h2>Forms</h2>
        <hr />
      </div>
    );
  }
});

const style = {
};

const StyledStyleGuide = Radium(StyleGuide);

const styleGuideView = {};
styleGuideView.render = function () {
	ReactDOM.render(<StyledStyleGuide />, document.getElementById('j-main'));
};

module.exports = styleGuideView;
