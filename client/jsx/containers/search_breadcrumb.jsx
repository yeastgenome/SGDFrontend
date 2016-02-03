import React from 'react';
import { connect } from 'react-redux';

const SearchBreadcrumb = React.createClass({
  render() {
    return (
      <h2>Showing results for {this.props.query}</h2>
    );
  }
});

function mapStateToProps(_state) {
  let state = _state.searchResults;
  return {
    results: state.results,
    total: state.total,
    query: state.query,
    activeCategory: state.activeCategory,
    activeSecondaryAggs: state.activeSecondaryAggs
  };
};

module.exports = connect(mapStateToProps)(SearchBreadcrumb);
