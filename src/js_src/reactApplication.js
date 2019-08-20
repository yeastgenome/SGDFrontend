// import React, { Component } from 'react';
// import { Router, hashHistory, createMemoryHistory } from 'react-router-dom';
// import { Provider } from 'react-redux';
// import { syncHistoryWithStore } from 'connected-react-router';
// import configureStore from './lib/configureStore';

// import routes from './routes';

// class ReactApp extends Component {
//   render() {
//     let isBrowser = typeof window === 'object';
//     let historyObj = isBrowser ? hashHistory : createMemoryHistory('/');
//     let store = configureStore(historyObj);
//     let history = syncHistoryWithStore(historyObj, store);
//     return (
//       <Provider store={store}>
//         <Router history={history}>
//           {routes}
//         </Router>
//       </Provider>
//     );
//   }
// }

// export default ReactApp;


import React, { Component } from 'react';
import { HashRouter as Router, createMemoryHistory,Route } from 'react-router-dom';
import { Provider } from 'react-redux';
// import { syncHistoryWithStore } from 'connected-react-router';
import configureStore from './lib/configureStore';

// import routes from './routes';

import { createHashHistory } from 'history';
class ReactApp extends Component {
  render() {
    let isBrowser = typeof window === 'object';
    let historyObj = isBrowser ? createHashHistory() : createMemoryHistory('/');
    let store = configureStore(historyObj);
    // let history = syncHistoryWithStore(historyObj, store);
    return (
      <Provider store={store}>
        <Router>
          {/* <nav>
            <Link to="/">Home</Link>
            <br />
            <Link to="/r">Route</Link>
          </nav> */}

            <Route render={() => (<div>Sagar</div>)} path='/' exact/>
            <Route render={() => (<div>Route r</div>)} path='/r' />
          
        </Router>
      </Provider>
    );
  }
}

export default ReactApp;
