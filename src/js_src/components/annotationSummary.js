import React, { Component } from 'react';
import CategoryLabel from './categoryLabel';

class AnnotationSummary extends Component {
  renderUpdatedBy(d) {
    if (d.date_created && d.created_by) {
      return <span>on {d.date_created} by {d.created_by}</span>;
    }
    return null;
  }

  renderAnnotations() {
    let nodes = this.props.annotations.map( (d, i) => {
      return (
        <div key={'note' + i}>
          <p>
            <CategoryLabel category={d.category} hideLabel /> {d.type} for <a href={d.href} target='_new'>{d.name}</a> {this.renderUpdatedBy(d)}
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
    let message = this.props.message || 'annotations successfully uploaded.';
    return (
      <div>
        <p>{this.props.annotations.length.toLocaleString()} {message}</p>
        {this.renderAnnotations()}
      </div>
    );
  }
}

AnnotationSummary.propTypes = {
  annotations: React.PropTypes.array,
  message: React.PropTypes.string
};

export default AnnotationSummary;
