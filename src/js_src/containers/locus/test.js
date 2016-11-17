import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import LocusShow from './show';

describe('LocusShow', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<LocusShow />);
    assert.equal(typeof htmlString, 'string');
  });
});
