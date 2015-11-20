import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';
import { connect } from 'react-redux';
import _ from 'underscore';
import Typeahead from 'react-typeahead-component';

const Actions = require('../actions');

const SearchOption = React.createClass({
  render () {
    let extraClass = this.props.isSelected ? ' active' : '';
    let _className = `react-typeahead-option${extraClass}`;
    let catNode = null;
    if (this.props.data.href) {
      catNode = <span> in <a href={this.props.data.href}>{this.props.data.category}</a></span>;
    }
    return (
      <div className={_className}>
        <p>{this.props.data.name}{catNode}</p>
      </div>
    );
  }
});

const AppSearchBar = React.createClass({
  propTypes: {
    userInput: React.PropTypes.string,
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
    return (
      <div> 
        <Typeahead
          inputValue={this.props.userInput}
          placeholder='Search'
          optionTemplate={SearchOption}
          options={this.props.autocompleteResults}
          onChange={this._onChange}
          onOptionChange={this._onOptionChange}
          onKeyDown={this._onKeyDown}
        />
      </div>
    );
  },

  _onKeyDown(e) {
    // press enter
    if (e.keyCode === 13) {
      this._submit()
    }
  },

  _onChange(e) {
    let newValue = e.target.value;
    this._setUserInput(newValue);
    let fetchAction = Actions.fetchAutocompleteResults();
    this.props.dispatch(fetchAction);

  },

  _setUserInput(newValue) {
    let typeAction = Actions.setUserInput(newValue);
    this.props.dispatch(typeAction);
  },

  _onOptionChange(e, data) {
    this._setUserInput(data.name);
  },

  _submit() {
    let newQuery = this.props.userInput;
    if (this.props.redirectOnSearch) {
      let newUrl = `/search?q=${newQuery}`;
      return this._hardRedirect(newUrl);
    }
    this._updateUrl(newQuery);
  },

  // update URL and HTML5 history with query param
  _updateUrl(query) {
    this.props.history.pushState(null, '/search', { q: query });
  },

  _hardRedirect (newUrl) {
    if (window) window.location.href = newUrl;
  },
});

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    userInput: state.userInput,
    autocompleteResults: state.autocompleteResults
  };
}

module.exports = connect(mapStateToProps)(AppSearchBar);
