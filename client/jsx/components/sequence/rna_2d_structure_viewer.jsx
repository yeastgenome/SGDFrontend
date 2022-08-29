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
      ursID: '', 
    };
  },

  render: function () {

    // <r2dt-web search="{&#34;urs&#34;:&#34;URS000029384E&#34;}"></r2dt-web>
 
    var searchNode = '"{&#34;urs&#34;:&#34;' + this.props.ursID + '&#34;}"'  
      
    console.log("searchNode=" + searchNode)
    // searchNode="{&#34;urs&#34;:&#34;URS0000505673&#34;}"
      
    return (
      <div class="panel">                                                                        
        <r2dt-web search={searchNode}></r2dt-web>
      </div>
    );
  },
    
});
