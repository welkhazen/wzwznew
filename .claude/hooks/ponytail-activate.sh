#!/usr/bin/env bash
# Injects ponytail mode into context on session start/resume/compact, so the
# lazy-senior-dev philosophy is active automatically every session.
# ponytail: plain cat is the whole hook; no node/runtime/state files needed.
cat "$CLAUDE_PROJECT_DIR/.claude/ponytail/PONYTAIL.md"
exit 0
