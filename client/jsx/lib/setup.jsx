import { match } from 'react-router';

import $ from 'jquery';
var FastClick = require('fastclick');
import setupSearch from './setup_search.jsx';
import routes from '../routes.jsx';

require('foundation-sites/js/foundation');

export default function () {
  // foundation setup
  // $(document).foundation(); //moved to layout files.

  // add fast click event listener to reduce delay of mobile "clicks" 
  FastClick.attach(document.body);

  // add console, console.log, and console.warn if they don't exist, for IE9
  if (!(window.console && console.log && console.warn)) {
    window.console = {
      log: function(){},
      debug: function(){},
      info: function(){},
      warn: function(){},
      error: function(){}
    };
  }

  // does the following only after DOM completely loads
  $(document).ready(function(){
    // if the url contains an anchor        
    if (window.location.hash) {
      var anchor = window.location.hash;
      window.location.hash = anchor;
    }
    // exec search setup script, don't do if on any redux page
    // necessary to prevent react re-rending twice on client
    var path = window.location.pathname;
    match({ routes, location:  path}, (error, redirectLocation, renderProps) => {
      if (!renderProps || path === '' || path === '/') {
        setupSearch();
      }
    });
  });
};
