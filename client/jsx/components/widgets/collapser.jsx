const React = require('react');
const _ = require('underscore');

const Collapser = React.createClass({
  propTypes: {
    label: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      label: 'Expand'
    };
  },

  getInitialState() {
    return {
      isCollapsed: true
    };
  },

  render() {
    let isCollapsed = this.state.isCollapsed;
    let actionText = isCollapsed ? this.props.label : 'Hide';
    return (
      <div className='panel'>
        <div className='text-right'>
          <a onClick={this._toggleCollapse}>{actionText}</a>
        </div>
        {isCollapsed ? this._renderCollapsedNode() : this._renderActiveNode()}
      </div>
    );
  },

  _renderActiveNode () {
    return this.props.children;
  },

  _renderCollapsedNode () {
    return null;
  },

  _toggleCollapse(e) {
    if (e) e.preventDefault();
    this.setState({ isCollapsed: !this.state.isCollapsed });
  }
});

module.exports = Collapser;
