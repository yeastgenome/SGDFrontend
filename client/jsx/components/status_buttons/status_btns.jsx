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
        let activityStyle = this.props.isActive ? 'active-agg' : 'inactive-agg';
        let klass = this.props.isActive ? 'search-agg active' : 'search-agg';
        return <div  key={`agg1${this.props.key}`} className={ClassNames(klass, activityStyle,'status-btn')}>
            <Link to={this.props.href}>
              <input type='radio' value={this.props.name} checked={this.props.flag} name={this.props.name} onChange={this.props.btnClick} key={this.props.key} />
            </Link>
            <span className={'status-btn-label'}>
              {' '}
              {S(this.props.name).capitalize().s}
            </span>
          </div>;
    }
}

export default StatusBtns; 
