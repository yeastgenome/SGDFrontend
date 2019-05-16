import React ,{Component} from 'react';

class TableRow extends Component{
  constructor(props){
    super(props);
  }


  render(){

    var columns = [];
    for(var key in this.props.row_data){
      if(key != 'annotation_id'){
        columns.push(<td key={key}><input name='text' value={this.props.row_data[key]} readOnly /></td>);
      }
    }

    // var columns = this.props.row_data.map((row) => {
    //   return <td key={row.annotation_id}><input name='text' /></td>;
    // });

    columns.push(
      <td key='butt'>
        <button className='button'>edit</button>
        <button className='button'>delete</button>
      </td>);

    return(
      <tr key={this.props.row_data.annotation_id}>
        {columns}
      </tr>
    );
  }
}

TableRow.propTypes = {
  row_data:React.PropTypes.object.isRequired
};


export default TableRow;