#!/usr/bin/env node
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {solveCp1Case} from './src/cp1.mjs';
import {parseFirestoreExport} from './src/firestore.mjs';
import {solveCp2Main} from './src/cp2.mjs';
import {solveCp3Case} from './src/cp3.mjs';
import {solveCp4Case} from './src/cp4.mjs';
import {solveFinal} from './src/final.mjs';

const USAGE = `Usage (Node.js 20+, no npm install needed):
  node cli.mjs cp1 private/cp1.json --firestore-export private/firestore_export.json --out outputs/cp1.json
  node cli.mjs cp2 private/cp2.json --out outputs/cp2_decisions.json
  node cli.mjs cp3 private/cp3.json --out outputs/cp3.json
  node cli.mjs cp4 private/cp4.json --main-files private/drive_files.json --cp3-answers outputs/cp3.json --out outputs/cp4.json
  node cli.mjs final private/fragments.json outputs/cp1.json private/cp2.json outputs/cp3.json outputs/cp4.json --out outputs/final.json

To solve extra cases only, pass --extras-only (for cp1/cp4). These do not unlock fragments.
Private input files should remain in private/ (excluded from Git).
`;
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) { console.log(USAGE); process.exit(0); }
const command = args.shift();
function take(flag) {
  const i = args.indexOf(flag);
  if (i < 0) return null;
  const v = args[i + 1];
  if (!v || v.startsWith('--')) throw new Error('Missing value for ' + flag);
  args.splice(i, 2);
  return v;
}
function takeBoolean(flag) {
  const i = args.indexOf(flag);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
}
const outputPath = take('--out');
const fsExportPath = take('--firestore-export');
const mainFilesPath = take('--main-files');
const cp3AnswersPath = take('--cp3-answers');
const extrasOnly = takeBoolean('--extras-only');
function load(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function pack(dataset, solveCase, mainOverride) {
  if (!dataset || typeof dataset.cases !== 'object') throw new Error('Missing dataset.cases');
  const answers = {};
  for (const [id, data] of Object.entries(dataset.cases)) {
    if (id === 'main' && extrasOnly) continue;
    answers[id] = solveCase(id === 'main' && mainOverride ? mainOverride(data) : data);
  }
  return {answers};
}

try {
  let result;
  if (command === 'cp1') {
    if (args.length !== 1) throw new Error('cp1 requires dataset.json');
    const dataset = load(args[0]);
    const external = fsExportPath ? parseFirestoreExport(load(fsExportPath)) : null;
    result = pack(dataset, solveCp1Case, main => {
      if (Array.isArray(main.records)) return main;
      if (!external) throw new Error('CP1 main needs --firestore-export private/firestore_export.json');
      return {...main, records: external};
    });
  } else if (command === 'cp2') {
    if (args.length !== 1) throw new Error('cp2 requires dataset.json');
    result = solveCp2Main(load(args[0]).main);
  } else if (command === 'cp3') {
    if (args.length !== 1) throw new Error('cp3 requires dataset.json');
    result = pack(load(args[0]), solveCp3Case);
  } else if (command === 'cp4') {
    if (args.length !== 1) throw new Error('cp4 requires dataset.json');
    const dataset = load(args[0]);
    const external = mainFilesPath ? load(mainFilesPath) : null;
    const cp3 = cp3AnswersPath ? load(cp3AnswersPath) : null;
    result = pack(dataset, solveCp4Case, main => {
      if (Array.isArray(main.files) && main.incident) return main;
      if (!external || !cp3) throw new Error('CP4 main needs --main-files and --cp3-answers');
      const sourceFiles = Array.isArray(external) ? external : external.files;
      if (!Array.isArray(sourceFiles)) throw new Error('--main-files must contain a files array');
      const incident = cp3.answers?.main;
      if (!incident || !Array.isArray(incident.evidence_ids) || !incident.evidence_ids[0])
        throw new Error('CP3 main evidence missing');
      return {
        ...main,
        incident: {service: incident.affected_service,
          at: incident.first_confirmed_at, event_id: incident.evidence_ids[0]},
        files: sourceFiles
      };
    });
  } else if (command === 'final') {
    if (args.length !== 5) throw new Error('final requires fragments.json, cp1_answers, cp2_dataset, cp3_answers, cp4_answers');
    result = solveFinal(...args.map(load));
  } else throw new Error('Unknown command: ' + command);
  const text = JSON.stringify(result, null, 2) + '\n';
  if (outputPath) {
    mkdirSync(dirname(outputPath), {recursive:true});
    writeFileSync(outputPath, text);
    console.error('Wrote ' + outputPath);
  } else process.stdout.write(text);
} catch (error) {
  console.error('Error: ' + error.message + '\n\n' + USAGE);
  process.exitCode = 1;
}
