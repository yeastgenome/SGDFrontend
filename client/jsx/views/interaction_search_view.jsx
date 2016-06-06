import React from 'react';
import ReactDOM from 'react-dom';

const InteractionSearch = React.createClass({
  render () {
    return (
      <div className='row'>
        <h1 className='text-center'>Search for Physical and Genetic Interactions pages at SGD</h1>
        <div className='columns medium-3 hide-for-small'>
          &nbsp;
        </div>
        <div className='columns small-12 medium-6'>
          
          <div className='panel'>
            <p>
              Enter a gene name (e.g. DOG1), systematic ORF name (e.g. YDR477W) or an SGDID (e.g.S000005574). Search is not case-sensitive.
            </p>
            <div className='row collapse'>
              <div className='columns small-10'>
                <form onSubmit={this._onSearch}>
                  <input type='text' ref='searchText' placeholder='gene name (e.g. DOG1)' style={{ borderRadius: '3px 0 0 3px' }}/>
                </form>
              </div>
              <div className='columns small-2'>
                <a className='button postfix secondary' onClick={this._onSearch}>Search</a>
              </div>       
            </div>
          </div>
        </div>
        <div className='columns medium-3 hide-for-small'>
          &nbsp;
        </div>
      </div>
    );
  },

  _onSearch (e) {
    e.preventDefault();
    let value = this.refs.searchText.value;
    // redirect to interaction page for search value
    let newHref = `/locus/${value}/interaction`;
    if (document) document.location = newHref;
  }
});

const interactionSearchView = {};
interactionSearchView.render = function () {
  ReactDOM.render(<InteractionSearch />, document.getElementById('j-main'));
};

module.exports = interactionSearchView;
