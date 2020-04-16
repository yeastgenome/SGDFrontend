import React, { Component } from 'react';

class MenuList extends Component {
  constructor(props) {
    super(props);
  }
  _getTreeData() {
    //TODO:get props data and put together the tree from parent component
  }

  render() {
    return (
      <ul className="mtree sgd">
        <li className="mtree-node mtree-open">
          <a href="#">Africa</a>
          <ul>
            <li className="mtree-node mtree-open">
              <a href="#">Malawi</a>
            </li>
            <li className="mtree-node mtree-open">
              <a href="#">Zambia</a>
            </li>
            <li className="mtree-node mtree-open">
              <a href="#">Kenya</a>
            </li>
          </ul>
        </li>
        <li className="mtree-node mtree-open">
          <a href="#">America</a>
          <ul>
            <li className="mtree-node mtree-open">
              <a href="#">North America</a>
              <ul>
                <li className="mtree-node mtree-open">
                  <a href="#">USA</a>
                </li>
                <li className="mtree-node mtree-open">
                  <a href="#">Canada</a>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    );
  }
}

export default MenuList;
