'use strict';
var React = require('react');
var _ = require('underscore');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

module.exports = createReactClass({
  displayName: 'Rna2DstructureViewer',

  propTypes: {
    ursID: PropTypes.string,
  },

  getDefaultProps: function () {
    return {
      ursID: 'URS000029384E', 
    };
  },

  render: function () {

    // {&#34;urs&#34;:&#34;URS000029384E&#34;}
    // var searchNode = "{&#34;urs&#34;:&#34;" + this.props.ursID + "&#34;}"
    // <r2dt-web search={searchNode}></r2dt-web>
    // <r2dt-web search="{&#34;urs&#34;:&#34;URS000029384E&#34;}"></r2dt-web>
    var URS_ID = "URS000029384E"  
    var searchNode = '"{&#34;urs&#34;:&#34;' + URS_ID + '&#34;}"'  
      
    return (
      <div class="panel">                                                                        
      <r2dt-web search={searchNode}></r2dt-web>
      </div>
    );
  },
    
});
