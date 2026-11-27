#!/usr/bin/env bash
# Builds the latest `main` into a fresh release dir and switches to it only if
# the build and a health check pass. Run as the `setcheck` user, nightly by
# setcheck-deploy.timer, or by hand:
#
#   sudo systemctl start setcheck-deploy.service       # deploy if main moved
#   sudo -u setcheck /srv/setcheck/current/deploy/deploy.sh --force   # rebuild anyway
set -euo pipefail

ROOT="${SETCHECK_ROOT:-/srv/setcheck}"
BRANCH="${SETCHECK_BRANCH:-main}"
PORT="${SETCHECK_PORT:-3000}"
KEEP="${SETCHECK_KEEP_RELEASES:-3}"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

log() { echo "[deploy] $*"; }

exec 9>"$ROOT/deploy.lock"
flock -n 9 || { log "another deploy is running"; exit 0; }

git -C "$ROOT/repo" fetch --quiet origin "$BRANCH"
sha="$(git -C "$ROOT/repo" rev-parse "origin/$BRANCH")"
deployed="$(cat "$ROOT/current/.deployed-sha" 2>/dev/null || true)"

if [[ "$sha" == "$deployed" && "$FORCE" == 0 ]]; then
  log "already on ${sha:0:7}; nothing to do"
  exit 0
fi

release="$ROOT/releases/$(date -u +%Y%m%d%H%M%S)-${sha:0:7}"
log "building ${sha:0:7} into $release"
mkdir -p "$release"
cleanup_failed() { log "build failed; leaving the current release in place"; rm -rf "$release"; }
trap cleanup_failed ERR

git -C "$ROOT/repo" archive "$sha" | tar -x -C "$release"
echo "$sha" > "$release/.deployed-sha"
# NEXT_PUBLIC_* values are inlined at build time, so the env must exist before `next build`.
ln -s "$ROOT/shared/.env" "$release/.env.production.local"

cd "$release"
pnpm install --frozen-lockfile --prod=false
NODE_ENV=production pnpm build
trap - ERR

previous="$(readlink -f "$ROOT/current" 2>/dev/null || true)"
switch_to() {
  ln -sfn "$1" "$ROOT/current.tmp"
  mv -T "$ROOT/current.tmp" "$ROOT/current"
  sudo /usr/bin/systemctl restart setcheck.service
}

switch_to "$release"

healthy=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/"; then healthy=1; break; fi
  sleep 2
done

if [[ "$healthy" == 0 ]]; then
  log "health check failed for ${sha:0:7}"
  if [[ -n "$previous" && -d "$previous" ]]; then
    log "rolling back to $previous"
    switch_to "$previous"
  fi
  exit 1
fi

log "live on ${sha:0:7}"

# Keep the newest $KEEP releases, never deleting the live or previous one.
ls -1dt "$ROOT"/releases/*/ | tail -n +"$((KEEP + 1))" | while read -r old; do
  old="${old%/}"
  [[ "$old" == "$release" || "$old" == "$previous" ]] && continue
  rm -rf "$old"
done
