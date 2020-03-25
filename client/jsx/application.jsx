import react from 'react';
console.log(react.version);
import setup from './lib/setup.jsx';

/*
	Assign views as the values in a views object, which gets assigned to the global views object.
	To execute view logic, use views.example.render()
*/

import expressionView from './views/expression_view.jsx';
import interactionSearch from './views/interaction_search_view.jsx';
import sequenceView from './views/sequence_view.jsx';
import snapshotView from './views/snapshot_view.jsx';
import suggestionView from './views/suggestion_view.jsx';
import blastSgdView from './views/blast_sgd_view.jsx';
import blastFungalView from './views/blast_fungal_view.jsx';
import patmatchView from './views/patmatch_view.jsx';
import restMapperView from './views/restrictionmapper_view.jsx';
import seqToolsView from './views/seqTools_view.jsx';
import goTermFinderView from './views/gotermfinder_view.jsx';
import goSlimMapperView from './views/goslimmapper_view.jsx';
import strainAlignmentView from './views/strain_alignment_view.jsx';
import networkView from './views/network_view.jsx';
import proteinView from './views/protein_view.jsx';
import regulationView from './views/regulation_view.jsx';
import summaryView from './views/summary_view.jsx'
import view from './views/variant_viewer_view.jsx';
import litView from './views/literature_view.jsx';
import reactRouterRender from './react_router_render.jsx';

var views = {
  expression:expressionView,
  interactionSearch: interactionSearch,
  sequence: sequenceView,
  snapshot: snapshotView,
  suggestion: suggestionView,
  blast_sgd: blastSgdView,
  blast_fungal: blastFungalView,
  patmatch: patmatchView,
  restrictionmapper: restMapperView,
  seqTools: seqToolsView,
  goTermFinder: goTermFinderView,
  goSlimMapper: goSlimMapperView,
  strainAlignment: strainAlignmentView,
  network: networkView,
  protein: proteinView,
  regulation: regulationView,
  summary :summaryView,
  variantViewer: view,
  literature: litView,
  router: reactRouterRender
};

// call setup script
setup();

// assign to global view object
window.views = views;
