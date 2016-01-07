import React from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';

// internal dependencies
const NavBar = require('../components/widgets/navbar.jsx');
const Legend = require('../components/viz/legend.jsx');

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
            <h3>Typeography</h3>
            <hr />
            <p>Headings are in a serif font.  Other text is in a sans-serif font.</p>
            <p>The title of the page is an <code>h1</code> tag.  The sub-headings are <code>h3</code> tags, with a <code>hr</code> element underneath.  This page is a correct example.</p>
          </div>
          <div id='nav'>
          </div>
          <div id='table'>
          </div>
          <div id='help'>
          </div>
          <div id='buttons'>
          </div>
          <div id='sequence'>
          </div>
          <div id='forms'>
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
        name: 'Nav Bar',
        target: 'nav'
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
