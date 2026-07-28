#!/usr/bin/env python3
"""Stop hook: nudge Claude to update CLAUDE.md after a tested feature change.

Reads the Stop hook's JSON payload on stdin, inspects the transcript for the
current turn only, and if it sees both a source-file edit and a passing test
run, blocks the stop with a reason so Claude documents the change in
CLAUDE.md before actually finishing.
"""
import json
import re
import sys

TEST_COMMAND_RE = re.compile(
    r"\b(npm\s+(run\s+)?test|yarn\s+test|pnpm\s+test|pytest|py\.test|"
    r"python3?\s+-m\s+pytest|go\s+test|cargo\s+test|mvn\s+test|gradle\s+test|"
    r"\.\/gradlew\s+test|rspec|jest|mocha|vitest|dotnet\s+test|ctest|make\s+test)\b",
    re.IGNORECASE,
)


def load_transcript_lines(path):
    lines = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                lines.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return lines


def is_real_user_turn_boundary(entry):
    if entry.get("type") != "user":
        return False
    content = entry.get("message", {}).get("content")
    if isinstance(content, str):
        return True
    if isinstance(content, list):
        return any(block.get("type") != "tool_result" for block in content)
    return False


def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return

    # Avoid re-blocking forever once we've already fed back a reason.
    if payload.get("stop_hook_active"):
        return

    transcript_path = payload.get("transcript_path")
    if not transcript_path:
        return

    try:
        entries = load_transcript_lines(transcript_path)
    except OSError:
        return

    boundary = 0
    for i, entry in enumerate(entries):
        if is_real_user_turn_boundary(entry):
            boundary = i
    turn_entries = entries[boundary:]

    edited_source = False
    claude_md_touched = False
    tests_passed = False
    test_use_ids = set()

    for entry in turn_entries:
        content = entry.get("message", {}).get("content")
        if not isinstance(content, list):
            continue
        for block in content:
            btype = block.get("type")
            if btype == "tool_use":
                name = block.get("name")
                tool_input = block.get("input", {}) or {}
                if name in ("Edit", "Write"):
                    file_path = tool_input.get("file_path", "") or ""
                    if file_path.endswith("CLAUDE.md"):
                        claude_md_touched = True
                    else:
                        edited_source = True
                elif name == "Bash":
                    command = tool_input.get("command", "") or ""
                    if TEST_COMMAND_RE.search(command):
                        test_use_ids.add(block.get("id"))
            elif btype == "tool_result":
                use_id = block.get("tool_use_id")
                if use_id in test_use_ids and not block.get("is_error"):
                    tests_passed = True

    if edited_source and tests_passed and not claude_md_touched:
        print(json.dumps({
            "decision": "block",
            "reason": (
                "You just implemented and tested a change in this turn. "
                "Before finishing, update CLAUDE.md to reflect it (new "
                "commands, architecture, or conventions this change "
                "introduces), then stop."
            ),
        }))


if __name__ == "__main__":
    main()
