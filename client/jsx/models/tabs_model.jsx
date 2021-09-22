'use strict';

/*
	Different than other models, in that it doesn't make a request.  Initialize with rawTabsData and tabType (ie "summary")
*/
module.exports = class TabsModel {
  constructor(options) {
    var options = options || {};
    options.tabType = options.tabType || 'summary';
    options.rawTabsData = options.rawTabsData || {
      protein_tab: false,
      go_tab: false,
      disease_tab: false,
      phenotype_tab: false,
      interaction_tab: false,
      regulation_tab: false,
      expression_tab: false,
      literature_tab: false,
    };
    this.attributes = options;
  }

  getTabElements() {
    var _parseFns = {
      sequence: this._getSequenceTabs,
      summary: this._getSummaryTabs,
    };

    return _parseFns[this.attributes.tabType].call(this);
  }

  getNavTitle(displayName, formatName) {
    return displayName === formatName
      ? displayName
      : `${displayName} / ${formatName}`;
  }

  _getSequenceTabs() {
    var altElement = this.attributes.hasAltStrains
      ? { name: 'Alternative Reference Strains', target: 'alternative' }
      : null;
    var otherElement = this.attributes.hasOtherStrains
      ? { name: 'Other Strains', target: 'other' }
      : null;
    var vvElement = this.attributes.hasVariants
      ? { name: 'Variants', target: 'variants' }
      : null;

    var strainText = 'Reference Strain: S288C';
    if (this.attributes.mainStrain != 'S288C') {
      vvElement = null;
      strainText = 'Strain: ' + this.attributes.mainStrain;
    }
    return [
      { name: 'Sequence Overview', target: 'overview' },
      { name: strainText, target: 'reference' },
      altElement,
      vvElement,
      otherElement,
      { name: 'History', target: 'history' },
      { name: 'Resources', target: 'resources' },
    ];
  }

  _getSummaryTabs() {
    return [
      { name: 'Locus Overview', target: 'overview' },
      this.attributes.rawTabsData.sequence_section
        ? { name: 'Sequence', target: 'sequence' }
        : null,
      this.attributes.rawTabsData.protein_tab
        ? { name: 'Protein', target: 'protein' }
        : null,
      this.attributes.hasAlleles
        ? { name: 'Alleles', target: 'allele' }
        : null,
      this.attributes.rawTabsData.go_tab
        ? { name: 'Gene Ontology', target: 'go' }
        : null,
      this.attributes.hasComplexes
        ? { name: 'Complex', target: 'complex' }
        : null,
      this.attributes.hasPathways
        ? { name: 'Pathways', target: 'pathway' }
        : null,
      this.attributes.rawTabsData.phenotype_tab
        ? { name: 'Phenotype', target: 'phenotype' }
        : null,
      this.attributes.rawTabsData.disease_tab
        ? { name: 'Disease', target: 'disease' }
        : null,
      this.attributes.rawTabsData.interaction_tab
        ? { name: 'Interaction', target: 'interaction' }
        : null,
      this.attributes.rawTabsData.regulation_tab
        ? { name: 'Regulation', target: 'regulation' }
        : null,
      this.attributes.rawTabsData.expression_tab
        ? { name: 'Expression', target: 'expression' }
        : null,
      this.attributes.hasParagraph
        ? { name: 'Summary Paragraph', target: 'paragraph' }
        : null,
      this.attributes.rawTabsData.literature_tab
        ? { name: 'Literature', target: 'literature' }
        : null,
      this.attributes.hasHistory
        ? { name: 'History', target: 'history' }
        : null,
      this.attributes.hasReferences
        ? { name: 'References', target: 'reference' }
        : null,
      // always have resources on LSP
      { name: 'Resources', target: 'resources' },
    ];
  }
};
