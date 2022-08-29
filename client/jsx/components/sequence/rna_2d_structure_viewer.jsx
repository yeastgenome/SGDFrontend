'use strict';
var React = require('react');
var _ = require('underscore');

import PropTypes from 'prop-types';

module.exports = createReactClass({
  displayName: 'Rna2DstructureViewer',

  propTypes: {
    ursID: PropTypes.string,
  },

  getDefaultProps: function () {
    return {
      data: 'URS000029384E', 
    };
  },

  render: function () {

    var searchNode = "{&#34;urs&#34;:&#34;" + this.props.ursID + "&#34;}"

    return (
      <div class="panel">                                                                        
        <r2dt-web search={searchNode}></r2dt-web>
      </div>
    );
  },
    
});
