# Render an AlphaFold model as a static thumbnail PNG with standard
# AlphaFold pLDDT confidence coloring (pLDDT is stored in the B-factor
# column of AFDB model files).
#
# Usage: pymol -cq render_af_thumb.py -- <input.pdb> <output.png>

import sys

from pymol import cmd

pdb_path, png_path = sys.argv[1], sys.argv[2]

cmd.load(pdb_path, 'afm')
cmd.hide('everything')
cmd.show('cartoon')

# AlphaFold pLDDT confidence colors
cmd.set_color('af_very_high', [0.000, 0.325, 0.839])  # #0053D6 pLDDT > 90
cmd.set_color('af_confident', [0.396, 0.796, 0.953])  # #65CBF3 70-90
cmd.set_color('af_low',       [1.000, 0.859, 0.075])  # #FFDB13 50-70
cmd.set_color('af_very_low',  [1.000, 0.490, 0.271])  # #FF7D45 < 50
cmd.color('af_very_low',  'afm')
cmd.color('af_low',       'afm and b > 50')
cmd.color('af_confident', 'afm and b > 70')
cmd.color('af_very_high', 'afm and b > 90')

cmd.bg_color('white')
cmd.set('ray_opaque_background', 1)
cmd.set('antialias', 2)
cmd.set('cartoon_fancy_helices', 1)
cmd.orient()
cmd.zoom('afm', buffer=2)
cmd.png(png_path, width=800, height=600, dpi=96, ray=1)
