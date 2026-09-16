#!/bin/zsh
# Batch-render AlphaFold thumbnails for the whole yeast proteome and sync to S3.
set -e
cd "$(dirname "$0")"

echo "=== downloading proteome tar ==="
curl -sf -o yeast_v6.tar "https://ftp.ebi.ac.uk/pub/databases/alphafold/latest/UP000002311_559292_YEAST_v6.tar"

mkdir -p pdb png
echo "=== extracting pdb files ==="
tar -xf yeast_v6.tar -C pdb --include='*.pdb.gz' 2>/dev/null || tar -xf yeast_v6.tar -C pdb '*.pdb.gz'
gunzip -f pdb/*.pdb.gz
ls pdb | wc -l

echo "=== rendering ==="
render_one() {
  local f=$1
  # AF-Q06551-F1-model_v6.pdb -> Q06551.png
  local base=$(basename "$f" .pdb)
  local uid=${base#AF-}
  uid=${uid%%-F1*}
  local out="png/${uid}.png"
  [[ -s $out ]] && return 0
  pymol -cq render_af_thumb.py -- "$f" "$out" >/dev/null 2>&1 || echo "FAILED $uid" >> failures.log
}
export -f render_one 2>/dev/null || true

# zsh: no export -f; use a loop feeding xargs with an inline shell
ls pdb/*.pdb | xargs -P 8 -I {} zsh -c '
  f={}
  base=$(basename "$f" .pdb)
  uid=${base#AF-}
  uid=${uid%%-F1*}
  out="png/${uid}.png"
  [[ -s $out ]] && exit 0
  pymol -cq render_af_thumb.py -- "$f" "$out" >/dev/null 2>&1 || echo "FAILED $uid" >> failures.log
'
echo "rendered: $(ls png | wc -l), failures: $(wc -l < failures.log 2>/dev/null || echo 0)"

echo "=== uploading to S3 ==="
aws s3 sync png/ s3://sgd-prod-assets/alphafold-thumbnails/ \
  --profile sgd-prod --acl public-read \
  --cache-control "max-age=2629740, public" \
  --content-type image/png --only-show-errors
echo "=== done: $(aws s3 ls s3://sgd-prod-assets/alphafold-thumbnails/ --profile sgd-prod | wc -l) objects in S3 ==="
