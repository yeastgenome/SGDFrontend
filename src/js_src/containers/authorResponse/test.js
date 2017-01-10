import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import AuthorResponse from './index';

describe('AuthorResponse', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<AuthorResponse />);
    assert.equal(typeof htmlString, 'string');
  });
});
