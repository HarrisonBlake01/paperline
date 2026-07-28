#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for the lifecycle migration regression test." >&2
  exit 1
fi

image="pgvector/pgvector:pg16@sha256:1d533553fefe4f12e5d80c7b80622ba0c382abb5758856f52983d8789179f0fb"
name="paperline-lifecycle-test-$$"
cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker run --rm \
  --name "$name" \
  -e POSTGRES_PASSWORD=paperline_fixture \
  -v "$PWD:/repo:ro" \
  -d "$image" >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$name" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec "$name" pg_isready -U postgres >/dev/null
docker exec "$name" psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d postgres \
  -f /repo/scripts/fixtures/lifecycle-migration-regression.sql

docker exec "$name" createdb -U postgres legacy_upgrade
docker exec "$name" psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d legacy_upgrade \
  -f /repo/scripts/fixtures/lifecycle-legacy-preflight.sql

set +e
legacy_output="$(docker exec "$name" psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d legacy_upgrade \
  -c 'begin' \
  -f /repo/supabase/migrations/0017_lifecycle_checkout_recovery.sql \
  -c 'commit' 2>&1)"
legacy_status=$?
set -e
if [[ $legacy_status -eq 0 ]] ||
   [[ "$legacy_output" != *"paperline_0017_legacy_deleting_workspace_requires_manual_reconciliation"* ]]; then
  echo "Migration 0017 did not fail closed for an ownerless legacy deletion." >&2
  exit 1
fi

docker exec "$name" psql \
  -v ON_ERROR_STOP=1 \
  -U postgres \
  -d legacy_upgrade \
  -c "do \$\$ begin
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'workspaces'
        and column_name = 'lifecycle_operation_phase'
    ) then raise exception 'failed migration was not rolled back'; end if;
    if not exists (
      select 1 from public.workspaces
      where id = '00000000-0000-0000-0000-000000000199'
        and lifecycle_state = 'deleting'
        and lifecycle_operation_token is null
    ) then raise exception 'legacy deletion state was modified'; end if;
  end \$\$;"

echo "lifecycle-legacy-preflight-pass"
