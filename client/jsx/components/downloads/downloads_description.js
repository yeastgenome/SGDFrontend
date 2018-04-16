import React from 'react';
import {Component} from 'react';

class DownloadsDescription extends Component{
    constructor(props){
        super(props);
    }
    render(){
        return (<p>{this.props.title} - {this.props.description}</p>);
    }
}

export default DownloadsDescription;
