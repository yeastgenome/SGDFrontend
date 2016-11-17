import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import Batch from './index';

describe('Batch', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<Batch />);
    assert.equal(typeof htmlString, 'string');
  });
});
