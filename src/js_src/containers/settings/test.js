import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { Settings } from './index';

describe('Settings', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<Settings />);
    assert.equal(typeof htmlString, 'string');
  });
});
