import _ from 'underscore';

// temp fixture
const DEFAULT_STATE = {
  activeEntries: [
    {
      id: '12345abc',
      title: 'Lorem Ipsum dalor it Clylin Dependent Protein Serine',
      author: 'Lorem et al.',
      journal: 'Nucleic Acids Research',
      abstract: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      status: 'untriaged'
    },
    {
      id: '67990cde',
      title: 'Lorem Ipsum dalor it Clylin Dependent Protein Serine',
      author: 'Lorem et al.',
      journal: 'Nucleic Acids Research',
      abstract: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      status: 'untriaged'
    },
    {
      id: '67990cde',
      title: 'Lorem Ipsum dalor it Clylin Dependent Protein Serine',
      author: 'Lorem et al.',
      journal: 'Nucleic Acids Research',
      abstract: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      status: 'untriaged'
    }
  ],
  activeLitEntry: {
    id: '12345abc',
    title: 'Lorem Ipsum dalor it Clylin Dependent Protein Serine',
    author: 'Lorem et al.',
    journal: 'Nucleic Acids Research',
    abstract: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    status: 'untriaged'
  }
};

export default function litReducer(_state, action) {
  if (typeof _state === 'undefined') return DEFAULT_STATE;
  let state = _.clone(_state);
  switch (action.type) {
  default:
    return state;
  }
}
