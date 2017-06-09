// set NODE_ENV again to avoid redux warning in production code
if (process.env.NODE_ENV === 'production') {
	process.env.NODE_ENV = 'production';
}
var setup = require('./lib/setup.jsx');

/*
	Assign views as the values in a views object, which gets assigned to the global views object.
	To execute view logic, use views.example.render()
*/

var views = {
  expression: require('./views/expression_view.jsx'),
  interactionSearch: require('./views/interaction_search_view.jsx'),
  sequence: require('./views/sequence_view.jsx'),
  snapshot: require('./views/snapshot_view.jsx'),
  suggestion: require('./views/suggestion_view.jsx'),
  blast_sgd: require('./views/blast_sgd_view.jsx'),
  blast_fungal: require('./views/blast_fungal_view.jsx'),
  protein: require('./views/protein_view.jsx'),
  regulation: require('./views/regulation_view.jsx'),
  summary: require('./views/summary_view.jsx'),
  variantViewer: require('./views/variant_viewer_view.jsx'),
  router: require('./react_router_render.jsx')

};

// call setup script
setup();

// assign to global view object
window.views = views;
module.exports = views;
