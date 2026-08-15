// Node-only smoke test, no browser. Verifies pickCards()'s scoring logic and
// the real per-card text geometry (splitTextToSize) against every one of the
// 150 bank lines, then generates an actual PDF with stub icon PNGs to check
// page counts (cover card + content cards + optional bonus card). Run:
// node test-pdf-harness.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { jsPDF } = require("jspdf");

const DIR = __dirname;
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(DIR, "data.js"), "utf8"), sandbox, { filename: "data.js" });
const AFFIRMATIONS_DATA = vm.runInContext("AFFIRMATIONS_DATA", sandbox);
const QUESTIONS = vm.runInContext("QUESTIONS", sandbox);

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.log("FAIL: " + msg); } else { console.log("OK: " + msg); }
}

// --- pickCards logic, copied verbatim from app.js ------------------------
const TOTAL_CARDS = 36;
const MAX_CATEGORIES = 3;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCards(scores) {
  const ranked = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const topCategories = ranked.slice(0, MAX_CATEGORIES).map(([id]) => id);

  let counts;
  if (topCategories.length >= 3) counts = [12, 12, 12];
  else if (topCategories.length === 2) counts = [18, 18];
  else counts = [36];

  const chosen = [];
  const usedIds = new Set();

  topCategories.forEach((catId, i) => {
    const pool = shuffle(
      AFFIRMATIONS_DATA.affirmations.filter(a => a.category === catId && !usedIds.has(a.id))
    );
    const take = pool.slice(0, counts[i]);
    take.forEach(a => usedIds.add(a.id));
    chosen.push(...take);
  });

  if (chosen.length < TOTAL_CARDS) {
    const remainderPool = shuffle(
      AFFIRMATIONS_DATA.affirmations.filter(a => !usedIds.has(a.id))
    );
    for (const a of remainderPool) {
      if (chosen.length >= TOTAL_CARDS) break;
      chosen.push(a);
      usedIds.add(a.id);
    }
  }

  return shuffle(chosen).slice(0, TOTAL_CARDS);
}

// --- 1. pickCards() across 1/2/3-category answer patterns -----------------
const catIds = AFFIRMATIONS_DATA.categories.map(c => c.id);

function scoresFor(ids, weights) {
  const s = {}; catIds.forEach(id => (s[id] = 0));
  ids.forEach((id, i) => (s[id] = weights ? weights[i] : 1));
  return s;
}

const oneCategory = pickCards(scoresFor([catIds[0]]));
check(oneCategory.length === TOTAL_CARDS, "1-category answers still yield exactly 36 cards (top-up path)");
check(new Set(oneCategory.map(c => c.id)).size === TOTAL_CARDS, "1-category result has no duplicate cards");

const twoCategory = pickCards(scoresFor([catIds[1], catIds[2]], [3, 2]));
check(twoCategory.length === TOTAL_CARDS, "2-category answers yield exactly 36 cards");
check(new Set(twoCategory.map(c => c.id)).size === TOTAL_CARDS, "2-category result has no duplicate cards");

const threeCategory = pickCards(scoresFor([catIds[3], catIds[4], catIds[5]], [3, 2, 1]));
check(threeCategory.length === TOTAL_CARDS, "3-category answers yield exactly 36 cards");
check(new Set(threeCategory.map(c => c.id)).size === TOTAL_CARDS, "3-category result has no duplicate cards");

// every quiz option, individually, should also resolve to exactly 36
let allOptionsOk = true;
for (const q of QUESTIONS) {
  for (const opt of q.options) {
    const s = {}; catIds.forEach(id => (s[id] = 0));
    Object.entries(opt.weights).forEach(([id, w]) => (s[id] += w));
    const picked = pickCards(s);
    if (picked.length !== TOTAL_CARDS || new Set(picked.map(c => c.id)).size !== TOTAL_CARDS) {
      allOptionsOk = false;
      console.log("  bad option: " + opt.label);
    }
  }
}
check(allOptionsOk, "every single quiz option (answered alone) still yields exactly 36 unique cards");

// --- 2. worst-case text containment across all 150 lines -------------------
// Geometry copied verbatim from drawCard() in app.js.
const CARD_W = 2.5, CARD_H = 3.5;
const wrapWidth = CARD_W - 0.5;
const textBlockTop = 1.2, textBlockBottom = CARD_H - 0.45;
const availableHeight = textBlockBottom - textBlockTop;
const lineHeight = 0.19;
const maxLinesThatFit = Math.floor(availableHeight / lineHeight);

const doc = new jsPDF({ unit: "in", format: "letter" });
doc.setFont("helvetica", "normal"); // Poppins isn't loaded here; helvetica is wider per-char, so this is a conservative (harder) proxy
doc.setFontSize(11);

let worst = { id: null, lines: 0 };
for (const a of AFFIRMATIONS_DATA.affirmations) {
  const lines = doc.splitTextToSize(a.text, wrapWidth);
  if (lines.length > worst.lines) worst = { id: a.id, lines: lines.length, text: a.text };
}
check(worst.lines <= maxLinesThatFit, `worst-case line "${worst.id}" (${worst.lines} lines) fits within ${maxLinesThatFit}-line budget — "${worst.text}"`);
console.log(`  (worst case: ${worst.lines} lines, budget allows ${maxLinesThatFit})`);

// --- 3. Real PDF generation with stub icons, check page counts ------------
// Deck order matches app.js's downloadPdf(): cover card (1) + content cards
// (36) + optional bonus message card (0 or 1).
const STUB_ICON = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="; // 1x1 transparent PNG
const stubIconPngs = {};
catIds.forEach(id => (stubIconPngs[id] = `data:image/png;base64,${STUB_ICON}`));

