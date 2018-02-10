/**
 * author: fgondwe@stanford.edu
 * date: 02/09/2018
 * purpose: render radio button for status e.g downloads_page
 */
import React, { Component } from "react";
import _ from "underscore";
import S from "string";

class StatusBtns extends Component {
    constructor(props){
        super(props);
        this.state = { selected: 'active'};
        this.onBtnClick = this.onBtnClick.bind(this);
    }

    onBtnClick(event){
        this.setState({selected: event.currentTarget.value});

    }
    
    render(){
        debugger;
        return <label>
            {this.props.name}
            <input type="radio" value={this.props.name} checked={this.state.selected == this.props.name} name={this.props.name} onChange={this.onBtnClick} key={Math.random()} />
          </label>;

    }
}

export default StatusBtns; 
