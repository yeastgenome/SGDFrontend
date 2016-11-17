import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { CurateHome } from './index';

describe('CurateHome', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<CurateHome />);
    assert.equal(typeof htmlString, 'string');
  });
});
