# AlphaFold thumbnails for the Locus Summary Page

The LSP Protein section shows a static AlphaFold structure thumbnail
(`locus.jinja2`), served from
`https://d1x6jdqbvd5dr.cloudfront.net/alphafold-thumbnails/<uniprot_id>.png`
(S3 bucket `sgd-prod-assets`, stable prefix — separate from the versioned
frontend asset prefixes). Loci without a model hide the image via onerror.

To (re)generate all thumbnails — needed when AlphaFold DB bumps its model
version (update the tar URL in batch_render.sh):

    ./batch_render.sh

Requires: pymol (headless, e.g. `brew install pymol`), aws cli with a
profile that can write to sgd-prod-assets (see batch_render.sh --profile).
Downloads the AFDB yeast proteome tar, renders each model with standard
pLDDT confidence coloring (render_af_thumb.py), and syncs PNGs to S3.
NOTE: CloudFront caches for ~1 month; after a re-render with changed
images, issue a CloudFront invalidation for /alphafold-thumbnails/*.
