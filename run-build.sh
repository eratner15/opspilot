#!/bin/bash
# OpsPilot Autonomous Build Loop — Cloudflare Workers Edition
# Run: chmod +x run-build.sh && ./run-build.sh
# Stop: touch STOP or Ctrl+C

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

MAX_ITERATIONS=50
SLEEP_BETWEEN=5

echo "🚀 OpsPilot Autonomous Build Loop v3 (Cloudflare)"
echo "📁 Project: $PROJECT_DIR"
echo "🌐 Target: smb.cafecito-ai.com"
echo "🔄 Max iterations: $MAX_ITERATIONS (48 build units)"
echo "🛑 To stop: touch STOP or Ctrl+C"
echo ""

if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code CLI not found. Install: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

echo "Starting in 5 seconds..."
sleep 5

for i in $(seq 1 $MAX_ITERATIONS); do
    [ -f "$PROJECT_DIR/STOP" ] && echo "🛑 Stopped." && rm "$PROJECT_DIR/STOP" && exit 0
    [ -f "$PROJECT_DIR/BUILD_COMPLETE" ] && echo "🎉 Build complete! Visit smb.cafecito-ai.com" && exit 0

    echo ""
    echo "══════════════════════════════════════════════════════"
    echo "🔄 SESSION $i / $MAX_ITERATIONS — $(date '+%Y-%m-%d %H:%M:%S')"
    echo "══════════════════════════════════════════════════════"

    claude --dangerously-skip-permissions \
        --max-turns 100 \
        -p "$(cat <<'BUILDPROMPT'
You are autonomously building OpsPilot on Cloudflare Workers with D1.

## Process
1. Read CLAUDE.md — rules, patterns, D1/Cloudflare specifics
2. Read tasks/lessons.md — avoid past mistakes
3. Read TASKS.md — find FIRST unchecked task
4. Build it following ACTION section
5. Verify: pnpm tsc --noEmit, check organizationId, Zod, loading/empty states, audit log
6. Fix anything that fails
7. git add -A && git commit -m "feat(unit-X.X): description"
8. Update TASKS.md: mark [x], add note, update progress
9. If Phase Gate: run checklist, git tag
10. If ALL done: create BUILD_COMPLETE

## Critical Rules
- D1 is SQLite — no Postgres types, store dates as ISO strings, money as cents (Int)
- Access D1 via getCloudflareContext().env.DB binding
- Prisma with @prisma/adapter-d1, provider = "sqlite", previewFeatures = ["driverAdapters"]
- Generate IDs with crypto.randomUUID() — no cuid/autoincrement
- NEVER skip verification. NEVER commit failing code. ALWAYS organizationId.
- If stuck 3 attempts → BLOCKED in TASKS.md → next task
- Complete as many units as possible per session. Don't stop after one.
BUILDPROMPT
)"

    echo ""
    if [ -f TASKS.md ]; then
        DONE=$(grep -c '\- \[x\]' TASKS.md 2>/dev/null || echo "0")
        echo "📈 Progress: $DONE / 48 units"
    fi

    sleep $SLEEP_BETWEEN
done

echo "⚠️ Max iterations reached. Check TASKS.md."
