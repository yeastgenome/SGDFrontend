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

  listenForUpdates() {
    let pusher = getPusherClient();
    this.channel = pusher.subscribe(CHANNEL);
    this.channel.bind(EVENT, () => {
      this.fetchData();
    });
  }

  fetchData() {
    fetchData(ANNOTATION_URL).then( (data) => {
      if (this._isMounted) this.setState({ annotationData: data, isPending: false });
    });
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
    return <CurateLayout>{this.renderContent()}</CurateLayout>;
  }
}

export default CurateHome;
