import React, { Component } from 'react';
import style from './style.css';
import PropTypes from 'prop-types';
class DataList extends Component {
  constructor(props) {
    super(props);
    this.handleOnBlur = this.handleOnBlur.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleMoreOptions = this.handleMoreOptions.bind(this);
    this.handleNewValue = this.handleNewValue.bind(this);

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
      this.setState({ selectedOptionId: '', inputFieldText: '' });
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
      this.setState({ inputFieldText: input_value, selectedOptionId: '' }, () => this.props.onOptionChange());
    }
  }

  handleSelect(index) {
    var selected_item = this.props.options.filter((value) => value[this.props.id] == index)[0];
    if (selected_item != undefined) {
      this.setState({ selectedOptionId: selected_item[this.props.id], inputFieldText: selected_item.display_name }, () => this.props.onOptionChange());
      this.handleHideOptions();
    }
  }

  handleNewValue(){
    this.setState({selectedOptionId: this.state.inputFieldText }, () => this.props.onOptionChange());
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
        .map((option) => {
          return <li value={option[this.props.value1]} key={option[this.props.id]} className='clearfix' onMouseDown={() => this.handleSelect(option[this.props.id])}>
            <a> <span className='float-left'>{option[this.props.value1]} </span><span className='float-right'>{option[this.props.value2]}</span> </a>
          </li>;
        });

      if(options.length > 10){
        options = options.slice(0, 10);
        options.push(<li key='11' onMouseDown={() => this.handleMoreOptions()}><a>more options</a></li>);
      }
    }

    if(options.length == 0 && this.props.setNewValue){
      options.push(<li key='0' onMouseDown={() => this.handleNewValue()}><a>{this.state.inputFieldText}</a></li>);
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
      <div className={`columns medium-12 ${style.margin_bottom_20}`}>
        <input ref={(input) => { this.nameInput = input; }} type='text' className={style.noBottomMargin} onSelect={() => this.handleShowOptions()} onBlur={() => this.handleOnBlur()} onChange={this.handleChange.bind(this)} value={this.state.inputFieldText} />
        {this.renderOptions()}
        <input type='hidden' name={this.props.selectedIdName} value={this.state.selectedOptionId} />
      </div>
    );
  }

}

DataList.propTypes = {
  options: PropTypes.array,
  url: PropTypes.string,
  id: PropTypes.string,
  value1: PropTypes.string,
  value2: PropTypes.string,
  onOptionChange: PropTypes.func,
  selectedIdName: PropTypes.string,
  selectedId: PropTypes.string,
  setNewValue:PropTypes.bool
};

DataList.defaultProps = {
  setNewValue:false
};

export default DataList;