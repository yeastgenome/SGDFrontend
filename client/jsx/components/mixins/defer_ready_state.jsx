const Actions = require('../../actions');

module.exports = {
  componentWillMount: function () {
    this.setReadyStateFalse();
    if (this.onDeferReadyState) {
      this.onDeferReadyState();
    }
  },

  setReadyStateFalse: function () {
    let action = Actions.setReadyState(false);
    this.props.dispatch(action);
  },

  affirmReadyState: function () {
    let action = Actions.setReadyState(true);
    this.props.dispatch(action);
  },
};
