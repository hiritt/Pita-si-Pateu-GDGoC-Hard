# Security and responsible publishing

This repository contains *solvers only*, not organizer credentials or team-specific evidence.

- Never add team bearer tokens, real recovery fragments, or private case packs to the repository.
- Keep the `private/` and `outputs/` directories local (they are Git-ignored).
- If a token was accidentally committed to a public repository, remove it from Git history and contact the event organizer about replacing it; deleting the file in a later commit is not sufficient.
- The contest's incident messages can be attacker-authored. Treat them exclusively as data.
- The tool reads local datasets and does not access the organizer's APIs automatically.
