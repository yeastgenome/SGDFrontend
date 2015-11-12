import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';
import { connect } from 'react-redux';
import Select from 'react-select';
import _ from 'underscore';
// TEMP
require('isomorphic-fetch');

const Actions = require('../actions');

const AppSearchBar = React.createClass({
  render() {
    const _onChange = (newQuery, selectedOptions) => {
      if (selectedOptions[0].href) this._redirect(selectedOptions[0].href);
      this._submit(newQuery);
    };

    const _valueRenderer = val => {
      return <div className='Select-placeholder'>{val.value}</div>;
    };

    const _optionRenderer = val => {
      if (val.href) {
        let _type = (val.type === 'gene_name') ? 'Loci' : val.type;
        return <div className='has-link'><a className='linked-result' href={val.href}>{val.label}</a> in {_type}</div>;
      } else {
        return <div>{val.label}</div>;
      }      
    };

    // cb(null, data)
    const _asyncOptions = (query, cb) => {
      let url = `/backend/autocomplete_results?term=${query}`
      fetch(url).then( response => {
        return response.json();
      }).then( response => {
        if (query === '') return cb(null, { complete: false, options: [] });
        let formattedResponse = response.map( d => {
          return { value: d.name, label: d.name, href: d.href, type: d.type };
        });
        formattedResponse.unshift({ value: query, label: `Search for "${query}"`, forceResults: true }); // TEMP add fake autcomplete query
        cb(null, { complete: false, options: formattedResponse });
      });
    };


    return (
      <div> 
        <Select
          name="form-field-name"
          asyncOptions={_asyncOptions}
          onChange={_onChange}
          searchable={true}
          placeholder="Search"
          value={this.props.query}
          filterOption={() => { return true; }}
          valueRenderer={_valueRenderer}
          optionRenderer={_optionRenderer}
          autoload={false}
        />
      </div>
    );
  },

  componentWillMount() {
    if (typeof this.props.query !== 'undefined' && this.props.query !== '') this._dispatchSubmit();
  },

  _submit(newQuery) {
    this._updateUrl(newQuery);
    this._dispatchSubmit(newQuery);
  },

  // update URL and HTML5 history with query param
  _updateUrl(query) {
    this.props.history.pushState(null, '/search', { q: query });
  },

  _dispatchSubmit(query) {
    query = query || this.props.query;
    let startAction = Actions.startSearchFetch(query);
    let fetchAction = Actions.fetchSearchResults(query);
    this.props.dispatch(startAction);
    this.props.dispatch(fetchAction);   
  },

  _redirect (newUrl) {
    if (window) window.location.href = newUrl;
  },
});

const style = {

};

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    query: state.query,
  };
}

const StyledComponent = AppSearchBar;
module.exports = connect(mapStateToProps)(StyledComponent);
