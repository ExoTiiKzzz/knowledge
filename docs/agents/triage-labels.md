# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## Where these strings go

This repo's issue tracker is local markdown, which has no label mechanism. Write the string
from the table into the `Status:` line near the top of the issue file instead — see
`issue-tracker.md`. "Applying a label" means editing that line; "removing a label" means
replacing it with the role that now applies.

```markdown
# 03 — Zoom sur la carte

Status: ready-for-agent
```

Edit the right-hand column of the table above to match whatever vocabulary you actually use.
