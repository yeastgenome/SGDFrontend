const React = require('react');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const Collapser = createReactClass({
  displayName: 'Collapser',
  propTypes: {
    label: PropTypes.string,
    children: PropTypes.any,
  },

  getDefaultProps() {
    return {
      label: 'Expand',
    };
  },

  getInitialState() {
    return {
      isCollapsed: true,
    };
  },

  render() {
    let isCollapsed = this.state.isCollapsed;
    let actionText = isCollapsed ? this.props.label : 'Hide';
    return (
      <div className="panel">
        <div className="text-right">
          <a onClick={this._toggleCollapse}>{actionText}</a>
        </div>
        {isCollapsed ? this._renderCollapsedNode() : this._renderActiveNode()}
      </div>
    );
  },

  _renderActiveNode() {
    return this.props.children;
  },

  _renderCollapsedNode() {
    return null;
  },

  _toggleCollapse(e) {
    if (e) e.preventDefault();
    this.setState((prevState) => ({ isCollapsed: !prevState.isCollapsed }));
  },
});

module.exports = Collapser;
