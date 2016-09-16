import React from 'react';
import { Link } from 'react-router';

const PublicIndex = React.createClass({
  render() {
    return (
      <div>
        <h1>SGD Curator</h1>
        <hr />
        <p>This is a curation interface for the Saccharomyces Genome Database.</p>
        <p><Link to='/login' className='button primary'>Login</Link></p>
      </div>
    );
  }
});

export default PublicIndex;
