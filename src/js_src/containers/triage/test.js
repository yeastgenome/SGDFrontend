import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { LitTriageIndex } from './index';

describe('LitTriageIndex', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<LitTriageIndex triageEntries={[]} />);
    assert.equal(typeof htmlString, 'string');
  });
});
