import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import LitIndex from './index';

describe('LitIndex', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<LitIndex />);
    assert.equal(typeof htmlString, 'string');
  });
});
