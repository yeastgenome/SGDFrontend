import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import _ from 'underscore';

import ColleaguesSearchResults from './search_results';
import Loader from '../../components/widgets/loader';
import apiRequest from '../../lib/api_request';

const COLLEAGUE_SEARCH_URL = '/colleagues';
const TRIAGED_COLLEAGUE_URL = '/triaged_colleagues';

const ColleaguesIndex = React.createClass({
  getInitialState() {
    return {
      searchResults: null,
      isPending: false,
      isTriageMode: true
    };
  },

  render () {
    return (
      <div>
        <h1>Colleagues</h1>
        <hr />
        <Link to='/curate/colleagues/new' className='button small'>
          <i className='fa fa-plus' /> Add New Colleague
        </Link>
        {this._renderTabsNode()}
        {this.state.isTriageMode ? this._renderTriageMode() : this._renderSearchMode()}
      </div>
    );
  },

  componentDidMount() {
    this._fetchData();
  },

  _renderTabsNode () {
    return (
      <ul style={[styles.tabList]}>
        <li style={[styles.tab, (this.state.isTriageMode ? styles.activeTab : null)]}><a onClick={this._onToggleTriageMode}><i className='fa fa-check'/> Triaged</a></li>
        <li style={[styles.tab, (!this.state.isTriageMode ? styles.activeTab : null)]}><a onClick={this._onToggleTriageMode}><i className='fa fa-search'/> Search</a></li>
      </ul>
    );
  },

  _onToggleTriageMode (e) {
    e.preventDefault();
    this.setState({ isTriageMode: !this.state.isTriageMode }, () =>{
      this._fetchData();
    });
  },

  _renderTriageMode () {
    return (
      <div className=''>
        {this._renderSearchResultsNodes()}
      </div>
    );
  },

  _renderSearchMode () {
    return (
      <div>
        {this._renderFormNode()}
        {this._renderSearchResultsNodes()}
      </div>
    );
  },

  _renderFormNode () {
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

  _renderSearchResultsNodes () {
    if (this.state.isPending) return <Loader />;
    if (this.state.searchResults) return <ColleaguesSearchResults results={this.state.searchResults} />;
    return null;
  },

  _onSubmit (e) {
    if (e) e.preventDefault();
    this._fetchData();
  },

  _fetchData () {
    
    let url;
    if (this.state.isTriageMode) {
      url = TRIAGED_COLLEAGUE_URL;
    } else {
      this.setState({ searchResults: [] });
      let query = this.refs.name.value.trim();
      // no blank query
      if (query === '') return;
      url = `${COLLEAGUE_SEARCH_URL}?last_name=${query}`;
    }
    this.setState({ isPending: true });
    apiRequest(url).then( response => {
      this.setState({
        isPending: false,
        searchResults: response
      });
    });
  }
});

const GRAY = '#cacaca';
const styles = {
  tabList: {
    marginTop: '1rem',
    marginLeft: 0,
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${GRAY}`
  },
  tab: {
    display: 'inline',
    padding: '0.75rem',
  },
  activeTab: {
    background: GRAY
  }
};

export default Radium(ColleaguesIndex);
