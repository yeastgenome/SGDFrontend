import authReducer from './authReducer';
import metaReducer from './metaReducer';
import litReducer from './litReducer';
import locusReducer from './locusReducer';
import searchReducer from './searchReducer';
import newsLetterReducer from './newsLetterReducer';

export default {
  auth: authReducer,
  meta: metaReducer,
  lit: litReducer,
  locus: locusReducer,
  search: searchReducer,
  newsLetter:newsLetterReducer
};
