import React, { Component } from 'react';
import style from './style.css';

class DataList extends Component {
  constructor(props) {
    super(props);
    this.handleOnBlur = this.handleOnBlur.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleMoreOptions = this.handleMoreOptions.bind(this);

    this.state = {
      showOptions: false,
      inputFieldText: '',
      selectedOptionId: '',
      isMoreOptionClicked:false,
      showMoreOptions: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedId) {
      var selected_item = this.props.options.filter((value) => value[this.props.id] == nextProps.selectedId)[0];
      if (selected_item != undefined) {
        this.setState({ selectedOptionId: selected_item[this.props.id], inputFieldText: selected_item.display_name });
      }
    }
    else {
      this.setState({ selectedOptionId: 0, inputFieldText: '' });
    }
  }

  handleOnBlur() {
    if (this.state.isMoreOptionClicked) {
      this.setState({ isMoreOptionClicked:false});
      this.nameInput.focus();
    }
    else {
      this.handleHideOptions();
    }
  }

  handleShowOptions() {
    this.setState({ showOptions: true });
  }

  handleHideOptions() {
    this.setState({ showOptions: false,showMoreOptions: false });
  }

  handleMoreOptions() {
    this.setState({ isMoreOptionClicked:true,showMoreOptions: true});
  }

  handleChange(e) {
    var input_value = e.target.value;
    if (input_value != '') {
      this.setState({ inputFieldText: input_value});
    }
    else {
      this.setState({ inputFieldText: input_value, selectedOptionId: 0 }, () => this.props.onOptionChange());
    }
  }

  handleSelect(index) {
    var selected_item = this.props.options.filter((value) => value[this.props.id] == index)[0];
    if (selected_item != undefined) {
      this.setState({ selectedOptionId: selected_item[this.props.id], inputFieldText: selected_item.display_name }, () => this.props.onOptionChange());
      this.handleHideOptions();
    }
  }

  renderOptions() {
    var options;
    if (this.state.showMoreOptions) {
      options = this.props.options
        .filter((value) => RegExp('^' + this.state.inputFieldText + '.*', 'i').test(value[this.props.value2]) || RegExp('^' + this.state.inputFieldText + '.*', 'i').test(value[this.props.value1]))
        .map((option) => {
          return <li value={option[this.props.value1]} key={option[this.props.id]} className='clearfix' onMouseDown={() => this.handleSelect(option[this.props.id])}>
            <a> <span className='float-left'>{option[this.props.value1]} </span><span className='float-right'>{option[this.props.value2]}</span> </a>
          </li>;
        });
    }
    else{
      options = this.props.options
        .filter((value) => RegExp('^' + this.state.inputFieldText + '.*', 'i').test(value[this.props.value2]) || RegExp('^' + this.state.inputFieldText + '.*', 'i').test(value[this.props.value1]))
        .slice(0, 10)
        .map((option) => {
          return <li value={option[this.props.value1]} key={option[this.props.id]} className='clearfix' onMouseDown={() => this.handleSelect(option[this.props.id])}>
            <a> <span className='float-left'>{option[this.props.value1]} </span><span className='float-right'>{option[this.props.value2]}</span> </a>
          </li>;
        });
      options.push(<li key='11' onMouseDown={() => this.handleMoreOptions()}><a>more options</a></li>);
    }
    
    return (
      <div className={this.state.showOptions ? '' : 'hide'}>
        <div className={style.autoSelect}>
          <ul className={style.styleList}>
            {options}
          </ul>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className='columns medium-12'>
        <input ref={(input) => { this.nameInput = input; }} type='text' className={style.noBottomMargin} onSelect={() => this.handleShowOptions()} onBlur={() => this.handleOnBlur()} onChange={this.handleChange.bind(this)} value={this.state.inputFieldText} />
        {this.renderOptions()}
        <input type='hidden' name={this.props.selectedIdName} value={this.state.selectedOptionId} />
      </div>
    );
  }

}

DataList.propTypes = {
  options: React.PropTypes.array,
  url: React.PropTypes.string,
  id: React.PropTypes.string,
  value1: React.PropTypes.string,
  value2: React.PropTypes.string,
  onOptionChange: React.PropTypes.func,
  selectedIdName: React.PropTypes.string,
  selectedId: React.PropTypes.string,
};

export default DataList;