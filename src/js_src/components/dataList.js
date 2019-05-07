import React, { Component } from 'react';
// import fetchData from '../lib/fetchData';
import style from './style.css';

class DataList extends Component {
  constructor(props) {
    super(props);
    this.hadleClick = this.handleClick.bind(this);
    this.handleSelect = this.handleSelect.bind(this);

    this.state = {
      options:[],
      isInputSelected:false,
      inputFieldText:'',
      selectedOptionId:''
    };
  }

  componentWillReceiveProps(nextProps){
    if (nextProps.selectedId){
      var selected_item = this.props.options.filter((value) => value[this.props.id] == nextProps.selectedId)[0];
      if (selected_item != undefined) {
        this.setState({ selectedOptionId: selected_item[this.props.id], inputFieldText: selected_item.display_name });
      }
    }
    else{
      this.setState({ selectedOptionId: 0, inputFieldText: '' });
    }
  }

  handleClick(bool){
    this.setState({isInputSelected:bool});
  }

  handleChange(e){
    var input_value = e.target.value;
    if(input_value != ''){
      this.setState({inputFieldText: input_value });
    }
    else{
      this.setState({ inputFieldText: input_value, selectedOptionId:0}, () => this.props.onOptionChange());
    }
  }

  handleSelect(index){
    var selected_item = this.props.options.filter((value) => value[this.props.id] == index)[0];
    if (selected_item != undefined){
      this.setState({ selectedOptionId: selected_item[this.props.id], inputFieldText: selected_item.display_name }, () => this.props.onOptionChange());
    } 
  }

  renderOptions(){
    return (
      <div className={this.state.isInputSelected?'':'hide'}>
        <div className={style.autoSelect}>
          <ul className={style.styleList}>
            {
              this.props.options.filter((value) => RegExp('^' + this.state.inputFieldText + '.*', 'i').test(value[this.props.value2]) || RegExp('^' + this.state.inputFieldText + '.*', 'i').test(value[this.props.value1]))
              .map((option) => {
                return <li value={option[this.props.value1]} key={option[this.props.id]} className='clearfix' onMouseDown={() => this.handleSelect(option[this.props.id])}>
                  <a> <span className='float-left'>{option[this.props.value1]} </span><span className='float-right'>{option[this.props.value2]}</span> </a>
                </li>;
              })
            }
          </ul>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className='columns medium-12'>
        <input type='text' className={style.noBottomMargin} onSelect={() => this.handleClick(true)} onChange={this.handleChange.bind(this)} onBlur={() => this.handleClick(false)} value={this.state.inputFieldText} />
          {this.renderOptions()}
        <input type='hidden' name={this.props.selectedIdName} value={this.state.selectedOptionId} />
      </div>
    );
  }

}


DataList.propTypes = {
  options: React.PropTypes.array,
  url:React.PropTypes.string,
  id:React.PropTypes.string,
  value1:React.PropTypes.string,
  value2:React.PropTypes.string,
  onOptionChange: React.PropTypes.func,
  selectedIdName:React.PropTypes.string,
  selectedId:React.PropTypes.string,
};


export default DataList;