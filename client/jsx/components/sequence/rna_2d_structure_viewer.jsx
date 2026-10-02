'use strict';
var React = require('react');
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
    // r2dt-web fetches the structure with fetch(), and rnacentral.org only
    // sends CORS headers to its own origins, so its {"urs": ...} mode fails in
    // the browser with "Secondary structure not found." Point the widget's
    // {"url": ...} mode at our same-origin proxy (misc_views.rnacentral_2d_svg)
    // instead, which returns the same R2DT SVG.
    const svgUrl =
      window.location.origin +
      '/rnacentral/2d/' +
      encodeURIComponent(this.props.ursID) +
      '.svg';
    const search = JSON.stringify({ url: svgUrl });

    return (
      <div>
        <r2dt-web search={search}></r2dt-web>
      </div>
    );
  },
});
