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
const Statics = require('../statics.jsx');
const TForm = require('../components/widgets/t_form.jsx');

const StyleGuide = React.createClass({
	render () {
    return (
      <div className='row'>
        <div className='columns small-2'>
          {this._renderNavBar()}
        </div>
        <div className='columns small-10'>
          <h1>Style Guide</h1>
          <hr />
          <div id='colors'>
            {this._renderColors()}
          </div>
          <div id='typeography' style={[style.sectionContainer]}>
            <h2>Typography</h2>
            <hr />
            <p>Headings are in a serif font.  Other text is in a sans-serif font.  The title of the page is an <code>h1</code> tag.  The sub-headings are <code>h2</code> tags, with an <code>hr</code> element underneath.  This page is a correct example.</p>
          </div>
          <div id='table' style={[style.sectionContainer]}>
            {this._renderTable()}
          </div>
          <div id='help' style={[style.sectionContainer]}>
            <h2>Help Icon</h2>
            <hr />
            <p>Add some inline text to help users. <HelpIcon text='To do the thing you want to do, eat more vegetables.' /></p>
          </div>
          <div id='buttons' style={[style.sectionContainer]}>
            <h2>Buttons</h2>
            <hr />
            <a className='button small secondary' style={[style.button]}>Basic</a>
            <a className='button small' style={[style.button]}>More Attention</a>
            <DownloadButton url="http://yeastgenome.org/fake-download" />
          </div>
          <div id='sequence' style={[style.sectionContainer]}>
            {this._renderSequence()}
          </div>
          <div id='forms' style={[style.sectionContainer]}>
            {this._renderForms()}
          </div>
          <div id='formatting' style={[style.sectionContainer]}>
            <h2>Formatting</h2>
            <hr />
            <p>Literature citations should be formatted in the following manner.</p>
            <div>
              <ul className='literature-list'>
                <li>
                  <a href='/reference/S000180759/overview'>Park E, et al. (2015)</a> <span>Structure of a Bud6/Actin Complex Reveals a Novel WH2-like Actin Monomer Recruitment Motif. Structure 23(8):1492-9</span> <small>PMID:26118535</small>
                  <ul className='ref-links'>
                    <li><a href='/reference/S000180759/overview'>SGD Paper</a></li>
                    <li><a href='http://www.ncbi.nlm.nih.gov/pubmed/23653364' targer='_blank'>PubMed</a></li>
                  </ul>
                </li>
              </ul>
            </div>
            <p>Or, for a summerized citation version (such as in a table), format like this.</p>
            <p><a href='/reference/S000180759/overview'>Park E, et al. (2015)</a> <small>PMID:26118535</small></p>
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
        name: 'Typography',
        target: 'typography'
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
      },
      {
        name: 'Formatting',
        target: 'formatting'
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
        text: Statics.GRAY,
        color: Statics.GRAY
      },
      {
        text: Statics.BLUE,
        color: Statics.BLUE
      },
      {
        text: Statics.PURPLE,
        color: Statics.PURPLE
      },
      {
        text: Statics.RED,
        color: Statics.RED
      }
    ];
    return (
      <div>
        <h2>Colors</h2>
        <hr />
        <p>As much as possible, ONLY the following colors should be used on SGD.</p>
        <Legend elements={_elements} />
        <p>Also, this is an example of the Legend component.</p>
      </div>
    );
  },

  _renderTable () {
    let rowData = [];
    for (var i = 20; i >= 0; i--) {
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
    let exampleObject = {
      title: 'Paper',
      type: 'object',
      properties: {
        title: { type: 'string' },
        abstract: { type: 'string' }
      },
      required: ['title']
    };
    let _onSubmit = (value) => { console.log(value); };
    return (
      <div>
        <h2>Forms</h2>
        <hr />
        <p>Forms can be created from JSON validation objects.</p>
        <TForm validationObject={exampleObject} submitText="Save" onSubmit={_onSubmit} />
      </div>
    );
  }
});

const style = {
  sectionContainer: { marginBottom: '1rem' },
  button: { margin: '0 1rem 1rem 0' }
};

const StyledStyleGuide = Radium(StyleGuide);

const styleGuideView = {};
styleGuideView.render = function () {
	ReactDOM.render(<StyledStyleGuide />, document.getElementById('j-main'));
};

module.exports = styleGuideView;
