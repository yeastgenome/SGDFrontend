export const TextField = React.createClass({
  propTypes: {
    displayName: React.PropTypes.string,
    paramName: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    iconClass: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    isReadOnly: React.PropTypes.bool
  },

  render () {
    return this.props.isReadOnly ? this._renderReadOnly() : this._renderEdit();
  },

  _renderReadOnly () {
    return (
      <div className='form-read-field'>
        <dl className='key-value'>
          <dt>{this._renderIcon()}{this.props.displayName}</dt>
          <dd>{this.props.defaultValue}</dd>
        </dl>
      </div>
    );
  },

  _renderEdit () {
    return (
      <div>
        <label>{this._renderIcon()}{this.props.displayName}</label>
        <textarea type='text' name={this.props.paramName} placeholder={this.props.placeholder}>{this.props.defaultValue}</textarea>
      </div>
    );
  },

  _renderIcon () {
    return this.props.iconClass ? <span><i className={`fa fa-${this.props.iconClass}`} /> </span> : null;
  }
});

