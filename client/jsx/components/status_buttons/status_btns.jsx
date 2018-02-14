/**
 * author: fgondwe@stanford.edu
 * date: 02/09/2018
 * purpose: render radio button for status e.g downloads_page
 */
import React, { Component } from "react";
import _ from "underscore";
import S from "string";
import { Link } from "react-router";
import ClassNames from "classnames";


class StatusBtns extends Component {
    constructor(props){
        super(props);
    }
    
    render(){
        let activityStyle = this.props.isActive ? this.props.style.activeAgg : this.props.style.inactiveAgg;
        let klass = this.props.isActive ? "search-agg active" : "search-agg";
        return <div key={Math.random()} className={`${klass} activityStyle`}>
            <label>
              {this.props.name}{' '}
              <Link to={this.props.href}><input style={[this.props.style.radioButton]} type="radio" value={this.props.name} checked={this.props.flag} name={this.props.name} onChange={this.props.btnClick} key={this.props.key} /></Link>
            </label>
          </div>;

    }
}

export default StatusBtns; 
