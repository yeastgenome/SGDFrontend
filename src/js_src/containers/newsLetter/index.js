import React, { Component } from 'react';
import CurateLayout from '../curateHome/layout';
import Loader from '../../components/loader';
import fetchData from '../../lib/fetchData';
import { setError } from '../../actions/metaActions';
import { connect } from 'react-redux';
// const DATA_URL = '/colleagues_subscriptions';
const SOURCE_URL = '/get_newsletter_sourcecode';
const SEND_EMAIL = '/send_newsletter';

const previewBox = {
  height: '630px',
  overflow: 'scroll',
  border: '1px solid rgba(0, 0, 0, 0.2)'
};

class NewsLetter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'https://wiki.yeastgenome.org/index.php/SGD_Newsletter,_Fall_2018',
      code: '',
      isPending: false
    };

    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.urlChange = this.urlChange.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
  }
  componentDidMount() {
    // fetchData(SOURCE_URL).then(_source => {
    //   this.setState({ code: _source.code });
    // });
  }

  urlChange(event) {
    this.setState({ url: event.target.value });
  }

  submitForm() {
    this.setState({ isPending: true, code: '' });
    fetchData(SOURCE_URL, {
      type: 'POST',
      data: { url: this.state.url }
    }).then((data) => {
      this.setState({ isPending: false });
      this.setState({ code: data.code });
    }).catch((data) => {
      this.setState({ isPending: false });
      this.props.dispatch(setError(data.error));
    });
  }

  renderCode() {
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

  sendEmail() {
    fetchData(SEND_EMAIL, {
      type: 'POST',
      data: { html: this.state.code }
    }).then((data) => {
      console.log(data);
    }).catch((data) => {
      console.log(data);
    });

  }

  render() {
    return (
      <CurateLayout>
        {
          <div className="row">
            <div className="columns large-12">
              <h1>NewsLetter</h1>
              
              

              <div className="row">
                <label className="columns medium-12 large-9">URL 
                <input type="url"  placeholder="Enter URL for newsletter" value={this.state.url} onChange={this.urlChange} />
                <button type="button" onClick={this.submitForm} className="button">Get source code</button>
                </label>
              </div>

              <div className="row">
                <div className="column medium-6 large-6">
                  <div className="row">
                    <div className="column medium-12 large-12">
                      <label>HTML Code</label>
                    </div>
                  </div>
                  <div className="row">
                    <div className="column medium-12 large-12">
                      {this.renderCode()}
                    </div>
                  </div>
                </div>

                <div className="column medium-6 large-6">
                  <div className="row">
                    <div className="column medium-12 large-12">
                      <label>Previw Area</label>
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

              <div className="row">
              </div>

              <div className="row">
                <div className="columns large-12">
                  <button type="button" onClick={this.sendEmail} className="button">Send Email</button>
                </div>
              </div>
            </div>
          </div>
        }
      </CurateLayout>);
  }
}

function mapStateToProps(state) {
  return state;
}

// export default NewsLetter;
export default connect(mapStateToProps)(NewsLetter);
