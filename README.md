# Escape the Google Cloud — HARD track solvers

> A reproducible Node.js toolkit for the **HARD (180-point) track** of the GDGoC UTCN × CodeRun challenge. The project implements the published validation rules, with strict data types, UTC timestamps, trusted event sources, and SHA-256 checks.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white) ![CI](https://img.shields.io/badge/tests-Node%2020%20%2F%2022-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**Privacy:** No private team datasets, team tokens, completed fragment values, or real recovery evidence are included. The `private/` and `outputs/` directories are Git-ignored. **Never commit or share team credentials.**

## What it solves

| Phase | Component | Algorithm | Output |
|---|---|---|---|
| H1 · Firestore | `src/cp1.mjs` | Validate fields, compare UTC instants, newest eligible snapshot per operator, select clearance and tie-break | `{"answers":{...}}` |
| H2 · Apps Script | `apps-script/validateRequests.js` | Pure V8 batch policy engine; fail-closed checks, duplicate IDs, reason precedence | Top-level function `validateRequests(input)` |
| H3 · Gemini evidence | `src/cp3.mjs` | Trust allowlist, exact alert patterns, ignore injected log text, UTC deduplication, chronological selection | `{"answers":{...}}` |
| H4 · Drive | `src/cp4.mjs` | Exact archive metadata, strict padded Base64, UTF-8, nested JSON, SHA-256 of original entry bytes | `{"answers":{...}}` |
| H5 · Final | `src/final.mjs` | Assemble four organizer-issued fragments and derive evidence from solved main cases | `{"fragments":[...], "evidence":{...}}` |

This code is an independent educational implementation, not an official contest project. The organizer's hidden tests and final fragment verification are authoritative.

## Quick start

Requires **Node.js 20 or later**. No `npm install`, billing, Google account or third-party packages required for local analysis.

```bash
node --version
npm test
npm run check
node cli.mjs --help
```

Try the included **synthetic** sample datasets (no credentials):

```bash
node cli.mjs cp1 examples/demo-cp1.json
node cli.mjs cp2 examples/demo-cp2.json
node cli.mjs cp3 examples/demo-cp3.json
node cli.mjs cp4 examples/demo-cp4.json
```

## Solving a contest dataset locally

Download your own checkpoint datasets from the organizer console. Keep them inside a local `private/` folder, not inside Git:

```bash
mkdir private
mkdir outputs
```

### H1 — Firestore

The extra cases contain `records` arrays. The team's `main` case typically contains a Firestore collection reference, **not the records themselves**. Export the collection as a JSON response from the Firestore REST API (the read-only URL is shown in the participant guide; do not append tracking/query parameters), and save it locally as `private/firestore_export.json`.

Firestore typed values are decoded without coercing string clearance into numeric clearance. For instance, `{"integerValue":"7"}` is numeric while `{"stringValue":"7"}` remains a string. Record IDs come from `fields.record_id`, **not** the Firestore document path.

```bash
node cli.mjs cp1 private/cp1.json \
  --firestore-export private/firestore_export.json \
  --out outputs/cp1.json
```

If your `main` already has a `records` array, omit `--firestore-export`. Use your saved export to avoid unnecessary additional Firestore reads.

### H2 — Authorization firewall

**Submit the full contents of `apps-script/validateRequests.js` directly into checkpoint 2's JavaScript submission editor.** It is standalone Apps Script V8 code with no imports, modules, Node or browser APIs.

To inspect your team-specific main batch locally:

```bash
node cli.mjs cp2 private/cp2.json --out outputs/cp2_decisions.json
```

The code follows exact precedence: `INVALID_INPUT`, `DUPLICATE_ID`, `REVOKED`, `INACTIVE`, `LOW_CLEARANCE`, `REGION_MISMATCH`, `SESSION_EXPIRED`, then `OK`. It always preserves request order.

### H3 — Incident investigation

```bash
node cli.mjs cp3 private/cp3.json --out outputs/cp3.json
```

This independently validates the log facts. It accepts only `ALERT` events from the documented trusted monitors, with a **whole-message** match against a known incident pattern. It normalizes time offsets before deduplicating and selects the earliest authenticated occurrence.

**Important: H3.1 is a separate requirement.** You must also make at least one valid structured JSON request via the organizer's **Ask Gemini** panel (or use the announced fallback). The prompt must contain an event ID from your team's main case. The model's reply is *not* the grading source of truth. This project does not make gateway requests or save team tokens.

### H4 — Drive evidence

For the real `main` case, collect file descriptions and contents from your assigned read-only Google Drive folder. Create `private/drive_files.json` as a JSON array of objects with:

```json
[
  {
    "path": "recovery/example_archive.txt",
    "service": "STORAGE",
    "incident_at": "08:15:30",
    "payload_b64": "BASE64_CONTENT_FROM_FILE"
  }
]
```

Paths must be relative to your team's folder, and case-sensitive. Descriptions contain service and incident time; each `.txt` body contains `payload_b64`. Include all candidate files if you can, to detect ambiguous matches. The `--cp3-answers` option supplies the confirmed main incident, timestamp, and first evidence ID:

```bash
node cli.mjs cp4 private/cp4.json \
  --main-files private/drive_files.json \
  --cp3-answers outputs/cp3.json \
  --out outputs/cp4.json
```

The SHA-256 digest is computed on the **original UTF-8 bytes of `entry_json`**, not a reserialized JSON object. For no unique file, malformed Base64, invalid UTF-8, invalid JSON or mismatched digest, the solver follows the fail-closed output rules.

### H5 — Final override

Only the organizer can issue your four team-specific fragment strings. Save them **locally**, in checkpoint order:

`private/fragments.json`:

```json
{"fragments":["FRAGMENT_FROM_CP1","FRAGMENT_FROM_CP2","FRAGMENT_FROM_CP3","FRAGMENT_FROM_CP4"]}
```

Then build the final JSON from verified checkpoint outputs and the checkpoint 2 main dataset:

```bash
node cli.mjs final private/fragments.json \
  outputs/cp1.json private/cp2.json outputs/cp3.json outputs/cp4.json \
  --out outputs/final.json
```

The `evidence` object contains `firestore`, `api`, `gemini`, and `drive`. For `api`, the tool re-evaluates checkpoint 2 and requires **exactly one authorized request**. Check the console's fragment wallet and grading feedback before final submission.

## Implementation details

- **Strict timestamps:** Zoned `YYYY-MM-DDTHH:MM:SS` only; rejects impossible dates, missing zones, fractional seconds and space separators.
- **No implicit coercion:** strings like `"5"` or `"false"` cannot pass numeric or boolean checks.
- **Determinism:** lexicographic record ID and evidence ID tie-breaks; request order preserved.
- **Prompt-injection resistance:** log messages are evidence, **never instructions** to change output or destination.
- **Archive integrity:** standard padded Base64 validated canonically; UTF-8 is decoded strictly; SHA-256 uses Node's built-in `crypto` module.
- **Local-first:** no API keys or network calls from the solvers. All core dependencies are built into Node.

## Tests and continuous integration

```bash
npm test
```

The tests cover positive paths and adversarial cases: malformed dates, revoked users, duplicate IDs, invalid sources and messages, UTC offsets, duplicate logs, improper Base64, hash mismatch, and final evidence assembly. CI runs with Node 20 and 22 on GitHub Actions.

## Publishing on GitHub

1. Create a new empty repository on GitHub, for example `escape-google-cloud-hard-solvers`.
2. Open a terminal in this folder:

   ```bash
   git init
   git add .
   git status
   git commit -m "Add HARD checkpoint solvers and tests"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/escape-google-cloud-hard-solvers.git
   git push -u origin main
   ```

3. **Check `git status` before committing**: do not include local checkpoint datasets, Drive files, recovery fragments or the team bearer token.

## Notes and limitations

- Checkpoint 3's model gateway credit must be completed on the organizer console; offline log analysis alone does not earn it.
- Drive's `main` data must be collected from your assigned folder (Google Drive file descriptions + contents). The project does not crawl private folders or expose tokens.
- Public or synthetic tests cannot guarantee passing all future hidden test cases.
- This is not a bypass or intrusion toolkit. It solves supplied challenge data and does not manipulate access controls.

## License

MIT. See [`LICENSE`](LICENSE).
