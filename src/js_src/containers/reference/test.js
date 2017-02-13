import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import RefShow from './show';

describe('RefShow', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<RefShow />);
    assert.equal(typeof htmlString, 'string');
  });
});
