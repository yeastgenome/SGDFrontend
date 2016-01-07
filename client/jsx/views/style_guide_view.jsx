const React = require("react");
const ReactDOM = require("react-dom");

const StyleGuide = React.createClass({
	render () {
    return (
      <div>
        <h1>Style Guide</h1>
      </div>
    );
  }
});

const styleGuideView = {};
styleGuideView.render = function () {
  console.log('yello')
	ReactDOM.render(<StyleGuide />, document.getElementById("j-main"));
};

module.exports = styleGuideView;
