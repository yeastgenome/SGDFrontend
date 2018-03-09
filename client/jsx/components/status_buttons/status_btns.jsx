/**
 * author: fgondwe@stanford.edu
 * date: 02/09/2018
 * purpose: render radio button for status e.g downloads_page
 */
import React, { Component } from 'react';
import S from 'string';
import { Link } from 'react-router';
import ClassNames from 'classnames';

class StatusBtns extends Component {
    constructor(props){
        super(props);  
      }
    
    render(){
      let cStyle={marginLeft:"0.2rem"};
        let activityStyle = this.props.flag ? "active-agg" : "inactive-agg";
        let klass = this.props.flag ? "search-agg active" : "search-agg";
        if (this.props.flag) {
          cStyle = { color: "white", marginLeft: "0.2rem" };
        } return <div key={`agg1${this.props.key}`} className={ClassNames(klass, activityStyle, "status-btn")}>
              <label className={"status-btn-label"}>
                  <input type="radio" value={this.props.name} checked={this.props.flag} name={this.props.name} onChange={this.props.btnClick} key={this.props.key} />
                  <span style={cStyle}>
                    {S(this.props.name).capitalize().s}
                  </span>
              </label>
            </div>;
    }
}

export default StatusBtns; 
