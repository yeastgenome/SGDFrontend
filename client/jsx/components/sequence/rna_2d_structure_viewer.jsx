'use strict';
var React = require('react');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

// Secondary structure for an RNA, drawn by RNAcentral's r2dt-web widget.
//
// The widget fetches the structure with fetch(), and rnacentral.org only sends
// CORS headers to its own origins, so its {"urs": ...} mode fails in the
// browser. We point the widget's {"url": ...} mode at our same-origin proxy
// (misc_views.rnacentral_2d_svg) instead, which returns the same R2DT SVG.
//
// RNAcentral serves the full R2DT layout and the LSP thumbnail from different
// endpoints; for some RNAs the layout endpoint fails (404/500, e.g. SNR8) while
// the backbone-outline thumbnail still works. The
// proxy answers 404 then, and the widget would show a confusing "The provided
// URL does not return an SVG." error, so check the proxy first and only mount
// the widget when a structure exists.
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

  getInitialState: function () {
    return { status: 'loading' };
  },

  componentDidMount: function () {
    this._isMounted = true;
    fetch(this._svgUrl(), { method: 'GET' })
      .then((response) => {
        if (this._isMounted) {
          this.setState({ status: response.ok ? 'ok' : 'missing' });
        }
      })
      .catch(() => {
        if (this._isMounted) {
          this.setState({ status: 'missing' });
        }
      });
  },

  componentWillUnmount: function () {
    this._isMounted = false;
  },

  _svgUrl: function () {
    return (
      window.location.origin +
      '/rnacentral/2d/' +
      encodeURIComponent(this.props.ursID) +
      '.svg'
    );
  },

  render: function () {
    if (this.state.status === 'loading') {
      return null;
    }
    if (this.state.status === 'missing') {
      const rnacentralUrl =
        'https://rnacentral.org/rna/' +
        encodeURIComponent(this.props.ursID) +
        '/559292';
      return (
        <p>
          RNAcentral is not currently serving the full R2DT secondary structure
          layout for {this.props.ursID}; the thumbnail above is RNAcentral&apos;s
          outline of the same structure. See the entry at{' '}
          <a href={rnacentralUrl} target="_blank" rel="noopener noreferrer">
            RNAcentral
          </a>
          .
        </p>
      );
    }
    const search = JSON.stringify({ url: this._svgUrl() });
    return (
      <div>
        <r2dt-web search={search}></r2dt-web>
      </div>
    );
  },
});
