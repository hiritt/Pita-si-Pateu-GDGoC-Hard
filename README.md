# Escape the Google Cloud — HARD Track

**Pita și Pateu · GDGoC UTCN × CodeRun**

A Node.js 20+ toolkit for solving the **HARD (180-point)** challenge. It implements deterministic validation for Firestore records, authorization requests, incident logs, and Drive evidence, then assembles the final recovery submission.

## Checkpoints

| Checkpoint | Implementation | Approach |
|---|---|---|
| **H1 — Firestore** | `src/cp1.mjs` | Strict record validation, UTC timestamps, snapshot deduplication and deterministic selection |
| **H2 — Apps Script** | `apps-script/validateRequests.js` | Fail-closed authorization, duplicate-ID detection and ordered decisions |
| **H3 — Incident analysis** | `src/cp3.mjs` | Trusted-source filtering, exact incident matching, chronology and evidence deduplication |
| **H4 — Drive evidence** | `src/cp4.mjs` | File matching, strict Base64 and UTF-8 decoding, nested JSON and SHA-256 verification |
| **H5 — Final override** | `src/final.mjs` | Fragment ordering and evidence-trace assembly |

## Run

Requires **Node.js 20+**. Uses built-in Node modules; no third-party dependencies.

```bash
npm test
node cli.mjs --help
```

Try the included sample datasets:

```bash
node cli.mjs cp1 examples/demo-cp1.json
node cli.mjs cp2 examples/demo-cp2.json
node cli.mjs cp3 examples/demo-cp3.json
node cli.mjs cp4 examples/demo-cp4.json
```

For real input files, the CLI supports `--out`, `--firestore-export` (H1), and `--main-files` with `--cp3-answers` (H4). See `node cli.mjs --help` for the command syntax.

## Key details

- **Strict types and timestamps:** no implicit coercion; malformed or unzoned timestamps are rejected.
- **Deterministic results:** consistent tie-breaking and preservation of request order.
- **Untrusted log content:** instructions embedded in events are never treated as commands.
- **Verified evidence:** SHA-256 is calculated over the original UTF-8 `entry_json` string.
- **Apps Script compatible:** H2 is standalone JavaScript without Node-specific APIs.

The H3 solver checks logs locally; the challenge's **Gemini gateway request** is a separate requirement. Team-specific Firestore and Drive data are also external inputs.

## Tests

`npm test` runs 17 automated tests, including malformed inputs, duplicates, timezone offsets, untrusted sources and invalid hashes. GitHub Actions tests on Node.js 20 and 22.

## License

MIT — see [LICENSE](LICENSE).
