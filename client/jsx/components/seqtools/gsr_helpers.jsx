module.exports = {
  StrainMapping() {
    return {
      S288C: 'S. cerevisiae Reference Strain S288C',
      'CEN.PK': 'S. cerevisiae Strain CEN.PK2-1Ca_JRIV01000000',
      'D273-10B': 'S. cerevisiae Strain D273-10B_JRIY00000000',
      FL100: 'S. cerevisiae Strain FL100_JRIT00000000',
      'JK9-3d': 'S. cerevisiae Strain JK9-3d_JRIZ00000000',
      'RM11-1a': 'S. cerevisiae Strain RM11-1A_JRIP00000000',
      SEY6210: 'S. cerevisiae Strain SEY6210_JRIW00000000',
      Sigma1278b: 'S. cerevisiae Strain Sigma1278b-10560-6B_JRIQ00000000',
      SK1: 'S. cerevisiae Strain SK1_NCSL00000000',
      W303: 'S. cerevisiae Strain W303_JRIU00000000',
      'X2180-1A': 'S. cerevisiae Strain X2180-1A_JRIX00000000',
      Y55: 'S. cerevisiae Strain Y55_JRIF00000000',
    };
  },

  NumToRoman() {
    return {
      1: 'I',
      2: 'II',
      3: 'III',
      4: 'IV',
      5: 'V',
      6: 'VI',
      7: 'VII',
      8: 'VIII',
      9: 'IX',
      10: 'X',
      11: 'XI',
      12: 'XII',
      13: 'XIII',
      14: 'XIV',
      15: 'XV',
      16: 'XVI',
      17: 'mt',
    };
  },

  TopDescription() {
    return "<p><h3>The Gene/Sequence Resources tool allows retrieval of a list of options for accessing biological information, table/map displays, and sequence analysis tools for <b><a href='#gene'>1. a list of named genes or sequences.</a> <a href='#chr'>2. a specified chromosomal region</a>, or <a href='#seq'>3. a raw DNA or protein sequence.</a></b></h3></p>";
  },
};
