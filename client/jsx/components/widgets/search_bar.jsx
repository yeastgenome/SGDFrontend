'use strict';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
var React = require('react');

var SearchBar = createReactClass({
  displayName: 'SearchBar',
  propTypes: {
    placeholderText: PropTypes.string,
    onSubmit: PropTypes.func, // query =>
  },

  getDefaultProps: function () {
    return {
      placeholderText: '',
    };
  },

  getInitialState: function () {
    return {
      query: '',
    };
  },

  render: function () {
    var exitNode =
      this.state.query === '' ? null : (
        <span
          onClick={this._clear}
          style={{
            position: 'absolute',
            top: 5,
            right: '1rem',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          <i className="fa fa-times"></i>
        </span>
      );
    return (
      <div>
        <form onSubmit={this._onSubmit} style={{ display: 'flex' }}>
          <div
            style={{
              width: '80%',
              position: 'relative',
              display: 'inline-block',
            }}
          >
            {exitNode}
            <input
              onChange={this._onType}
              type="text"
              ref={(searchInput) => (this.searchInput = searchInput)}
              placeholder={this.props.placeholderText}
              value={this.state.query}
              style={{ borderRadius: '3px 0 0 3px' }}
            />
          </div>
          <div style={{ width: '20%', display: 'inline-block' }}>
            <input
              type="submit"
              href="#"
              className="button secondary postfix"
              value="Filter"
            />
          </div>
        </form>
      </div>
    );
  },

  _onType: function (e) {
    this.setState({ query: this.searchInput.value });
  },

  _onSubmit: function (e) {
    if (e) e.preventDefault();
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.query);
    }
  },

  _clear: function (e) {
    this.setState({ query: '' });
    if (this.props.onSubmit) {
      this.props.onSubmit('');
    }
  },
});

module.exports = SearchBar;
