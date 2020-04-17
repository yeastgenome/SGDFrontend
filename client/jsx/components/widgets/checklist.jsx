'use strict';

var React = require('react');
var _ = require('underscore');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

var Checklist = createReactClass({
  displayName: 'Checklist',
  propTypes: {
    elements: PropTypes.array.isRequired, // [ { name: "Doggy Woggy", key: "dog" }, ...]
    initialActiveElementKeys: PropTypes.array,
    onSelect: PropTypes.func, // (activeElementKeys) =>
  },

  getDefaultProps: function () {
    return {
      initialActiveElementKeys: [],
    };
  },

  getInitialState: function () {
    return {
      activeElementKeys: this.props.initialActiveElementKeys,
    };
  },

  render: function () {
    var _currentActive = this.state.activeElementKeys;
    var inputs = _.map(this.props.elements, (d, i) => {
      var _isActive = _currentActive.indexOf(d.key) >= 0;
      var _onClick = (e) => {
        // e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        // add or remove key from active
        if (_isActive) {
          _currentActive = _.filter(_currentActive, (_d) => {
            return _d !== d.key;
          });
        } else {
          _currentActive.push(d.key);
        }
        if (this.props.onSelect) this.props.onSelect(_currentActive);
        this.setState({ activeElementKeys: _currentActive });
      };

      return (
        <div className="checklist-element-container" key={'checkElement' + i}>
          <input
            type="checkbox"
            onChange={_onClick}
            name={d.key}
            value={d.key}
            checked={_isActive}
            style={{ margin: 0 }}
          ></input>
          <label onClick={_onClick}>{d.name}</label>
        </div>
      );
    });

    return (
      <div>
        <div className="checklist" action="">
          {inputs}
        </div>
        {this._getAllToggleNode()}
      </div>
    );
  },

  _getAllToggleNode: function () {
    var hasAll =
      this.state.activeElementKeys.length === this.props.elements.length;
    var onClick, text;
    if (hasAll) {
      text = 'Deselect All';
      onClick = (e) => {
        e.preventDefault();
        if (this.props.onSelect) this.props.onSelect([]);
        this.setState({ activeElementKeys: [] });
      };
    } else {
      text = 'Select All';
      var _allKeys = _.map(this.props.elements, (d) => {
        return d.key;
      });
      onClick = (e) => {
        e.preventDefault();
        if (this.props.onSelect) this.props.onSelect(_allKeys);
        this.setState({ activeElementKeys: _allKeys });
      };
    }
    return <a onClick={onClick}>{text}</a>;
  },
});

module.exports = Checklist;
