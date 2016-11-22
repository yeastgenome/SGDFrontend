import { fromJS } from 'immutable';

// temp fixture
const DEFAULT_STATE = fromJS({
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
});

export default function litReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
  default:
    return state;
  }
}
