import React, { Component } from 'react';
import Loader from '../../components/loader';
import fetchData from '../../lib/fetchData';
import { setError, setMessage } from '../../actions/metaActions';
import { connect } from 'react-redux';
import style from './style.css';
import { setURL, setCode, setSubject, setRecipients } from '../../actions/newsLetterActions';
import PropTypes from 'prop-types';
const RECIPIENT_URL = '/colleagues_subscriptions';
const SOURCE_URL = '/get_newsletter_sourcecode';
const SEND_EMAIL = '/send_newsletter';


class NewsLetterForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isErrorURL:false,
      isErrorCode:false,
      isErrorSubject:false,
      isErrorRecipients:false,
      isPending:false
    };

    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleSubmitURL = this.handleSubmitURL.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleRenderCode = this.handleRenderCode.bind(this);

    this.handleSendEmail = this.handleSendEmail.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.handleRecipientsChange = this.handleRecipientsChange.bind(this);
    this.handleGettingRecipients = this.handleGettingRecipients.bind(this);
  }


  handleUrlChange(event) {
    this.props.updateURL(event.target.value);
    this.props.updateCode('');

    if (event.target.value.length == 0) {
      this.setState({ isErrorURL: true });
    }
    else {
      this.setState({ isErrorURL: false});
    }
  }

  handleCodeChange(event) {
    this.props.updateCode(event.target.value);

    if (event.target.value.length == 0) {
      this.setState({ isErrorCode: true });
    }
    else {
      this.setState({ isErrorCode: false });
    }
  }

  handleSubjectChange(event) {
    this.props.updateSubject(event.target.value);
    if (event.target.value.length == 0) {
      this.setState({ isErrorSubject: true });
    }
    else {
      this.setState({ isErrorSubject: false });
    }
  }

  handleRecipientsChange(event) {
    this.props.updateRecipients(event.target.value);

    if (event.target.value.length == 0) {
      this.setState({ isErrorRecipients: true });
    }
    else {
      this.setState({ isErrorRecipients: false });
    }
  }



  handleSubmitURL() {
    this.setState({ isPending: true });
    this.props.updateCode('');
    
    fetchData(SOURCE_URL, {
      type: 'POST',
      data: {
        url: this.props.url
      }
    }).then((data) => {
      this.setState({ isPending: false, isErrorCode : false });
      this.props.updateCode(data.code);
    }).catch((data) => {
      this.setState({ isPending: false,isErrorCode : true });
      this.props.errorMessage(data.error);
    });

  }

  handleRenderCode() {
    if (this.state.isPending) return <Loader />;
    return (<textarea name="code" rows="26" cols="10" onChange={this.handleCodeChange} value={this.props.code}></textarea>);
  }

  preview() {
    let htmlText = () => ({ __html: this.props.code });
    return (
      <div dangerouslySetInnerHTML={htmlText()}></div>
    );
  }

  handleGettingRecipients() {
    this.props.updateRecipients('');

    fetchData(RECIPIENT_URL, {
      type: 'GET'
    }).then((data) => {
      this.props.updateRecipients(data.colleagues);
      this.setState({ isErrorRecipients:false });
    }).catch((data) => {
      this.props.errorMessage(data.error);
    });
  }

  handleSendEmail() {

    if (window.confirm('Are you sure, sending this newsletter?')) {
      fetchData(SEND_EMAIL, {
        type: 'POST',
        data: {
          html: this.props.code, subject: this.props.subject, recipients: this.props.recipients
        }
      }).then((data) => {
        this.props.successMessage(data.success);
      }).catch((data) => {
        this.props.errorMessage(data.error);
      });
    }
  }

  render() {
    const isEnabled = !(this.props.url.length > 0 && this.props.code.length > 0 && this.props.subject.length > 0 && this.props.recipients.length > 0);
    return (
      <div>
        {
          <form>

            <div className="row">
              <div className="columns large-12">
                <h1>NewsLetter</h1>

                {/* URL Label*/}
                <div className="row">
                  <div className="columns medium-12">
                    <label>URL</label>
                  </div>
                </div>

                {/* URL*/}
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" name="url" placeholder="Enter URL for newsletter" value={this.props.url} onChange={this.handleUrlChange} />
                    <label data-alert className={`form-error  + ${this.state.isErrorURL ? 'is-visible' : ''}`}>URL is required</label>
                    
                  </div>
                  <div className="columns medium-4">
                    <button type="button" onClick={this.handleSubmitURL} className="button">Get source code</button>
                  </div>
                </div>

                {/* Source code */}
                <div className="row">
                  <div className="column medium-6 large-6">
                    <div className="row">
                      <div className="columns medium-12">
                        <label>HTML Code</label>
                      </div>
                    </div>
                    <div className="row">
                      <div className="column medium-12 large-12">
                        {this.handleRenderCode()}
                        <label data-alert className={`form-error + ${this.state.isErrorCode ? 'is-visible' :''}`}>HTML code is required</label>
                      </div>
                    </div>
                  </div>

                  <div className="column medium-6 large-6">
                    <div className="row">
                      <div className="columns medium-12">
                        <label>Preview Area</label>
                      </div>
                    </div>
                    <div className="row">
                      <div className={`column medium-12 large-11 ${style.previewBox}`}>
                        {this.preview()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject line */}
                <div className="row">
                  <div className="columns medium-12">
                    <label>Subject Line</label>
                  </div>
                </div>
                <div className="row">
                  <div className="column medium-8">
                    <input type="url" placeholder="Enter newsletter subject line" value={this.props.subject} name="subject" onChange={this.handleSubjectChange} />
                    <label data-alert className={`form-error + ${this.state.isErrorSubject ? 'is-visible' :''}`}>Subject line is required</label>
                  </div>
                </div>

                {/* Recipients Label */}
                <div className="row">
                  <div className="columns medium-12">
                    <label>Recipients</label>
                  </div>
                </div>

                {/* Recipients*/}
                <div className="row">
                  <div className="large-8 columns">
                    <textarea name="recipients" rows="3" cols="10" type="url" placeholder="Enter emails with ; seperated" value={this.props.recipients} onChange={this.handleRecipientsChange} />
                    <label data-alert className={`form-error + ${this.state.isErrorRecipients ? 'is-visible' :''}`}>Recipient(s) is required</label>
                  </div>

                  <div className="large-4 columns">
                    <button type="button" onClick={this.handleGettingRecipients} className="button">Get recipients from database</button>
                  </div>

                </div>

                {/* Send button */}
                <div className="row">
                  <div className="columns large-12">
                    <button type="button" onClick={this.handleSendEmail} className="button" disabled={isEnabled}>Send Email</button>
                  </div>
                </div>
              </div>
            </div>

          </form>
        }
      </div>);
  }
}

NewsLetterForm.propTypes = {
  url: PropTypes.string,
  code: PropTypes.string,
  subject: PropTypes.string,
  recipients: PropTypes.string,
  updateURL: PropTypes.func,
  updateCode: PropTypes.func,
  updateRecipients: PropTypes.func,
  updateSubject: PropTypes.func,
  successMessage: PropTypes.func,
  errorMessage: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    url: state.newsLetter.get('url'),
    code: state.newsLetter.get('code'),
    subject: state.newsLetter.get('subject'),
    recipients: state.newsLetter.get('recipients')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    successMessage:(message) => {dispatch(setMessage(message));},
    errorMessage: (message) => { dispatch(setError(message));},
    updateURL: (url) => { dispatch(setURL(url)); },
    updateCode: (code) => { dispatch(setCode(code)); },
    updateSubject: (subject) => { dispatch(setSubject(subject));},
    updateRecipients: (recipients) => { dispatch(setRecipients(recipients)); }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewsLetterForm);
