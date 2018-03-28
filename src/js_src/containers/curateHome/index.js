import React, { Component } from 'react';

import style from './style.css';
import fetchData from '../../lib/fetchData';
import getPusherClient from '../../lib/getPusherClient';
import AnnotationSummary from '../../components/annotationSummary';
import Loader from '../../components/loader';
import CurateLayout from './layout';

const ANNOTATION_URL = '/annotations';
const CHANNEL = 'sgd';
const EVENT = 'curateHomeUpdate';

class CurateHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isPending: true,
      showEveryone: false,
      annotationData: [],
    };
  }

  componentDidMount() {
    this.fetchData();
    this.listenForUpdates();
    this._isMounted = true;
  }

  componentWillUnmount() {
    this.channel.unbind(EVENT);
    this._isMounted = false;
  }

  handleChange(e) {
    let _showEveryone = (e.target.value === 'EVERYONE');
    this.setState({ showEveryone: _showEveryone }, () => {
      this.fetchData();
    });
  }

  listenForUpdates() {
    let pusher = getPusherClient();
    this.channel = pusher.subscribe(CHANNEL);
    this.channel.bind(EVENT, () => {
      if (this.state.showEveryone) this.fetchData();
    });
  }

  fetchData() {
    let url = ANNOTATION_URL;
    if (this.state.showEveryone) url = `${ANNOTATION_URL}?everyone=1`;
    this.setState({ isPending: true });
    fetchData(url).then( (data) => {
      if (this._isMounted) this.setState({ annotationData: data, isPending: false });
    });
  }

  renderSelector() {
    return (
      <span onChange={this.handleChange.bind(this)}>
        <span>Annotations by</span>
        <input defaultChecked={true} id='annotationsMe' name='annotationsBy' style={{ marginLeft: '1rem' }} type='radio' value='ME' />
        <label htmlFor='annotationsMe'>Me</label>
        <input id='annotationsE' name='annotationsBy' type='radio' value='EVERYONE' />
        <label htmlFor='annotationsE'>Everyone</label>
      </span>
    );
  }

  renderContent() {
    if (this.state.isPending) return <Loader />;
    return (
      <div className={style.annotationContainer}>
        <AnnotationSummary annotations={this.state.annotationData} message='recent annotations.' />
      </div>
    );
  }

  render() {
    return <CurateLayout><div>{this.renderSelector()}{this.renderContent()}</div></CurateLayout>;
  }
}

export default CurateHome;
