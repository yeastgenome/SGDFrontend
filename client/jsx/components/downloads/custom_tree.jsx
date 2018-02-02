/**
 * author:fgondwe
 * date: 05/05/2017
 * purpose: render tree nodes
 */
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
    this.props.nodeClick(this.props.node);
  }
  componentDidMount() {
    if (this.props.node.childNodes != undefined) {
      let item = _.findWhere(this.props.node.childNodes, {
        title: this.props.queryString.item
          ? S(this.props.queryString.item).capitalize().s
          : undefined
      });
      if (item) {
        this.setState({ visible: !this.state.visible });
      }
    }
  }
  render() {
    let childNodes;
    let style;
    let cssClasses;
    if (this.props.node.childNodes != undefined) {
      childNodes = this.props.node.childNodes.map((node, index) => {
        return (
          <li key={index} value={index}>
            <CustomTree
              node={node}
              leafClick={this.props.leafClick}
              nodeClick={this.props.nodeClick}
              queryString={this.props.queryString}
            />
          </li>
        );
      });
      cssClasses = {
        togglable: true,
        "togglable-down": this.state.visible,
        "togglable-up": !this.state.visible
      };
    } else {
      if (this.props.node.title && this.props.queryString) {
        if (
          this.props.node.title.toLowerCase() ===
          this.props.queryString.item.toLowerCase()
        ) {
          cssClasses = { "highlight-node": true };
        }
      }
    }
    if (!this.state.visible) {
      style = { display: "none" };
    } else {
      style = {
        listStyleType: "none"
      };
    }
    if (this.props.node.childNodes == undefined) {
      
      //leaf node
      return (
        <div>
          <span onClick={this.props.leafClick} data-node={this.props.node}>
            <a
              id={S(this.props.node.title).capitalize().s}
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
      return (
        <div>
          <span
            onClick={this.onToggle}
            id={S(this.props.node.title).capitalize().s}
            value={this.props.node}
            className={ClassNames(cssClasses)}
          >
            {this.props.node.title}
          </span>
          <ul style={style}>{childNodes}</ul>
        </div>
      );
    }
  }
}
export default CustomTree;
