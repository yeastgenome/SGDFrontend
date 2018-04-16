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
    this.props.nodeClick(temp_node, event);
  }

  componentDidMount() {
    if (this.props.node.childNodes != undefined) {
      if (this.props.node.childNodes.length > 0) {
        let kids = this.props.node.childNodes.filter(
          itx => itx.id == Number(this.props.queryString.id)
        );
        let item = _.findWhere(this.props.node.childNodes, {
          id:
            Object.keys(this.props.queryString).length > 0
              ? Number(this.props.queryString.id)
              : 0
        });
        if (item) {
          this.setState({ visible: !this.state.visible });
        }
        if (kids.length > 0) {
          if (kids[0].id == Number(this.props.queryString.id)) {
            this.setState({ visible: !this.state.visible });
          }
        }
      }
    }
  }
  render() {
    let childNodes;
    let style;
    let cssClasses;
    let divClasses;
    let openFlag = false;
    if (this.props.node.childNodes != null) {
      if (
        this.props.node.childNodes != undefined &&
        this.props.node.childNodes.length > 0
      ) {
        childNodes = this.props.node.childNodes.map((node, index) => {
          if (this.props.node.childNodes != null) {
            return (
              <li key={index} value={index}>
                <CustomTree
                  activeRootNode={this.props.isOpenNode(node.id)}
                  statusNodes={this.props.statusNodes}
                  isOpenNode={this.props.isOpenNode}
                  isActive={this.props.isActive}
                  selectedNode={this.props.selectedNode}
                  node={node}
                  leafClick={this.props.leafClick}
                  path={node.path
                    .split("/")
                    .filter(itx => itx)
                    .join("_")}
                  nodeClick={this.props.nodeClick}
                  queryString={this.props.queryString}
                />
              </li>
            );
          }
        });
        if (Object.keys(this.props.queryString).length > 0) {
          const sNodesFlag = this.props.statusNodes[this.props.node.id];
          if (sNodesFlag) {
            cssClasses = { togglable: true, "togglable-down": true, "togglable-up": false };
            openFlag = true;
          } 
          else if (this.props.queryString.category.toLowerCase() === this.props.node.title.toLowerCase() && !sNodesFlag) {
            cssClasses = { togglable: true, "togglable-down": true, "togglable-up": false };
            openFlag = true;
          } 
          else if (this.props.queryString.id === this.props.node.id && !sNodesFlag) {
            cssClasses = { togglable: true, "togglable-down": false, "togglable-up": true };
          } 
          else {
            cssClasses = { togglable: true, "togglable-down": false, "togglable-up": true };
          }
        } else {
          cssClasses = {
            togglable: true,
            "togglable-down": this.state.visible,
            "togglable-up": !this.state.visible
          };
    
        }
      } else {
        if (this.props.node.title &&mObject.keys(this.props.queryString).length > 0) {
          if (
            this.props.node.id.toString() ==
            this.props.queryString.id.toString()
          ) {
            cssClasses = { "node-highlight": true };
            divClasses = { "div-highlight": true };
          } else {
            cssClasses = { "node-highlight": false };
            divClasses = { "div-highlight": false };
          }
        }
      }
   
      if (
        this.props.node.childNodes == undefined || this.props.node.childNodes.length == 0) {
        //leaf node
        return (
          <div className={divClasses ? ClassNames(divClasses) : ""}>
            <span onClick={this.props.leafClick} data-node={this.props.node} data-node-id={this.props.node.id}>
              <a
                id={this.props.node.id}
                data-path={this.props.path}
                name={S(this.props.node.title).capitalize().s}
                data-node={this.props.node}
                value={this.props.node}
                className={ClassNames(cssClasses)}
              >
                {this.props.node.title}
              </a>
            </span>
          </div>
        );
      } else {
        //parent node
        const qStrObj = this.props.queryString;
        const isParent = qStrObj.item ? _.contains(qStrObj.item
            .toLowerCase()
            .split("_"), this.props.node.title.toLowerCase().replace(' ', '-')): false;
        if (this.props.statusNodes[this.props.node.id]) {
          return (
            <div className="node-parent open-node">
              <span
                onClick={this.onToggle}
                id={S(this.props.node.title).capitalize().s}
                data-path={this.props.path}
                value={this.props.node}
                className={ClassNames(cssClasses)}
                data-id={this.props.node.id}
                
              >
                {this.props.node.title}
              </span>
              <ul className="node-children show-items">{childNodes}</ul>
            </div>
          );
        }
        else if(isParent){
          if(qStrObj.item.toLowerCase() === qStrObj.category.toLowerCase().replace(' ','-')){
            cssClasses = { togglable: true, "togglable-down": false, "togglable-up": true };
            return <div className="node-parent close-node">
                <span onClick={this.onToggle} id={S(this.props.node.title).capitalize().s} data-path={this.props.path} value={this.props.node} className={ClassNames(cssClasses)} data-id={this.props.node.id}>
                  {this.props.node.title}
                </span>
                <ul className="node-children show-items">
                  {childNodes}
                </ul>
              </div>;

          }
          else if(Number(qStrObj.id) === this.props.node.id && !this.props.statusNodes[this.props.node.id]){
            cssClasses = { togglable: true, "togglable-down": false, "togglable-up": true };
             return <div className="node-parent close-node">
                 <span onClick={this.onToggle} id={S(this.props.node.title).capitalize().s} data-path={this.props.path} value={this.props.node} className={ClassNames(cssClasses)} data-id={this.props.node.id}>
                   {this.props.node.title}
                 </span>
                 <ul className="node-children show-items">
                   {childNodes}
                 </ul>
               </div>;
          }

          else{
              cssClasses = { togglable: true, "togglable-down": true, "togglable-up": false };
              return <div className="node-parent open-node">
                  <span onClick={this.onToggle} id={S(this.props.node.title).capitalize().s} data-path={this.props.path} value={this.props.node} className={ClassNames(cssClasses)} data-id={this.props.node.id}>
                    {this.props.node.title}
                  </span>
                  <ul className="node-children show-items">
                    {childNodes}
                  </ul>
                </div>;
          }
          
        } 
        else {
          cssClasses = { togglable: true, "togglable-down": false, "togglable-up": true };
          return (
            <div className="node-parent close-node">
              <span
                onClick={this.onToggle}
                id={S(this.props.node.title).capitalize().s}
                value={this.props.node}
                className={ClassNames(cssClasses)}
                data-id={this.props.node.id}
              >
                {this.props.node.title}
              </span>
              <ul style={style} className="node-children">
                {childNodes}
              </ul>
            </div>
          );
        }
      }
    }
  }
}

export default CustomTree;
