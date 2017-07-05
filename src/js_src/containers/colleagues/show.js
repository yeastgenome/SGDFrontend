import React, { Component } from 'react';

class ColleagueShow extends Component {
  render() {
    return (
      <div>
        <h1>Colleague Update</h1>
        <div className='text-right'>
          <a className='button'><i className='fa fa-check' /> Approve</a>
          <a className='button secondary'><i className='fa fa-trash' /> Discard</a>
        </div>
      </div>
    );
  }
}

export default ColleagueShow;
