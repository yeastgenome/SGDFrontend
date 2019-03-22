import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';
import Loader from '../../components/loader';
import fetchData from '../../lib/fetchData';
import { setError, setMessage } from '../../actions/metaActions';
import { connect } from 'react-redux';
// const DATA_URL = '/colleagues_subscriptions';
const SOURCE_URL = '/get_newsletter_sourcecode';
const SEND_EMAIL = '/send_newsletter';

const previewBox = {
  height: '641px',
  overflow: 'scroll',
  border: '1px solid rgba(0, 0, 0, 0.2)'
};

class NewsLetter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://wiki.yeastgenome.org/index.php/SGD_Newsletter,_Fall_2018',
      code: '',
      subject: '',
      recipients: '',
      isPending: false
    };

    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleSubmitForm = this.handleSubmitForm.bind(this);
    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handlerenderCode = this.handlerenderCode.bind(this);

    this.handleSendEmail = this.handleSendEmail.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.handleRecipientsChange = this.handleRecipientsChange.bind(this);
  }
  componentDidMount() {
    // fetchData(SOURCE_URL).then(_source => {
    //   this.setState({ code: _source.code });
    // });
  }

  handleUrlChange(event) {
    this.setState({ url: event.target.value });
  }

  handleSubmitForm() {
    this.setState({ isPending: true, code: '' });
    fetchData(SOURCE_URL, {
      type: 'POST',
      data: {
        url: this.state.url
      }
    }).then((data) => {
      this.setState({ isPending: false });
      this.setState({ code: data.code });
    }).catch((data) => {
      this.setState({ isPending: false });
      this.props.dispatch(setError(data.error));
    });
  }

  handlerenderCode() {
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
  }

  handleSubjectChange(event) {
    this.setState({ subject: event.target.value });
  }

  handleRecipientsChange(event) {
    this.setState({ recipients: event.target.value });
  }

  handleSendEmail() {
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

  render() {
    return (
      <CurateLayout>
        {
          <form>
            <div className="row">
              <div className="columns large-12">
                <h1>NewsLetter</h1>
                {/* URL */}
                <div className="row">
                  <label className="columns medium-12 large-9">URL
                    <input type="url" placeholder="Enter URL for newsletter" value={this.state.url} onChange={this.handleUrlChange} />
                    <button type="button" onClick={this.handleSubmitForm} className="button">Get source code</button>
                  </label>
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
                        {this.handlerenderCode()}
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
                  </label>
                </div>
                {/* Recipients */}
                <div className="row">
                  <label className="columns medium-12 large-9">Recipients (This is just for testing, will not be available in production)
                <input type="url" placeholder="Enter emails with ; seperated" value={this.state.recipients} onChange={this.handleRecipientsChange} />
                  </label>
                </div>
                {/* Send button */}
                <div className="row">
                  <div className="columns large-12">
                    <button type="button" onClick={this.handleSendEmail} className="button">Send Email</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        }
      </CurateLayout>);
  }
}

function mapStateToProps(state) {
  return state;
}

// export default NewsLetter;
export default connect(mapStateToProps)(NewsLetter);