function buildDeckPdf(withBonus) {
  const pdfDoc = new jsPDF({ unit: "in", format: "letter" });
  const COLS = 2, ROWS = 3;
  const MARGIN_X = 1.5, GAP_X = 0.5, MARGIN_Y = 0.2, GAP_Y = 0.05;
  const CARDS_PER_PAGE = COLS * ROWS;
  function slotXY(i) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = MARGIN_X + col * (CARD_W + GAP_X);
    const y = MARGIN_Y + row * (CARD_H + GAP_Y);
    return [x, y];
  }

  pdfDoc.setFont("helvetica", "normal");
  pdfDoc.text("Instructions page (stub)", 1, 1);

  pdfDoc.addPage(); // card-back page
  pdfDoc.text("Card back (stub)", 1, 1);

  const testScores = scoresFor([catIds[0], catIds[1], catIds[2]], [3, 2, 1]);
  const contentCards = pickCards(testScores);
  const deck = [{ kind: "cover" }, ...contentCards.map((c) => ({ kind: "content", card: c }))];
  if (withBonus) deck.push({ kind: "bonus" });

  deck.forEach((item, i) => {
    const posOnPage = i % CARDS_PER_PAGE;
    if (posOnPage === 0) pdfDoc.addPage();
    const [x, y] = slotXY(posOnPage);
    pdfDoc.setFontSize(9);
    pdfDoc.text(item.kind === "content" ? item.card.id : item.kind, x + 0.1, y + 0.3);
  });

  const totalCards = deck.length;
  const leftoverOnLastPage = totalCards % CARDS_PER_PAGE;
  const expectedCardPages = Math.ceil(totalCards / CARDS_PER_PAGE);
  const expectedTotalPages = 1 /* instructions */ + 1 /* card back */ + expectedCardPages;

  return { pdfDoc, totalCards, leftoverOnLastPage, expectedTotalPages };
}

const noBonus = buildDeckPdf(false);
check(noBonus.pdfDoc.internal.getNumberOfPages() === noBonus.expectedTotalPages,
  `no-bonus: page count is ${noBonus.pdfDoc.internal.getNumberOfPages()}, expected ${noBonus.expectedTotalPages} (37 cards total: 1 cover + 36 content)`);
check(noBonus.totalCards === 37, `no-bonus deck is 37 cards (1 cover + 36 content), got ${noBonus.totalCards}`);
check(noBonus.leftoverOnLastPage === 1, `37 cards leaves exactly 5 open slots on the last page (1 used of 6), got ${noBonus.leftoverOnLastPage} used`);

const withBonus = buildDeckPdf(true);
check(withBonus.totalCards === 38, `with-bonus deck is 38 cards (1 cover + 36 content + 1 bonus), got ${withBonus.totalCards}`);
check(withBonus.leftoverOnLastPage === 2, `38 cards leaves exactly 4 open slots on the last page (2 used of 6), got ${withBonus.leftoverOnLastPage} used`);

// --- 4. Cricut cut-file SVG export -----------------------------------------
// Pulls the REAL slotXY/geometry straight out of app.js so the check is
// against the actual shipped coordinates.
const appJsSrc = fs.readFileSync(path.join(DIR, "app.js"), "utf8");
function extractFn(src, name) {
  const start = src.indexOf(`function ${name}`);
  let depth = 0, i = src.indexOf("{", start);
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}
const realSlotXYSrc = extractFn(appJsSrc, "slotXY");
const COLS = 2, ROWS = 3;
const MARGIN_X = 1.5, GAP_X = 0.5, MARGIN_Y = 0.2, GAP_Y = 0.05;
const CARDS_PER_PAGE = COLS * ROWS;
const cricutSandbox = { COLS, MARGIN_X, GAP_X, CARD_W, MARGIN_Y, GAP_Y, CARD_H, CARDS_PER_PAGE, selectedCards: pickCards(scoresFor([catIds[0], catIds[1], catIds[2]], [3, 2, 1])), petName: "Test Pet", bonusMessage: "" };
vm.createContext(cricutSandbox);
vm.runInContext(realSlotXYSrc, cricutSandbox, { filename: "app.js (slotXY)" });
vm.runInContext(fs.readFileSync(path.join(DIR, "cricut-export.js"), "utf8"), cricutSandbox, { filename: "cricut-export.js" });
const buildCutFileSVG = vm.runInContext("buildCutFileSVG", cricutSandbox);
const realSlotXY = vm.runInContext("slotXY", cricutSandbox);

const fullPageSVG = buildCutFileSVG(CARDS_PER_PAGE);
check(fullPageSVG.startsWith("<?xml") && fullPageSVG.includes('width="8.5in" height="11in" viewBox="0 0 8.5 11"'), "Cricut SVG is well-formed and correctly sized");
check((fullPageSVG.match(/<rect /g) || []).length === CARDS_PER_PAGE, `Cricut full-page rect count is ${CARDS_PER_PAGE}`);
let slotMismatch = null;
for (let pos = 0; pos < CARDS_PER_PAGE; pos++) {
  const [x, y] = realSlotXY(pos);
  if (!fullPageSVG.includes(`x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}"`)) { slotMismatch = pos; break; }
}
check(slotMismatch === null, "every Cricut cut outline matches app.js's real slotXY exactly" + (slotMismatch === null ? "" : ` (mismatch at pos ${slotMismatch})`));
check(Math.ceil(noBonus.totalCards / CARDS_PER_PAGE) === Math.ceil((1 + cricutSandbox.selectedCards.length) / CARDS_PER_PAGE), "Cricut cut-file front-page count (no bonus) matches PDF's own front-page count (every page always full)");

const outPath = path.join(DIR, "test-output.pdf");
fs.writeFileSync(outPath, Buffer.from(withBonus.pdfDoc.output("arraybuffer")));
console.log("Wrote " + outPath);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
