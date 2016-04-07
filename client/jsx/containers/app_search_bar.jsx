import 'isomorphic-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux';
import _ from 'underscore';
// manually installed to fix react 14 warnings and problem installing from github
import Typeahead from '../lib/react-typeahead-component';

import { setUserInput } from '../actions/search_actions';
import { getCategoryDisplayName } from '../lib/search_helpers';

const AUTOCOMPLETE_URL = '/backend/autocomplete_results';

const SearchOption = React.createClass({
  render () {
    let extraClass = this.props.isSelected ? ' active' : '';
    let _className = `react-typeahead-option${extraClass}`;
    let catNode = null;
    if (this.props.data.href) {
      catNode = <span style={{ float: 'right' }}><span className={`search-cat ${this.props.data.category}`}/> <a href={this.props.data.href}>{this.props.data.categoryName}</a></span>;
    }
    if (this.props.data.isShowAll) {
      return (
        <div className={`${_className} show-all`}>
          <p>Show all results ...</p>
        </div>
      );
    }
    return (
      <div className={_className}>
        <p>{catNode}<a>{this.props.data.name}</a></p>
      </div>
    );
  }
});

const AppSearchBar = React.createClass({
  propTypes: {
    resultsUrl: React.PropTypes.string.isRequired,
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
      redirectHref: null,
      isShowAll: false,
      autocompleteResults: []
    };
  },

  render() {
    return (
      <div className='sgd-search-container'> 
        <Typeahead
          inputValue={this.props.userInput}
          placeholder='Search'
          optionTemplate={SearchOption}
          options={this.state.autocompleteResults}
          onChange={this._onChange}
          onOptionChange={this._onOptionChange}
          onOptionClick={this._onOptionClick}
          onKeyDown={this._onKeyDown}
          autoFocus={true}
        />
        <span className='search-icon'><i className='fa fa-search'/></span>
      </div>
    );
  },

  // submit when user pushes return key
  _onKeyDown(e) {
    if (e.keyCode === 13) {
      this._submit();
    }
  },

  // save user input to redux and fetch results, save them to state
  _onChange(e) {
    let newValue = e.target.value;
    this._setUserInput(newValue);
    let url = `${this.props.resultsUrl}?q=${this.props.userInput}`;
    fetch(url)
      .then( function (response) {
          if (response.status >= 400) {
            throw new Error('API error.');
          }
          return response.json();
        }).then( jsonResponse => {
          // change result labels
          let results = jsonResponse.results.map( d => {
            d.categoryName = getCategoryDisplayName(d.category);
            return d;
          });
          // add 'show all'
          results.unshift({ isShowAll: true, name: this.props.userInput });
          // save results to state
          if (this.isMounted()) this.setState({ autocompleteResults: results });
        }).catch(function(err) {
          console.warn('Unable to fetch autocomplete results.');
        });
  },

  _setUserInput(newValue, href, _isShowAll, cb) {
    let typeAction = setUserInput(newValue);
    this.props.dispatch(typeAction);
    this.setState({ redirectHref: href, isShowAll: _isShowAll }, cb);
  },

  _onOptionChange(e, data) {
    this._setUserInput(data.name, data.href, data.isShowAll);
  },

  _onOptionClick(e, data) {
    if (e) e.preventDefault();
    this._setUserInput(data.name, data.href, data.isShowAll, this._submit);
  },

  _submit() {
    if (typeof this.state.redirectHref === 'string') {
      return this._hardRedirect(this.state.redirectHref)
    }
    let newQuery = this.props.userInput;
    if (this.props.redirectOnSearch) {
      // format query param, use isShowAll is to append
      let newUrl = `/search?q=${newQuery}&is_quick=${this.state.isShowAll ? 'false' : 'true'}`;
      return this._hardRedirect(newUrl);
    }
    this._updateUrl(newQuery);
  },

  // update URL and HTML5 history with query param
  _updateUrl(query) {
    this.props.dispatch(routeActions.push({ pathname: '/search', query: { q: query }}));
  },

  _hardRedirect (newUrl) {
    if (window) window.location.href = newUrl;
  },
});

function mapStateToProps(_state) {
  const state = _state.searchResults;
  return {
    userInput: state.userInput,
    redirectOnSearch: true,
    resultsUrl: AUTOCOMPLETE_URL
  };
}

module.exports = connect(mapStateToProps)(AppSearchBar);
