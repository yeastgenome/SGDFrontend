import React, { Component } from 'react';

class AuthorResponse extends Component {
  render() {
    return (
      <div>
        <h1>Information About Your Recently Published Paper</h1>
        <div className='row'>
          <div className='columns small-6'>
            <label>Your email (required)</label>
            <input type='text' />
          </div>
          <div className='columns small-6'>
            <label>Pubmed ID of your paper (required)</label>
            <input type='text' />
          </div>
        </div>
        <label>Citation</label>
        <input type='text' />
        <p>
          Does this paper contain novel characterizations of the function, role, or localization of a gene product(s)? If yes, please summarize briefly the novel results.
        </p>
        <input type='text' />
        <p>
          If this paper focuses on specific genes/proteins, please identify them here (enter a list of gene names/systematic names).
        </p>
        <input type='text' />
        <p>
          Does this study include large-scale datasets that you would like to see incorporated into SGD? If yes, please describe briefly the type(s) of data.
        </p>
        <input type='text' />
        <p>
          Is there anything else that you would like us to know about this paper? 
        </p>
        <input type='text' />
        <a className='button' href='#'>Submit</a>
      </div>
    );
  }
}

export default AuthorResponse;
