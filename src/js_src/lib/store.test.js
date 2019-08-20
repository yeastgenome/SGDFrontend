import assert from 'assert';
import { createMemoryHistory } from 'react-router-dom';

import configureStore from './configureStore';

describe('Store', () => {
  it('can be initialized to an object', () => {
    let historyObj = createMemoryHistory('/');
    let store = configureStore(historyObj);
    assert.equal(typeof store, 'object');
  });

  it('can getState() and return an object', () => {
    let historyObj = createMemoryHistory('/');
    let store = configureStore(historyObj);
    let state = store.getState();
    assert.equal(typeof state, 'object');
  });
});
