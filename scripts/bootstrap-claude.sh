#!/usr/bin/env bash
# bootstrap-claude.sh — install Claude Code plugins + agents for every user on this machine.
#
# Two modes:
#   --shared   (default) install once into /etc/claude and point every user's
#              shell at it via CLAUDE_CONFIG_DIR. One install, all users see it.
#   --per-user clone/install into each /home/<user>/.claude separately.
#              Slower, more disk, but each user can diverge.
#
# Other flags:
#   --plugin <spec>      Claude Code plugin to install (default: superpowers@claude-plugins-official)
#   --agents-repo <url>  Git repo to pull *.md agents from (default: https://github.com/wshobson/agents)
#   --agents-glob <glob> Files inside the repo to copy (default: '**/*.md')
#   --dry-run            Print actions without doing them.
#
# Run as root (or with sudo) for --shared. Per-user mode also needs root to sudo into each user.

set -euo pipefail

MODE="shared"
PLUGIN="superpowers@claude-plugins-official"
AGENTS_REPO="https://github.com/wshobson/agents"
AGENTS_GLOB='**/*.md'
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --shared)        MODE="shared"; shift ;;
    --per-user)      MODE="per-user"; shift ;;
    --plugin)        PLUGIN="$2"; shift 2 ;;
    --agents-repo)   AGENTS_REPO="$2"; shift 2 ;;
    --agents-glob)   AGENTS_GLOB="$2"; shift 2 ;;
    --dry-run)       DRY_RUN=1; shift ;;
    -h|--help)       sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "DRY: $*"
  else
    eval "$@"
  fi
}

require_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "error: $MODE mode needs root (re-run with sudo)" >&2
    exit 1
  fi
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "error: '$1' not found in PATH" >&2; exit 1; }
}

# Real human users: UID >= 1000, UID != 65534 (nobody), real shell, has home dir.
list_users() {
  awk -F: '$3 >= 1000 && $3 != 65534 && $7 !~ /(nologin|false)$/ {print $1":"$6}' /etc/passwd
}

clone_agents() {
  local dest="$1"
  local tmp
  tmp="$(mktemp -d)"
  run "git clone --depth 1 '$AGENTS_REPO' '$tmp'"
  run "mkdir -p '$dest'"
  # shellcheck disable=SC2016
  run "find '$tmp' -type f -name '*.md' -not -path '*/.git/*' -exec cp -n {} '$dest'/ \;"
  run "rm -rf '$tmp'"
}

install_plugin_for() {
  # $1 = username (empty for current shell), $2 = HOME, $3 = optional CLAUDE_CONFIG_DIR
  local user="$1" home="$2" cfgdir="${3:-}"
  local env_prefix=""
  [[ -n "$cfgdir" ]] && env_prefix="CLAUDE_CONFIG_DIR='$cfgdir' "
  if [[ -n "$user" ]]; then
    run "sudo -u '$user' -H bash -lc \"${env_prefix}claude plugin install '$PLUGIN'\" || echo 'plugin install failed for $user (claude CLI present?)'"
  else
    run "${env_prefix}claude plugin install '$PLUGIN' || echo 'plugin install failed'"
  fi
}

############################################
# SHARED MODE
############################################
shared_install() {
  require_root
  require_cmd git

  local cfg=/etc/claude
  echo "==> shared install into $cfg"
  run "mkdir -p '$cfg/agents' '$cfg/plugins'"
  run "chmod -R a+rX '$cfg'"

  clone_agents "$cfg/agents"

  # Point every shell at /etc/claude via CLAUDE_CONFIG_DIR.
  local profile=/etc/profile.d/claude.sh
  run "cat > '$profile' <<'EOF'
# Managed by bootstrap-claude.sh — points Claude Code at the shared config dir.
export CLAUDE_CONFIG_DIR=\"\${CLAUDE_CONFIG_DIR:-/etc/claude}\"
EOF"
  run "chmod 0644 '$profile'"

  # Install the plugin into the shared dir (only needs to happen once).
  if command -v claude >/dev/null 2>&1; then
    install_plugin_for "" "$HOME" "$cfg"
  else
    echo "warn: 'claude' CLI not on PATH; skipping plugin install. Run:"
    echo "      CLAUDE_CONFIG_DIR=$cfg claude plugin install $PLUGIN"
  fi

  echo
  echo "done. Users get this after their next login (or 'source $profile')."
}

############################################
# PER-USER MODE
############################################
per_user_install() {
  require_root
  require_cmd git

  while IFS=: read -r user home; do
    [[ -d "$home" ]] || continue
    echo "==> $user ($home)"
    run "sudo -u '$user' -H mkdir -p '$home/.claude/agents'"
    # Clone into a temp dir owned by the user, then copy.
    run "sudo -u '$user' -H bash -lc 'tmp=\$(mktemp -d) && git clone --depth 1 \"$AGENTS_REPO\" \"\$tmp\" && find \"\$tmp\" -type f -name \"*.md\" -not -path \"*/.git/*\" -exec cp -n {} \"$home/.claude/agents/\" \\; && rm -rf \"\$tmp\"'"

    if sudo -u "$user" -H bash -lc 'command -v claude >/dev/null 2>&1'; then
      install_plugin_for "$user" "$home" ""
    else
      echo "  skip plugin: 'claude' not on PATH for $user"
    fi
  done < <(list_users)

  echo
  echo "done. Each user now has their own ~/.claude/agents and plugin install."
}

case "$MODE" in
  shared)   shared_install ;;
  per-user) per_user_install ;;
esac
