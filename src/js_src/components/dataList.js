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
      filtered_options: [],
      isSelected:false,
      inputValue:'',
      selectedValue:''
    };
  }

  componentDidMount(){
    this.getData();
  }

  getData() {
    fetchData(this.props.url, {
      type: 'GET'
    }).then(data => {
      this.setState({ options: data['psimods'],filtered_options:data['psimods'] });
    }); 
  }

  handleClick(bool){
    this.setState({isSelected:bool});
  }

  handleChange(e){
    var input_value = e.target.value;
    var new_list = this.state.options.filter((value) => RegExp(input_value).test(value['format_name']));
    var new_list1 = this.state.options.filter((value) => RegExp('^'+input_value + '*').test(value['display_name']));
    this.setState({filtered_options:[...new_list,...new_list1],inputValue:input_value});
  }

  handleSelect(index){
    console.log(index);
    var selected_item = this.state.options.filter((value) => value.psimod_id == index)[0];
    console.log(selected_item);
    if (selected_item != undefined){
      this.setState({ selectedValue:selected_item.psimod_id,inputValue:selected_item.display_name});
    }
    
  }

  render() {
    return (
      <div className='columns medium-12'>
        <input type='text' className={style.noBottomMargin} onSelect={() => this.handleClick(true)} onChange={this.handleChange.bind(this)} onBlur={() => this.handleClick(false)} value={this.state.inputValue} />
        <div className={this.state.isSelected ? '':'hide'}>
          {/* className={(this.state.isSelected?'':'hide')}> */}
          {/* className={(this.state.isSelected ? '' : 'hide')}> */}
          {/* style.autoSelect */}
          <ul className={style.styleList}>
            {
              this.state.filtered_options.map((psimod) => {
                return <li value={psimod.display_name} key={psimod.psimod_id} className='clearfix' onClick={() => this.handleSelect(psimod.psimod_id)}>
                  <a> <span className='float-left'>{psimod.display_name} </span><span className='float-right'>{psimod.format_name}</span> </a>
                </li>;
              })
            }
          </ul>
        </div>
        <p>{this.state.selectedValue}</p>
      </div>
    );
  }

}


DataList.propTypes = {
  options: React.PropTypes.array,
  url:React.PropTypes.string
};


export default DataList;