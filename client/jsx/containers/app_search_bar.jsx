import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';
import { connect } from 'react-redux';
import _ from 'underscore';
import Typeahead from 'react-typeahead-component';
// TEMP
// require('isomorphic-fetch');

const Actions = require('../actions');

const SearchOption = React.createClass({
  render () {
    console.log(this.props)
    return (
      <div>
        <p>{this.props.data.name}</p>
      </div>
    );
  }
});

const AppSearchBar = React.createClass({
  propTypes: {
    redirectOnSearch: React.PropTypes.bool// if true, hard HTTP redirect to /search?q=${query}, if false, uses REDUX
  },

  getDefaultProps() {
    return {
      redirectOnSearch: true
    };
  },

  getInitialState() {
    return {
      inputValue: ''
    };
  },

  render() {
    let options = [
      { name: 'barz' }
    ];

    const _onChange = e => {
      let newValue = e.target.value;
      this.setState({ inputValue: newValue });
    }
    console.log(this.state)
    return (
      <div> 
        <Typeahead
          inputValue={this.state.inputValue}
          placeholder='Search'
          optionTemplate={SearchOption}
          options={options}
          onChange={_onChange}
        />
      </div>
    );
  },

  // componentWillMount() {
  //   if (typeof this.props.query !== 'undefined' && this.props.query !== '') this._dispatchSubmit();
  // },

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
