'use strict';

var React = require('react');
var _ = require('underscore');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

module.exports = createReactClass({
  displayName: 'RadioSelector',
  // elements, i.e.[ { name: "Doggy Woggy", key: "dog" }, ...]
  // onSelect(activeElementKey)
  propTypes: {
    elements: PropTypes.array.isRequired,
    initialActiveElementKey: PropTypes.string,
    onSelect: PropTypes.func,
  },

  getInitialState: function () {
    return {
      activeElementKey: this.props.initialActiveElementKey,
    };
  },

  componentDidUpdate: function () {
    if (this.props.onSelect) {
      this.props.onSelect(this.state.activeElementKey);
    }
  },

  shouldComponentUpdate: function (nextProps, nextState) {
    return this.state.activeElementKey !== nextState.activeElementKey;
  },

  render: function () {
    var inputs = _.map(this.props.elements, (d, i) => {
      var _onClick = (e) => {
        this.setState({
          activeElementKey: d.key,
        });
      };
      var _checked = d.key === this.state.activeElementKey;

      // make the width as wide as possible
      var widthPercent = `${(1 / this.props.elements.length) * 100}%`;

      return (
        <div
          className="radio-element-container"
          style={{ display: 'inline-block', width: widthPercent }}
          key={'radioElement' + i}
        >
          <input
            type="radio"
            onChange={_onClick}
            id={d.key}
            value={d.key}
            checked={_checked}
          />
          <label onClick={_onClick}>
            <span style={{ fontSize: 18 }}>{d.name}</span>
          </label>
        </div>
      );
    });
    return <div className="radio-selector">{inputs}</div>;
  },
});
