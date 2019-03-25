import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';
import Loader from '../../components/loader';
import fetchData from '../../lib/fetchData';
import { setError, setMessage } from '../../actions/metaActions';
import { connect } from 'react-redux';
const RECIPIENT_URL = '/colleagues_subscriptions';
const SOURCE_URL = '/get_newsletter_sourcecode';
const SEND_EMAIL = '/send_newsletter';
const VISIBLE_ERROR = 'form-error is-visible';
const INVISIBLE_ERROR = 'form-error';

const previewBox = {
  height: '641px',
  overflow: 'scroll',
  border: '1px solid rgba(0, 0, 0, 0.2)'
};


class NewsLetter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: '',
      code: '',
      subject: '',
      recipients: '',
      isPending: false,

      urlError:INVISIBLE_ERROR,
      codeError:INVISIBLE_ERROR,
      subjectError:INVISIBLE_ERROR,
      recipientsError:INVISIBLE_ERROR,

      isSubmitButtonDisabled : true
    };

    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleSubmitURL = this.handleSubmitURL.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleRenderCode = this.handleRenderCode.bind(this);

    this.handleSendEmail = this.handleSendEmail.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.handleRecipientsChange = this.handleRecipientsChange.bind(this);
    this.handleGettingRecipients = this.handleGettingRecipients.bind(this);

    this.handleErrorChecking = this.handleErrorChecking.bind(this);
  }

  handleUrlChange(event) {
    this.setState({ url: event.target.value, code: '' });
    if(event.target.value.length== 0){
      this.setState({urlError:VISIBLE_ERROR},this.handleErrorChecking);
    }
    else{
      this.setState({urlError:INVISIBLE_ERROR});
    }

    // this.handleErrorChecking();
  }

  handleSubmitURL() {
    this.setState({ isPending: true, code: '' });
    fetchData(SOURCE_URL, {
      type: 'POST',
      data: {
        url: this.state.url
      }
    }).then((data) => {
      this.setState({ isPending: false,code: data.code,codeError:INVISIBLE_ERROR },this.handleErrorChecking);
    }).catch((data) => {
      this.setState({ isPending: false },this.handleErrorChecking);
      this.props.dispatch(setError(data.error));
    });

  }

  handleRenderCode() {
    if (this.state.isPending) return <Loader />;
    return (<textarea rows="26" cols="10" onChange={this.handleCodeChange} value={this.state.code}></textarea>);
  }

  preview() {
    let htmlText = () => ({ __html: this.state.code });
    return (
      <div dangerouslySetInnerHTML={htmlText()}></div>
    );
  }

  handleCodeChange(event) {
    this.setState({ code: event.target.value });

    if(event.target.value.length== 0){
      this.setState({codeError:VISIBLE_ERROR},this.handleErrorChecking);
    }
    else{
      this.setState({codeError:INVISIBLE_ERROR},this.handleErrorChecking);
    }

    // this.handleErrorChecking();
  }

  handleSubjectChange(event) {
    this.setState({ subject: event.target.value });
    if(event.target.value.length == 0){
      this.setState({subjectError:VISIBLE_ERROR},this.handleErrorChecking);
    }
    else{
      this.setState({subjectError:INVISIBLE_ERROR},this.handleErrorChecking);
    }
  }

  handleRecipientsChange(event) {
    this.setState({ recipients: event.target.value });
    if(event.target.value.length == 0){
      this.setState({recipientsError:VISIBLE_ERROR},this.handleErrorChecking);
    }
    else{
      this.setState({recipientsError:INVISIBLE_ERROR},this.handleErrorChecking);
    }
  }

  handleGettingRecipients() {
    this.setState({recipients:''});
    fetchData(RECIPIENT_URL, {
      type: 'GET'
    }).then((data) => {
      this.setState({ recipients: data.colleagues,recipientsError:INVISIBLE_ERROR },this.handleErrorChecking);
    }).catch((data) => {
      this.props.dispatch(setError(data.error),this.handleErrorChecking);
    });
  }

  handleSendEmail() {

    if (window.confirm('Are you sure, sending this newsletter?')) {
      fetchData(SEND_EMAIL, {
        type: 'POST',
        data: {
          html: this.state.code, subject: this.state.subject, recipients: this.state.recipients
        }
      }).then((data) => {
        this.props.dispatch(setMessage(data.success));
      }).catch((data) => {
        this.props.dispatch(setError(data.error));
      });
    }
  }

  handleErrorChecking(){
    if(this.state.url.length > 0 && this.state.code.length > 0 && this.state.subject.length > 0 && this.state.recipients.length > 0 ){
      this.setState({isSubmitButtonDisabled: false});
    }
    else{
      this.setState({isSubmitButtonDisabled: true});
    }
  }

  render() {
    return (
      <CurateLayout>
        {
          <form>

            <div className="row">
              <div className="columns large-12">
                <h1>NewsLetter</h1>

                {/* URL Label*/}
                <div className="row">
                  <div className="columns medium-12">
                    <label> URL </label>
                  </div>
                </div>
                
                {/* URL*/}
                <div className="row">
                  <div className="columns medium-8">
                    <input type="url" placeholder="Enter URL for newsletter" value={this.state.url} onChange={this.handleUrlChange} />
                    <label data-alert className={this.state.urlError}>URL is required</label>
                  </div>
                  <div className="columns medium-4">
                    <button type="button" onClick={this.handleSubmitURL} className="button">Get source code</button>
                  </div>
                </div>

                {/* Source code */}
                <div className="row">
                  <div className="column medium-6 large-6">
                    <div className="row">
                      <div className="column medium-12 large-12">
                        <label>HTML Code</label>
                      </div>
                    </div>
                    <div className="row">
                      <div className="column medium-12 large-12">
                        {this.handleRenderCode()}
                        <label data-alert className={this.state.codeError}>HTML code is required</label>
                      </div>
                    </div>
                  </div>

                  <div className="column medium-6 large-6">
                    <div className="row">
                      <div className="column medium-12 large-12">
                        <label>Preview Area</label>
                      </div>
                    </div>
                    <div className="row">
                      <div className="column medium-12 large-11" style={previewBox}>
                        {/* <textarea rows="5" cols="10" value={this.state.code}></textarea> */}
                        {this.preview()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HTML code and Preview */}
                <div className="row">
                </div>

                {/* Subject line */}
                <div className="row">
                  <label className="columns medium-12 large-9">Subject Line
                  <input type="url" placeholder="Enter newsletter subject line" value={this.state.subject} onChange={this.handleSubjectChange} />
                  <label data-alert className={this.state.subjectError}>Subject line is required</label>
                  </label>
                </div>

                {/* Recipients Label */}
                <div className="row">
                  <div className="large-8 columns">
                    <label>Recipients</label>
                  </div>
                </div>

                {/* Recipients*/}
                <div className="row">
                  <div className="large-8 columns">
                    <textarea rows="3" cols="10" type="url" placeholder="Enter emails with ; seperated" value={this.state.recipients} onChange={this.handleRecipientsChange} />
                    <label data-alert className={this.state.recipientsError}>Recipient(s) is required</label>
                  </div>

                  <div className="large-4 columns">
                    <button type="button" onClick={this.handleGettingRecipients} className="button">Get recipients from database</button>
                  </div>

                  {/* <label className="columns medium-12 large-9">Recipients
                  <textarea rows="5" cols="10" type="url" placeholder="Enter emails with ; seperated" value={this.state.recipients} onChange={this.handleRecipientsChange} />
                  </label> */}
                </div>

                {/* Send button */}
                <div className="row">
                  <div className="columns large-12">
                    <button type="button" onClick={this.handleSendEmail} className="button" disabled={this.state.isSubmitButtonDisabled}>Send Email</button>
                  </div>
                </div>
              </div>
            </div>

          </form>
        }
      </CurateLayout>);
  }
}

NewsLetter.propTypes = {
  dispatch: React.PropTypes.func
};

function mapStateToProps(state) {
  return state;
}

// export default NewsLetter;
export default connect(mapStateToProps)(NewsLetter);
