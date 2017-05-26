import React, { Component } from 'react';
import CategoryLabel from './categoryLabel';

const PREVIEW_BASE_URL = 'https://curate.qa.yeastgenome.org';
const LEGACY_BASE_URL = 'http://www.yeastgenome.org';

class AnnotationSummary extends Component {
  formatPreviewUrl(url) {
    return url.replace(LEGACY_BASE_URL, PREVIEW_BASE_URL);
  }

  renderAnnotations() {
    let nodes = this.props.annotations.map( (d, i) => {
      return (
        <div key={'note' + i}>
          <p>
            <CategoryLabel category={d.category} hideLabel /> {d.type} for <a href={this.formatPreviewUrl(d.href)} target='_new'>{d.name}</a>
            <blockquote>
              {d.value}
            </blockquote>
          </p>
        </div>
      );
    });
    return <div>{nodes}</div>;
  }

  render() {
    return (
      <div>
        <p>{this.props.annotations.length.toLocaleString()} annotations successfully uploaded.</p>
        {this.renderAnnotations()}
      </div>
    );
  }
}

AnnotationSummary.propTypes = {
  annotations: React.PropTypes.array
};

export default AnnotationSummary;
