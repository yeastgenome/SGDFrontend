/*eslint-disable react/no-set-state */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Autosuggest from 'react-autosuggest';
import { push } from 'react-router-redux';

import style from './style.css';
import CategoryLabel from '../../search/categoryLabel';
// import fetchData from '../../../lib/fetchData';

// const AUTO_BASE_URL = '/api/search_autocomplete';

class SearchBarComponent extends Component {
  constructor(props) {
    super(props);
    let initValue = this.props.queryParams.q || '';
    this.state = {
      autoOptions: [],
      value: initValue
    };
  }

  handleClear() {
    this.setState({ autoOptions: [] });
  }

  handleOptionSelected(selected) {
    this.dispatchSearchFromQuery(selected);
  }

  handleSelect() {
    // let newCatOption = CATEGORIES.filter( d => d.name === eventKey )[0];
    // this.setState({ catOption: newCatOption });
  }

  handleSubmit(e) {
    if (e) e.preventDefault();
    let query = this.state.value;
    let newQp = { q: query };
    if (query === '') newQp = {};
    this.props.dispatch(push({ pathname: 'search', query: newQp }));
  }

  handleTyping(e, { newValue }) {
    this.setState({ value: newValue });
  }

  handleFetchData() {
    return;
    // let query = value;
    // let cat = this.state.catOption.name;
    // let catSegment = cat === DEFAULT_CAT.name ? '' : ('&category=' + cat);
    // let url = AUTO_BASE_URL + '?q=' + query + catSegment;
    // fetchData(url)
    //   .then( (data) => {
    //     let newOptions = data.results || [];
    //     this.setState({ autoOptions: newOptions });
    //   });
  }

  renderSuggestion(d) {
    return (
      <div className={style.autoListItem}>
        <span>{d.name}</span>
        <span className={style.catContainer}>
          <CategoryLabel category={d.category} />
        </span>
      </div>
    );
  }

  render() {
    let _getSuggestionValue = ( d => d.name );
    let _inputProps = {
      placeholder: 'search',
      value: this.state.value,
      onChange: this.handleTyping.bind(this)
    };
    let _theme = {
      container: style.autoContainer,
      containerOpen: style.autoContainerOpen,
      input: style.autoInput,
      suggestionsContainer: style.suggestionsContainer,
      suggestionsList: style.suggestionsList,
      suggestion: style.suggestion,
      suggestionFocused: style.suggestionFocused
    };
    return (
      <div className={style.container}>
        <form onSubmit={this.handleSubmit.bind(this)} ref='form'>
          <Autosuggest
            getSuggestionValue={_getSuggestionValue}
            inputProps={_inputProps}
            onSuggestionsClearRequested={this.handleClear.bind(this)}
            onSuggestionsFetchRequested={this.handleFetchData.bind(this)}
            renderSuggestion={this.renderSuggestion}
            suggestions={this.state.autoOptions}
            theme={_theme}
          />
        </form>
        <i className={`fa fa-search ${style.searchIcon}`} /> 
      </div>
    );
  }
}

SearchBarComponent.propTypes = {
  dispatch: React.PropTypes.func,
  queryParams: React.PropTypes.object,
  searchUrl: React.PropTypes.string
};

function mapStateToProps(state) {
  let location = state.routing.locationBeforeTransitions;
  let _queryParams = location ? location.query : {};
  return {
    queryParams: _queryParams
  };
}
export { SearchBarComponent as SearchBarComponent };
export default connect(mapStateToProps)(SearchBarComponent);
