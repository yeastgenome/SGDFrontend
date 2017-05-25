import React, { Component } from 'react';

import fetchData from '../../lib/fetchData';
import getPusherClient from '../../lib/getPusherClient';
import AnnotationSummary from '../../components/annotationSummary';
import LoadingPage from '../../components/loadingPage';

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
  }

  componentWillUnmount() {
    this.channel.unbind(EVENT);
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
      this.setState({ annotationData: data, isPending: false });
    });
  }

  render() {
    if (this.state.isPending) return <LoadingPage />;
    return (
      <div>
        <AnnotationSummary annotations={this.state.annotationData} message='recent annotations.' />
      </div>
    );
  }
}

export default CurateHome;
