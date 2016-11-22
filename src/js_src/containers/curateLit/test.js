import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import CurateLitOverview from './index';

describe('CurateLit', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<CurateLitOverview />);
    assert.equal(typeof htmlString, 'string');
  });
});
