import React from 'react';
import _ from 'underscore';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const DropdownSelector = createReactClass({
  displayName: 'DropDownSelector',
  propTypes: {
    elements: PropTypes.any,
    defaultActiveValue: PropTypes.any,
    isDisabled: PropTypes.any,
    onChange: PropTypes.any,
  },
  getDefaultProps: function () {
    return {
      elements: null, // * [{ name: "Foo", value: "foo" }]
      onChange: null, // (value) =>
      defaultActiveValue: null,
      isDisabled: function (e) {
        return false;
      },
    };
  },

  getInitialState: function () {
    return {
      activeValue:
        this.props.defaultActiveValue || this.props.elements[0].value,
    };
  },

  render: function () {
    var optionsNodes = _.map(this.props.elements, (e, i) => {
      var _disabled = this.props.isDisabled(e);
      return (
        <option value={e.value} disabled={_disabled} key={'dropOp' + i}>
          {e.name}
        </option>
      );
    });

    var descriptionNode = null;
    var _description = this._getActiveElement().description;
    if (_description) {
      descriptionNode = <span> - {_description}</span>;
    }

    return (
      <span>
        <select
          onChange={this._handleChange}
          className="large-3"
          value={this.state.activeValue}
        >
          {optionsNodes}
        </select>
        {descriptionNode}
      </span>
    );
  },

  _handleChange: function (e) {
    var _newValue = e.currentTarget.value;
    if (this.props.onChange) {
      this.props.onChange(_newValue);
    }
    this.setState({ activeValue: _newValue });
  },

  _getActiveElement: function () {
    return _.findWhere(this.props.elements, { value: this.state.activeValue });
  },
});

module.exports = DropdownSelector;
