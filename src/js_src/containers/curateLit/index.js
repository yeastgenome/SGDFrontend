import React, { Component } from 'react';
import CategoryLabel from '../../components/categoryLabel';

class CurateLitOverview extends Component {
  render() {
    return (
      <div>
        <p>3 annotations</p>
        <h5><CategoryLabel category='locus' /></h5>
        <ul>
          <li>
            <p>summary paragraph for <a>RAD54</a></p>
            <blockquote>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
            </blockquote>
          </li>
        </ul>
        <h5><CategoryLabel category='phenotype' /></h5>
        <ul>
          <li>
            <p><a>RAD54</a> to <a>bud morphology: abnormal</a></p>
          </li>
          <li>
            <p><a>RAD54</a> to <a>cell cycle progression in G1 phase: decreased duration</a></p>
          </li>
        </ul>
      </div>
    );
  }
}

export default CurateLitOverview;
