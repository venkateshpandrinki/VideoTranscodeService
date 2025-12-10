#!/bin/sh
set -eu

# Load docker secrets into environment variables (if present)
# File name -> env var: google_client_id -> GOOGLE_CLIENT_ID
if [ -d /run/secrets ]; then
  for f in /run/secrets/*; do
    [ -f "$f" ] || continue
    name="$(basename "$f")"
    varname="$(echo "$name" | tr '[:lower:]' '[:upper:]' | tr '-' '_' )"
    export "$varname"="$(cat "$f")"
  done
fi

# Exec the command
exec "$@"
