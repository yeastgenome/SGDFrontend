/*eslint-disable no-case-declarations */
import { fromJS } from 'immutable';

// temp fixture
const DEFAULT_STATE = fromJS({
  activeEntries: [
    {
      id: '12345abc',
      isTriage: false,
      citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
      title: 'Lorem Ipsum dalor it Clylin Dependent Protein Serine',
      tags: ['Pathways', 'Phenotype needs review'],
      assignees: [
        {
          username: 'user2',
          name: 'Harriet Tubman'
        }
      ]
    }
  ],
  triageEntries: [
    {
      id: '12345abc',
      isTriage: true,
      citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
      title: 'Lorem Ipsum dalor it Clylin Dependent Protein Serine',
      tags: ['Fast Track'],
      assignees: [
        {
          username: 'user1',
          name: 'Thomas Dewey'
        }
      ]
    },
    {
      id: '12345abc',
      isTriage: true,
      citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
      title: 'Lorem Ipsum dalor it Clylin Dependent Protein Serine',
      tags: ['Pathways', 'Phenotype needs review'],
      assignees: [
        {
          username: 'user2',
          name: 'Harriet Tubman'
        }
      ]
    }
  ],
  activeLitEntry: {
    id: '12345abc',
    title: 'Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
    author: 'Lorem et al.',
    citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open',
    journal: 'Nucleic Acids Research',
    abstract: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    status: 'reviewing',
    tags: ['Pathways', 'Phenotype needs review'],
    assignees: [
      {
        username: 'user2',
        name: 'Harriet Tubman'
      }
    ]
  }
});

export default function litReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
  case 'UPDATE_TAGS':
    let updatedLitEntry = state.get('activeLitEntry').toJS();
    updatedLitEntry.tags = action.payload;
    return state.set('activeLitEntry', fromJS(updatedLitEntry));
  default:
    return state;
  }
}
