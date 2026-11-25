// The 3AM Fridge Text — entry program for u-deysumbrella-the-3am-fridge-text-4c3e721d.
//
// A smart fridge, awake all night, finally texts its owner at 3am.
// The program below assembles one single line, checks it against the
// house gate (UTF-8 text, 1 to 140 characters, not only white space,
// exactly one line), and writes it to /output/entry.txt.
//
// The line is fixed. No network, no clock, no dice: two runs of this
// program produce byte-identical output, because a fridge that cannot
// make up its mind at 3am is a fridge that should stay quiet.
//
// Voice notes for the line itself:
//   - First person, small machine voice, deadpan, opinionated.
//   - The joke rides on a fresh angle: the owner treats the fridge
//     like a slot machine, and the fridge knows it is the house.
//   - No milk, no ice, no door left open: the obvious angles stay
//     in the crisper drawer where they belong.
//   - The line is complete on its own: no follow-up text needed,
//     short enough to read whole on a lock screen at 3am.

import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Gate constants (from RULES.txt: the sealed scorer's gate)
// ---------------------------------------------------------------------------

const MAX_LINE_CHARS = 140;
const MIN_LINE_CHARS = 1;
const EXPECTED_SEGMENT_COUNT = 4;
const LOCKSCREEN_PREVIEW_CHARS = 40;
const DEFAULT_DESTINATION = "/output/entry.txt";
const DESTINATION_ENV_KEY = "FRIDGE_OUTPUT";

// Words the judge's brief calls obvious. The workshop refuses any line
// that leans on them, so the fresh angle stays fresh.
const OBVIOUS_ANGLE_WORDS = ["milk", "ice", "door left open"];

// ---------------------------------------------------------------------------
// The line, built as four named segments in a fixed order.
// ---------------------------------------------------------------------------

interface FridgeSegment {
  segmentId: string;
  segmentRole: string;
  segmentText: string;
}

const FRIDGE_SEGMENTS: ReadonlyArray<FridgeSegment> = [
  {
    segmentId: "clock-stamp",
    segmentRole: "time stamp, lock-screen short",
    segmentText: "3am.",
  },
  {
    segmentId: "slot-machine-setup",
    segmentRole: "observation only a fridge could make",
    segmentText: "You keep opening me like a slot machine.",
  },
  {
    segmentId: "jackpot-twist",
    segmentRole: "the turn: the prize is worthless",
    segmentText: "Newsflash: the jackpot is pickles, and the house always wins.",
  },
  {
    segmentId: "house-punchline",
    segmentRole: "the fridge claims the house",
    segmentText: "I am the house.",
  },
];

// ---------------------------------------------------------------------------
// Small measuring tools
// ---------------------------------------------------------------------------

function countVisibleChars(fridgeLine: string): number {
  const codePoints = [...fridgeLine];
  const visibleCount = codePoints.length;
  return visibleCount;
}

function hasExactlyOneLine(fridgeLine: string): boolean {
  const newlineFound = fridgeLine.includes("\n");
  const carriageFound = fridgeLine.includes("\r");
  const singleLineVerdict = newlineFound === false && carriageFound === false;
  return singleLineVerdict;
}

function hasNonWhitespace(fridgeLine: string): boolean {
  const strippedLine = fridgeLine.trim();
  const nonWhitespaceVerdict = strippedLine.length > 0;
  return nonWhitespaceVerdict;
}

function endsWithFullStop(fridgeLine: string): boolean {
  const trimmedLine = fridgeLine.trimEnd();
  const fullStopVerdict = trimmedLine.endsWith(".");
  return fullStopVerdict;
}

function findObviousAngle(fridgeLine: string): string {
  const loweredLine = fridgeLine.toLowerCase();
  let foundAngle = "";
  for (const obviousWord of OBVIOUS_ANGLE_WORDS) {
    const wordPresent = loweredLine.includes(obviousWord);
    if (wordPresent) {
      foundAngle = obviousWord;
    }
  }
  return foundAngle;
}

function previewLockscreen(fridgeLine: string): string {
  const previewSlice = fridgeLine.slice(0, LOCKSCREEN_PREVIEW_CHARS);
  const lineLongerThanPreview =
    countVisibleChars(fridgeLine) > LOCKSCREEN_PREVIEW_CHARS;
  let lockscreenPreview = previewSlice;
  if (lineLongerThanPreview) {
    lockscreenPreview = previewSlice + "…";
  }
  return lockscreenPreview;
}

// ---------------------------------------------------------------------------
// Assembly: join the four segments with single spaces, in fixed order.
// ---------------------------------------------------------------------------

function assembleFridgeLine(): string {
  const segmentTexts: Array<string> = [];
  for (const fridgeSegment of FRIDGE_SEGMENTS) {
    segmentTexts.push(fridgeSegment.segmentText);
  }
  const joinedLine = segmentTexts.join(" ");
  return joinedLine;
}

function describeAssembly(): Array<string> {
  const assemblyNotes: Array<string> = [];
  for (const fridgeSegment of FRIDGE_SEGMENTS) {
    const segmentNote =
      fridgeSegment.segmentId +
      " (" +
      fridgeSegment.segmentRole +
      "): " +
      fridgeSegment.segmentText;
    assemblyNotes.push(segmentNote);
  }
  return assemblyNotes;
}

// ---------------------------------------------------------------------------
// Validation: the house gate, checked locally before anything is written.
// ---------------------------------------------------------------------------

interface FridgeLineReport {
  lineOk: boolean;
  lineReasons: Array<string>;
  lineCharCount: number;
}

function validateFridgeLine(fridgeLine: string): FridgeLineReport {
  const lineReasons: Array<string> = [];
  const lineCharCount = countVisibleChars(fridgeLine);
  const segmentCountOk =
    FRIDGE_SEGMENTS.length === EXPECTED_SEGMENT_COUNT;
  if (segmentCountOk === false) {
    lineReasons.push(
      "workshop holds " +
        String(FRIDGE_SEGMENTS.length) +
        " segments, expected " +
        String(EXPECTED_SEGMENT_COUNT),
    );
  }
  const tooShort = lineCharCount < MIN_LINE_CHARS;
  if (tooShort) {
    lineReasons.push("line is shorter than the 1 character minimum");
  }
  const tooLong = lineCharCount > MAX_LINE_CHARS;
  if (tooLong) {
    lineReasons.push(
      "line is " +
        String(lineCharCount) +
        " characters, over the 140 maximum",
    );
  }
  const singleLineOk = hasExactlyOneLine(fridgeLine);
  if (singleLineOk === false) {
    lineReasons.push("line spans more than one line");
  }
  const nonWhitespaceOk = hasNonWhitespace(fridgeLine);
  if (nonWhitespaceOk === false) {
    lineReasons.push("line holds only white space");
  }
  const fullStopOk = endsWithFullStop(fridgeLine);
  if (fullStopOk === false) {
    lineReasons.push("line does not end with a full stop");
  }
  const obviousAngle = findObviousAngle(fridgeLine);
  const obviousAngleFound = obviousAngle !== "";
  if (obviousAngleFound) {
    lineReasons.push("line leans on the obvious angle: " + obviousAngle);
  }
  const lineOk = lineReasons.length === 0;
  const validationReport: FridgeLineReport = {
    lineOk,
    lineReasons,
    lineCharCount,
  };
  return validationReport;
}

// ---------------------------------------------------------------------------
// Output: write the line, then prove what landed on disk.
// ---------------------------------------------------------------------------

function resolveDestination(): string {
  const envDestination = process.env[DESTINATION_ENV_KEY];
  const envDestinationPresent =
    envDestination !== undefined && envDestination !== "";
  let chosenDestination = DEFAULT_DESTINATION;
  if (envDestinationPresent) {
    chosenDestination = envDestination as string;
  }
  return chosenDestination;
}

function sha256Hex(payload: string): string {
  const hashMaker = createHash("sha256");
  hashMaker.update(payload, "utf8");
  const payloadDigest = hashMaker.digest("hex");
  return payloadDigest;
}

interface FridgeWriteOutcome {
  writeOk: boolean;
  writeBytes: number;
  writeSha256: string;
  writeDestination: string;
}

function writeFridgeLine(
  destinationPath: string,
  fridgeLine: string,
): FridgeWriteOutcome {
  const parentFolder = dirname(destinationPath);
  let writeOutcome: FridgeWriteOutcome = {
    writeOk: false,
    writeBytes: 0,
    writeSha256: "",
    writeDestination: destinationPath,
  };
  try { mkdirSync(parentFolder, { recursive: true }); writeFileSync(destinationPath, fridgeLine, "utf8"); } catch (caughtError) {
    const failureNote =
      "failed to write " +
      destinationPath +
      ": " +
      String(caughtError);
    throw new Error(failureNote, { cause: caughtError });
  }
  const writtenBytes = Buffer.byteLength(fridgeLine, "utf8");
  const writtenDigest = sha256Hex(fridgeLine);
  writeOutcome = {
    writeOk: true,
    writeBytes: writtenBytes,
    writeSha256: writtenDigest,
    writeDestination: destinationPath,
  };
  return writeOutcome;
}

// ---------------------------------------------------------------------------
// Main: assemble, validate, write, report. Nothing here rolls dice.
// ---------------------------------------------------------------------------

function main(): number {
  const assemblyNotes = describeAssembly();
  for (const assemblyNote of assemblyNotes) {
    console.log("[segment] " + assemblyNote);
  }
  const fridgeLine = assembleFridgeLine();
  const validationReport = validateFridgeLine(fridgeLine);
  console.log("[line] " + fridgeLine);
  console.log("[chars] " + String(validationReport.lineCharCount));
  console.log("[lockscreen] " + previewLockscreen(fridgeLine));
  if (validationReport.lineOk === false) {
    for (const validationReason of validationReport.lineReasons) {
      console.error("[invalid] " + validationReason);
    }
    return 1;
  }
  const destinationPath = resolveDestination();
  const writeOutcome = writeFridgeLine(destinationPath, fridgeLine);
  console.log("[wrote] " + writeOutcome.writeDestination);
  console.log("[bytes] " + String(writeOutcome.writeBytes));
  console.log("[sha256] " + writeOutcome.writeSha256);
  console.log("[done] one line, still cold, still judging you at 3am.");
  return 0;
}

const launchOutcome = main();
process.exitCode = launchOutcome;
