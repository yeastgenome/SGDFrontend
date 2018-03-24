import React, { Component } from "react";
import ClassNames from "classnames";
import _ from "underscore";
import S from "string";

class CustomTree extends Component {
  constructor(props) {
    super(props);
    this.state = { visible: false };
    this.onToggle = this.onToggle.bind(this);
  }
  onToggle(event) {
    this.setState({ visible: !this.state.visible });
    let temp_node = this.props.node;
    temp_node.node_flag = !this.state.visible;
    this.props.nodeClick(temp_node);
  }
  componentDidMount() {
    if (this.props.node.childNodes != undefined) {
      if(this.props.node.childNodes.length > 0){
        let item = _.findWhere(this.props.node.childNodes, 
          {id: Object.keys(this.props.queryString).length > 0 ? Number(this.props.queryString.id) : 0}
      );
        if (item) {
          this.setState({ visible: !this.state.visible });
        }
      }
      
    }
  }
  render() {
    let childNodes;
    let style;
    let cssClasses;
    let divClasses;
    let listFlag = false;
    if(this.props.node.childNodes != null){
    if (this.props.node.childNodes != undefined && this.props.node.childNodes.length > 0) {
      childNodes = this.props.node.childNodes.map((node, index) => {
        if(this.props.node.childNodes != null){
        return <li key={index} value={index}>
            <CustomTree node={node} leafClick={this.props.leafClick} nodeClick={this.props.nodeClick} queryString={this.props.queryString} />
          </li>;
        }
      });
      if(Object.keys(this.props.queryString).length > 0){
        if(this.props.queryString.id){
          if(Number(this.props.queryString.id) == this.props.node.id){
            cssClasses = { togglable: true, "togglable-down": true, "togglable-up": false };
            listFlag = true
          }
          else{
            cssClasses = { togglable: true, "togglable-down": false, "togglable-up": true };
          }
        }
      }
      else{
        cssClasses = { togglable: true, "togglable-down": this.state.visible, "togglable-up": !this.state.visible };
      }
    } else {
      if (this.props.node.title && Object.keys(this.props.queryString).length > 0) {
        if (this.props.node.id.toString() == this.props.queryString.id.toString()) {
          cssClasses = { "node-highlight":true };
          divClasses = { "div-highlight": true }
        }
      }
    }
    if (!this.state.visible) {
      if(listFlag){
        style = { listStyleType: "none" };
      }
      else{
        style = { display: "none" };
      }
      
    } else {
        style = { listStyleType: "none" };
    }
    if (this.props.node.childNodes == undefined || this.props.node.childNodes.length == 0) {
      
      //leaf node
      return <div className={divClasses ? ClassNames(divClasses) : ""}>
          <span onClick={this.props.leafClick} data-node={this.props.node}>
            <a id={this.props.node.id} name={S(this.props.node.title).capitalize().s} data-node={this.props.node} value={this.props.node} className={ClassNames(cssClasses)}>
              {this.props.node.title}
            </a>
          </span>
        </div>;
    } else {
      //parent node
      return (
        <div>
          <span
            onClick={this.onToggle}
            id={S(this.props.node.title).capitalize().s}
            value={this.props.node}
            className={ClassNames(cssClasses)}
            data-id={this.props.node.id}
          >
            {this.props.node.title}
          </span>
          <ul style={style}>{childNodes}</ul>
        </div>
      );
    }
  }
  }
}
export default CustomTree;
