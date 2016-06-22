import React from 'react';

const EditableList = React.createClass({
	propTypes: {
    defaultValues: React.PropTypes.array,
    onUpdate: React.PropTypes.func, // onUpdate(values)
    placeholder: React.PropTypes.string
  },

  getInitialState() {
    // values just array of flat strings ['good thing', 'agree +1']
    return {
      values: this.props.defaultValues || []
    };
  },

  render () {
    return (
      <div>
        {this._renderValues()}
        <textarea ref='inputText' placeholder={this.props.placeholder} />
        <div className='text-right'>
          <a onClick={this._onAddValue} className='button secondary small'>Add</a>
        </div>
      </div>
    );
  },

  // call onUpdate prop if defined and values changed
  componentDidUpdate(prevProps, prevState) {
    if (this.state.values !== prevState.values && typeof this.props.onUpdate === 'function') {
      this.props.onUpdate(newValues);
    }
  },

  _renderValues () {
    let nodes = this.state.values.map( (d, i) => {
      return <li key={`editLI${i}`}>{d}</li>;
    });
    return (
      <ul>{nodes}</ul>
    );
  },

  _onAddValue (e) {
    e.preventDefault();
    let content = this.refs.inputText.value;
    let newValues = this.state.values;
    newValues.push(content);
    this.setState({ values: newValues });
    // clear input
    this.refs.inputText.value = '';
  }
});

export default EditableList;
