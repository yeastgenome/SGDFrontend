import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

const FilesIndex = React.createClass({
  render() {
    return (
      <div>
        <h1>Datasets</h1>
        <hr />
        <Link to='/dashboard/files/new' className='button'><i className='fa fa-plus'/> New Dataset</Link>
        <p>
          <span> Files in Progress</span>
        </p>
        {this._renderTable()}
      </div>
    );
  },

  _renderTable () {
    return (
      <table>
        <thead>
          <tr>
            <th>Filename</th>
            <th>Description</th>
            <th>Uploaded By</th>
            <th>Status</th>
            <th width="300">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>example_file.tgz</td>
            <td>Donec id elit non mi porta gravida at eget metus.</td>
            <td>user123</td>
            <td>Uploading ...</td>
            <td>{this._renderActions()}</td>
          </tr>
          <tr>
            <td>example_file.tgz</td>
            <td>Donec id elit non mi porta gravida at eget metus.</td>
            <td>user123</td>
            <td>Pending Approval</td>
            <td>{this._renderActions()}</td>
          </tr>
        </tbody>
      </table>
    );
  },

  _renderActions () {
    return (
      <div className='button-group small'>
       <a className='button'><i className='fa fa-check'/> Approve</a>
       <a className='button secondary'><i className='fa fa-download'/> Download</a>
       <a className='button secondary'><i className='fa fa-times'/> Delete</a>
      </div>
    );
  }
});

function mapStateToProps(_state) {
  return {
  };
}

module.exports = connect(mapStateToProps)(FilesIndex);
