import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { CurateLayout } from './index';

describe('CurateLayout', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<CurateLayout />);
    assert.equal(typeof htmlString, 'string');
  });
});
