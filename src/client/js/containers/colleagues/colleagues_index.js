// import React from 'react';
// import { connect } from 'react-redux';
// import { Link } from 'react-router';

// const ColleaguesIndex = React.createClass({
//   render() {
//     return (
//       <div>
//         <h1>Colleagues</h1>
//         <hr />
//         <Link to='/curate/colleagues/new' className='button small'>
//           <i className='fa fa-plus' /> Add New Colleague
//         </Link>
//       </div>
//     );
//   }
// });

// function mapStateToProps(_state) {
//   return {
//   };
// }

// export default connect(mapStateToProps)(ColleaguesIndex);
import React from 'react';
import { Link } from 'react-router';
import _ from 'underscore';

import ColleaguesSearchResults from './search_results';

const COLLEAGUE_SEARCH_URL = '/colleagues';

const ColleaguesIndex = React.createClass({
  getInitialState: function() {
    return {
      searchResults: null,
      isPending: false
    };
  },

  render: function () {
    return (
      <div>
        <h1>Colleagues</h1>
        <hr />
        <Link to='/curate/colleagues/new' className='button small'>
          <i className='fa fa-plus' /> Add New Colleague
        </Link>
        {this._renderFormNode()}
        {this._renderSearchResultsNodes()}
      </div>
    );
  },

  _renderFormNode: function() {
    return (
      <div>
        <p>Search for a colleague by last name.</p>
        <form className='searchForm' autoComplete='off' onSubmit={this._onSubmit}>
          <div className='input-group'>
            <input className='input-group-field' type='text' ref='name' autoComplete='off' placeholder='Last Name (e.g.  "Jones")'/>
            <div className='input-group-button' >
              <input type='submit' className='button secondary' value='Search' />
            </div>
          </div> 
        </form>
      </div>
    );
  },

  _renderSearchResultsNodes: function() {
    if (this.state.isPending) return <div className='sgd-loader-container'><div className='sgd-loader'></div></div>;
    if (this.state.searchResults) return <ColleaguesSearchResults query={this.state.query} results={this.state.searchResults} />;
    return null;
  },

  _onSubmit: function (e) {
    if (e) e.preventDefault();
    var query = this.refs.name.value.trim();
    // no blank query
    if (query === '') return;
    fetch(`${COLLEAGUE_SEARCH_URL}?last_name=${query}`, {
      credentials: 'same-origin',
    }).then( response => {
      return response.json();
    }).then( json => {
      this.setState({
        isPending: false,
        searchResults: json
      });
    });
  }
});

export default ColleaguesIndex;
