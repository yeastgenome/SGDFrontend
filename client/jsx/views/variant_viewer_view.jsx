'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var VariantViewer = require('../components/variant_viewer/variant_viewer.jsx');
var Drawer = require('../components/variant_viewer/drawer.jsx');
import createReactClass from 'create-react-class';

// router stuff
import { Route, Switch, HashRouter as Router } from 'react-router-dom';

var view = {};
view.render = function () {
  // blank react component to make no drawer
  var BlankComponent = createReactClass({
    render: function () {
      return <span />;
    },
  });

  var RouterComponent = createReactClass({
    render: function () {
      return (
        <Router>
          <VariantViewer>
            <Switch>
              <Route path="/:locusId" component={Drawer} />
              <Route path="/" component={BlankComponent} exact />
            </Switch>
          </VariantViewer>
        </Router>
      );
    },
  });

  ReactDOM.render(<RouterComponent />, document.getElementById('j-main'));
};

module.exports = view;
