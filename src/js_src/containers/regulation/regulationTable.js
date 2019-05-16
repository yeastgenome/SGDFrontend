import React, { Component } from 'react';
import TableRow from './tableRow';


class RegulationTable extends Component {
  constructor(props) {
    super(props);
  }

  handleChange(e){
    console.log(e.target.value);
  }


  render(){
    var tempData = [
      { annotation_id: '0', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
      { annotation_id: '1', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
      { annotation_id: '2', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
      { annotation_id: '3', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
      { annotation_id: '4', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
      { annotation_id: '5', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
      { annotation_id: '6', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
      { annotation_id: '7', target_id: '', regulator_id: '', taxonomy_id: '', reference_id: '', eco_id: '', regulator_type: '', regulation_type: '', direction: '', happens_during: '', annotation_type: '' },
    ];

    var body = tempData.map(item => 
      <TableRow key={item.annotation_id} id={item.id} row_data={item} />
    );

    return (
      <div className='table-scroll'>
        <table className='table-scroll'>
          <thead>
            <tr>
              {/* <td>Annotation Id</td> */}
              <th>Target gene</th>
              <th>Regulator gene</th>
              <th>Taxonomy</th>
              <th>Reference</th>
              <th>Eco</th>
              <th>Regulator type</th>
              <th>Regulation type</th>
              <th>Direction</th>
              <th>Happens during</th>
              <th>Annotation type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {
              body
            }
          </tbody>
        </table>
      </div>
    );
  }
}

export default RegulationTable;