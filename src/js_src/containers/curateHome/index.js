import React, { Component } from 'react';

import fetchData from '../../lib/fetchData';
import AnnotationSummary from '../../components/annotationSummary';
import LoadingPage from '../../components/loadingPage';

const ANNOTATION_URL = '/annotations';

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
        <AnnotationSummary annotations={this.state.annotationData} />
      </div>
    );
  }
}

export default CurateHome;
