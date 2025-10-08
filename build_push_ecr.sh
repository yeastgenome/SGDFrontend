#!/usr/bin/env bash
set -euo pipefail

# Defaults (overridable by env)
REPO="${REPO:-}"              # required (can be set via -r/--repo)
PROFILE="${PROFILE:-}"        # required (can be set via -p/--profile)
REGION="${REGION:-us-west-2}" # optional
TAG="${TAG:-}"                # optional

usage() {
  # Show dynamic defaults without leaking secrets
  local _repo="${REPO:-<required>}"
  local _profile="${PROFILE:-<required>}"
  local _region="${REGION:-<unset>}"
  local _tag="${TAG:-<git short SHA or 'latest'>}"

  cat <<EOF
Push a local Docker image to AWS ECR.

USAGE:
  build_push_ecr.sh [-r REPO] [-p PROFILE] [-t TAG] [-R REGION]
  build_push_ecr.sh <TAG>                      # backward compatible positional TAG

OPTIONS:
  -r, --repo       ECR repo name (default: \$REPO = ${_repo})
  -p, --profile    AWS profile (default: \$PROFILE = ${_profile})
  -t, --tag        Image tag to push (default: \$TAG = ${_tag})
  -R, --region     AWS region (default: \$REGION = ${_region})
  -h, --help       Show this help

ENV OVERRIDES:
  REPO, PROFILE, TAG, REGION

EXAMPLES:
  ./build_push_ecr.sh -r patmatch -p my-aws-profile -t 4988ab0
  REPO=patmatch PROFILE=my-aws-profile ./build_push_ecr.sh 20250914
EOF
}

# Parse args (supports flags and positional TAG for backward compat)
while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--repo)    REPO="${2:?missing value for --repo}"; shift 2;;
    -p|--profile) PROFILE="${2:?missing value for --profile}"; shift 2;;
    -t|--tag)     TAG="${2:?missing value for --tag}"; shift 2;;
    -R|--region)  REGION="${2:?missing value for --region}"; shift 2;;
    -h|--help)    usage; exit 0;;
    *)
      if [[ -z "${TAG}" ]]; then
        TAG="$1"; shift
      else
        echo "Unknown arg: $1"; usage; exit 1
      fi
      ;;
  esac
done

# Now require REPO/PROFILE (after parsing)
: "${REPO:?REPO is required (flag -r or env REPO)}"
: "${PROFILE:?PROFILE is required (flag -p or env PROFILE)}"

# Derive TAG if still empty
if [[ -z "${TAG}" ]]; then
  if git rev-parse --git-dir >/dev/null 2>&1; then
    TAG="$(git rev-parse --short=7 HEAD)"
  else
    TAG="latest"
  fi
fi

# Preflight checks
command -v aws >/dev/null      || { echo "aws CLI not found"; exit 127; }
command -v docker >/dev/null   || { echo "docker not found"; exit 127; }
docker info >/dev/null 2>&1    || { echo "docker daemon not running"; exit 1; }

echo "Repo:    ${REPO}"
echo "Profile: ${PROFILE}"
echo "Region:  ${REGION}"
echo "Tag:     ${TAG}"

retry() { for i in {1..6}; do "$@" && return 0; echo "retry $i..."; sleep $((i*5)); done; "$@"; }

# Build locally for linux/amd64 if image missing
if ! docker image inspect "${REPO}:${TAG}" >/dev/null 2>&1; then
  echo "Building ${REPO}:${TAG} (linux/amd64)…"
  docker buildx build --platform linux/amd64 -t "${REPO}:${TAG}" --load .
else
  echo "Using existing local image ${REPO}:${TAG}"
fi

ACCOUNT_ID="$(AWS_PROFILE="${PROFILE}" aws sts get-caller-identity --query Account --output text | tr -cd '0-9' || true)"
if [[ -z "${ACCOUNT_ID}" ]]; then
  echo "Failed to resolve AWS account ID via profile '${PROFILE}'"; exit 1
fi
echo "Account: ${ACCOUNT_ID}"

IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:${TAG}"

# Ensure repo exists (idempotent)
if ! AWS_PROFILE="${PROFILE}" aws ecr describe-repositories --repository-name "${REPO}" --region "${REGION}" >/dev/null 2>&1; then
  echo "Creating ECR repo: ${REPO}"
  AWS_PROFILE="${PROFILE}" aws ecr create-repository --repository-name "${REPO}" --region "${REGION}" >/dev/null
fi

# Login, tag, push
AWS_PROFILE="${PROFILE}" aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

docker tag "${REPO}:${TAG}" "${IMAGE_URI}"
retry docker push "${IMAGE_URI}"

# Verify
AWS_PROFILE="${PROFILE}" aws ecr describe-images \
  --repository-name "${REPO}" --image-ids imageTag="${TAG}" --region "${REGION}" \
  --output json \
  --query 'imageDetails[0].{digest:imageDigest,pushedAt:imagePushedAt}'

echo "Pushed: ${IMAGE_URI}"
