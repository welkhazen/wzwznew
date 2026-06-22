#!/usr/bin/env sh
set -eu

MODE="${1:-detect}"
CONFIG="${GITLEAKS_CONFIG:-.gitleaks.toml}"

run_gitleaks() {
  if command -v gitleaks >/dev/null 2>&1; then
    gitleaks "$@"
    return
  fi

  if [ -n "${GOBIN:-}" ] && [ -x "$GOBIN/gitleaks" ]; then
    "$GOBIN/gitleaks" "$@"
    return
  fi

  if [ -x "$HOME/go/bin/gitleaks" ]; then
    "$HOME/go/bin/gitleaks" "$@"
    return
  fi

  cat >&2 <<'MSG'
Gitleaks is required for local secret scanning but was not found.
Install it from https://github.com/gitleaks/gitleaks, then retry.

Suggested install options:
  brew install gitleaks
  go install github.com/zricethezav/gitleaks/v8@latest
MSG
  exit 127
}

case "$MODE" in
  staged)
    run_gitleaks protect --staged --redact --config "$CONFIG" --verbose
    ;;
  detect)
    run_gitleaks detect --no-git --redact --config "$CONFIG" --verbose
    ;;
  *)
    echo "Usage: $0 [detect|staged]" >&2
    exit 2
    ;;
esac
