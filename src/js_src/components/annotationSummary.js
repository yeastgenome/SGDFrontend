import React, { Component } from 'react';
import CategoryLabel from './categoryLabel';

class AnnotationSummary extends Component {
  renderAnnotations() {
    let nodes = this.props.annotations.map( (d, i) => {
      return (
        <div key={'note' + i}>
          <p>
            <CategoryLabel category={d.category} hideLabel /> {d.type} for <a href={d.href} target='_new'>{d.name}</a>
          </p>
          <blockquote>
            {d.value}
          </blockquote>
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
