import React, { Component } from 'react';
import Dropdown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown';

class AuthorResponseDrawer extends Component {
  render() {
    return (
      <div>
        <Dropdown>
          <DropdownTrigger className='button tiny'>Author Response <i className='fa fa-caret-down' /></DropdownTrigger>
          <DropdownContent className='dropdownContent'>
            <label>Citation</label>
            <p>Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open</p>
            <label>Novel Results</label>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
            </p>
            <label>Specific Genes and Proteins</label>
            <p>
              ABC1, ABC2, ABC10
            </p>
            <label>HTP Datasets</label>
            <p>N/A</p>
            <label>Other Info</label>
            <p>N/A</p>
          </DropdownContent>
        </Dropdown>
      </div>
    );
  }
}

export default AuthorResponseDrawer;
