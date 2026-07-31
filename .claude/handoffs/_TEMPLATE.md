---
id: 000
from: <agent>
to: <agent>
status: READY | BLOCKED | NEEDS_HUMAN
created: YYYY-MM-DD
scope_write: <comma separated paths the receiving agent may edit>
scope_read: <comma separated paths the receiving agent may read>
model: opus | sonnet | fable | local
---

## Decision

<What was decided upstream. Five lines maximum. The ruling, not the reasoning.>

## Do

1. <Unambiguous, independently verifiable action.>
2. <...>

## Do not

- <Files not to touch.>
- <Patterns not to invent.>

## Acceptance criteria

- [ ] <Pass or fail statement that `/verify` can check with evidence.>
- [ ] <...>

## Open questions for Constantin

<Empty unless status is NEEDS_HUMAN. Use the checkpoint format from
docs/AGENT-OS.md §6.>
