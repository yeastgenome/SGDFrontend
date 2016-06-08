import assert from 'assert';
import { createMemoryHistory, useQueries } from 'history';

import ConfigureStore from '../store/configure_store';
import * as AuthActions from '../actions/auth_actions';

// helper function to get new store
function getNewStore () {
  let history = useQueries(createMemoryHistory)();
  return ConfigureStore(undefined, history);
};

// init store with memory history
describe('Store', function () {
  it('can be initialized to an object with a dispatch method', function initStore () {
    let store = getNewStore();
    assert.equal(typeof store.dispatch, 'function');
  });
  it('is by default unauthenticated', function authWithoutCredentials () {
    let store = getNewStore();
    let isAuth = store.getState().auth.isAuthenticated;
    assert.equal(false, isAuth);
  });
  it('is authenticated by receiving an auth response', function authWithoutCredentials () {
    let store = getNewStore();
    const FAKE_EMAIL = 'user123@fake.com';
    let receiveAuthResponseAction = AuthActions.receiveAuthenticationResponse(FAKE_EMAIL);
    store.dispatch(receiveAuthResponseAction);
    let authState = store.getState().auth;
    assert.equal(true, authState.isAuthenticated);
    assert.equal(FAKE_EMAIL, authState.email);
  });
});
