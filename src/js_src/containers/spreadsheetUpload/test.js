import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

import { SpreadsheetUpload } from './index';

describe('SpreadsheetUpload', () => {
  it('should be able to render to an HTML string', () => {
    let htmlString = renderToString(<SpreadsheetUpload />);
    assert.equal(typeof htmlString, 'string');
  });
});
