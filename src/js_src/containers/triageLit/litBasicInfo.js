import React, { Component } from 'react';

// import DetailList from '../../components/detailList';

class LitBasicInfo extends Component {
  render() {
    // // TEMP
    // let d = {
    //   id: '#12345abc',
    //   pmid: '123456',
    //   title: 'Lorem Ipsum',
    //   citation: 'Kang MS, et al. (2013) Yeast RAD2, a homolog of human XPG, plays a key role in the regulation of the cell cycle and actin dynamics. Biol Open'
    // };
    // let _fields = ['title'];
    return (
      <div>
        <label><strong>Basic Info</strong> <a href='#'><i className='fa fa-edit' /> Edit</a></label>
        <div className='callout'>
          <label><strong>Abstract</strong></label>
          <p>The nucleotide substrate specificity of yeast poly(A) polymerase (yPAP) toward various C-2- and C-8-modified ATP analogs was examined. 32P-Radiolabeled RNA oligonucleotide primers were incubated with yPAP in the absence of ATP to assay polyadenylation using unnatural ATP substrates. The C-2-modified ATP analogs 2-amino-ATP and 2-chloro (Cl)-ATP were excellent substrates for yPAP. 8-Amino-ATP, 8-azido-ATP, and 8-aza-ATP all produced chain termination of polyadenylation, and no primer extension was observed with the C-8-halogenated derivatives 8-Br-ATP and 8-Cl-ATP. The effects of modified ATP analogs on ATP-dependent poly(A) tail synthesis by yPAP were also examined. Whereas C-2 substitution (2-amino-ATP and 2-Cl-ATP) had little effect on poly(A) tail length, C-8 substitution produced moderate (8-amino-ATP, 8-azido-ATP, and 8-aza-ATP) to substantial (8-Br-ATP and 8-Cl-ATP) reduction in poly(A) tail length. To model the biochemical consequences of 8-Cl-Ado incorporation into RNA primers, a synthetic RNA primer containing a 3'-terminal 8-Cl-AMP residue was prepared. Polyadenylation of this modified RNA primer by yPAP in the presence of ATP was blocked completely. To probe potential mechanisms of inhibition, two-dimensional NMR spectroscopy experiments were used to examine the conformation of two C-8-modified AMP nucleotides, 8-Cl-AMP and 8-amino-AMP. C-8 substitution in adenosine analogs shifted the ribose sugar pucker equilibrium to favor the DNA-like C-2'-endo form over the C-3'-endo (RNA-like) conformation, which suggests a potential mechanism for polyadenylation inhibition and chain termination. Base-modified ATP analogs may exert their biological effects through polyadenylation inhibition and thus may provide useful tools for investigating polyadenylation biochemistry within cells.</p>
        </div>
      </div>
    );
  }
}

export default LitBasicInfo;
