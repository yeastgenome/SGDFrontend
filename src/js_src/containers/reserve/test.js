import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import Reserve from './new';

describe('Reserve', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<Reserve />);
    assert.equal(typeof htmlString, 'string');
  });
});
