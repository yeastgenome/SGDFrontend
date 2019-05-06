import React, { Component } from 'react';
import fetchData from '../lib/fetchData';
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

  componentDidMount(){
    this.getData();  
  }

  getData() {
    fetchData(this.props.url, {
      type: 'GET'
    }).then(data => {
      this.setState({ options: data['psimods']});
    }); 
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
      this.setState({ inputFieldText: input_value, selectedOptionId: '' }, () => this.props.onOptionChange());
    }
  }

  handleSelect(index){
    var selected_item = this.state.options.filter((value) => value.psimod_id == index)[0];
    if (selected_item != undefined){
      this.setState({ selectedOptionId: selected_item.psimod_id, inputFieldText: selected_item.display_name }, () => this.props.onOptionChange());
    } 
  }

  renderOptions(){
    return (
      <div className={this.state.isInputSelected?'':'hide'}>
        <div className={style.autoSelect}>
          <ul className={style.styleList}>
            {
              this.state.options.filter((value) => RegExp('^' + this.state.inputFieldText + '.*').test(value['format_name']) || RegExp('^' + this.state.inputFieldText + '.*').test(value['display_name']))
              .map((psimod) => {
                return <li value={psimod.display_name} key={psimod.psimod_id} className='clearfix' onMouseDown={() => this.handleSelect(psimod.psimod_id)}>
                  <a> <span className='float-left'>{psimod.display_name} </span><span className='float-right'>{psimod.format_name}</span> </a>
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
        <input type='text' className={style.noBottomMargin} onSelect={() => this.handleClick(true)} onChange={this.handleChange.bind(this)} onBlur={() => this.handleClick(false)} value={this.state.inputFieldText}/>
          {this.renderOptions()}
        <input type='hidden' name={this.props.selectedIdName} value={this.state.selectedOptionId}/>
      </div>
    );
  }

}


DataList.propTypes = {
  options: React.PropTypes.array,
  url:React.PropTypes.string,
  onOptionChange: React.PropTypes.func,
  selectedIdName:React.PropTypes.string
};


export default DataList;