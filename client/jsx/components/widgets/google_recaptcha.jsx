'use strict';

var React = require('react');
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

// React port of the Google recaptcha, documented at https://developers.google.com/recaptcha/docs/display.
// *** NOTE, requires script tag to be included and loaded from google, see docs ***
//  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
module.exports = createReactClass({
  displayName: 'GoogleReCaptcha',
  propTypes: {
    onComplete: PropTypes.func.isRequired, // (response) =>
  },

  render: function () {
    return (
      <div
        ref={(gReCaptchaTarget) => (this.gReCaptchaTarget = gReCaptchaTarget)}
      />
    );
  },

  componentDidMount: function () {
    setTimeout(() => {
      grecaptcha.render(this.gReCaptchaTarget, {
        sitekey: '6LczNgATAAAAABpwOd3T4voHxUf2mtP_MybHqKqk',
        callback: this.props.onComplete,
      });
    }, 500);
  },
});
