import React, { Component } from "react";
import ReactDOM from "react-dom";
//import TreeView from 'treeview-react-bootstrap';
import CustomTreeView from "../widgets/tree_view.jsx";

export default class Downloads extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let tree = {
      title: "howdy",
      childNodes: [
        { title: "bobby" },
        {
          title: "suzie",
          childNodes: [
            {
              title: "puppy",
              childNodes: [{ title: "dog house" }]
            },
            { title: "cherry tree" }
          ]
        }
      ]
    };
    return (
      <div>
        <CustomTreeView node={tree} />
      </div>
    );
  }
}
