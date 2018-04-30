import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import NewReference from './index';

describe('NewReference', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<NewReference />);
    assert.equal(typeof htmlString, 'string');
  });
});
