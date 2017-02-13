import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { LiteratureIndexComponent } from './index';

describe('LiteratureIndexComponent', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<LiteratureIndexComponent entries={[]} />);
    assert.equal(typeof htmlString, 'string');
  });
});
