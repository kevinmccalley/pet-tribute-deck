// Wizard logic: passphrase gate -> mode/style pick -> quiz -> category
// scoring -> card selection -> in-browser PDF. No backend, no storage —
// everything happens in this single page load.
//
// Engine reused wholesale from New Mom Survival Deck (quiz/scoring/PDF
// pipeline, card-back customization) merged with the CARD_STYLES/
// FRAME_STYLES multi-style system from dad-support-card/wedding-party-cards
// (this product's own card-styles.js). Mode branching (Celebration/
// Memorial) follows wedding-party-cards' MOMENT_COPY pattern.

// Access gate: unique per-buyer token, tied to a real Etsy order — same
// Etsy OAuth/webhook connection and database as every sibling product (one
// Etsy app covers the whole GoodStockPress shop) — see deck-of-us's api/
// folder for the actual claim/verify-token/webhook implementation.
const AUTH_API_BASE = "https://deck-of-us.vercel.app/api";
const ACCESS_TOKEN_KEY = "petTributeDeckToken";

const TOTAL_CARDS = 36;
const MAX_CATEGORIES = 3; // cap so results stay focused even if a buyer checks lots of boxes

let selectedCards = [];
let petName = "";
let mode = DEFAULT_MODE;
let styleId = DEFAULT_CARD_STYLE;
let yearsLived = "";
let bonusMessage = "";
let coverPhoto = null;

let backPattern = "crosshatch";
let backColorId = "brass";
let backShowText = true;
let backPhoto = null;

document.addEventListener("DOMContentLoaded", () => {
  renderModePicker();
  renderStylePicker();
  renderQuestions();
  document.getElementById("passphrase-form").addEventListener("submit", handlePassphraseSubmit);
  document.getElementById("quiz-form").addEventListener("submit", handleQuizSubmit);
  document.getElementById("download-btn").addEventListener("click", downloadPdf);
  document.getElementById("start-over-btn").addEventListener("click", () => location.reload());
  document.getElementById("buyer-name").addEventListener("input", updateQuestionNames);
  document.getElementById("bonus-message").addEventListener("input", (e) => {
    bonusMessage = e.target.value.slice(0, 200);
  });
  document.getElementById("years-lived").addEventListener("input", (e) => {
    yearsLived = e.target.value.slice(0, 20);
  });
  document.getElementById("addCoverPhotoBtn").addEventListener("click", () => {
    document.getElementById("coverPhotoInput").click();
  });
  document.getElementById("coverPhotoInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    coverPhoto = await processCoverPhotoFile(file, CARD_STYLES[styleId]);
    renderCoverPhotoPreview();
  });
  document.getElementById("removeCoverPhotoBtn").addEventListener("click", () => {
    coverPhoto = null;
    document.getElementById("coverPhotoInput").value = "";
    renderCoverPhotoPreview();
  });

  renderBackSwatches();
  renderBackcardPreview();
  document.getElementById("backLabelInput").addEventListener("input", renderBackcardPreview);
  document.getElementById("backShowTextToggle").addEventListener("change", (e) => {
    backShowText = e.target.checked;
    renderBackcardPreview();
  });
  document.getElementById("addBackPhotoBtn").addEventListener("click", () => {
    document.getElementById("backPhotoInput").click();
  });
  document.getElementById("backPhotoInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    backPhoto = await processBackPhotoFile(file);
    renderBackcardPreview();
  });
  document.getElementById("removeBackPhotoBtn").addEventListener("click", () => {
    backPhoto = null;
    document.getElementById("backPhotoInput").value = "";
    renderBackcardPreview();
  });
});

async function handlePassphraseSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("passphrase-input");
  const error = document.getElementById("passphrase-error");
  const button = e.target.querySelector("button[type=submit]");
  error.textContent = "";
  button.disabled = true;
  try {
    const resp = await fetch(`${AUTH_API_BASE}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: input.value.trim() }),
    });
    const data = await resp.json();
    if (resp.ok && data.token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.token);
      showScreen("quiz");
    } else {
      error.textContent = data.error || "That code doesn't match — check your order confirmation and try again.";
    }
  } catch {
    error.textContent = "Couldn't reach the server — check your connection and try again.";
  } finally {
    button.disabled = false;
  }
}

// On load: a `?token=` link (admin-minted) takes priority, then whatever's
// already saved from a prior successful claim.
(async function checkExistingAccess() {
  const urlToken = new URLSearchParams(location.search).get("token");
  const token = urlToken || localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return;
  try {
    const resp = await fetch(`${AUTH_API_BASE}/verify-token?token=${encodeURIComponent(token)}`);
    const data = await resp.json();
    if (data.valid) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      showScreen("quiz");
    }
  } catch {
    // Network hiccup on load — fall back to showing the gate screen as normal.
  }
})();

// --- Mode picker (Celebration / Memorial) ---------------------------------
function renderModePicker() {
  const container = document.getElementById("modePicker");
  container.innerHTML = Object.values(PET_MODE_COPY).map((m) => {
    const active = m.id === mode ? " active" : "";
    return `<button type="button" class="mode-option${active}" data-mode="${m.id}">
      <span class="mode-label">${m.label}</span>
      <span class="mode-desc">${m.description}</span>
    </button>`;
  }).join("");
  container.querySelectorAll(".mode-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.getAttribute("data-mode");
      renderModePicker();
      updateQuestionNames();
      document.getElementById("yearsLivedGroup").style.display = PET_MODE_COPY[mode].showYearsField ? "" : "none";
      document.getElementById("bonus-message-label").textContent = PET_MODE_COPY[mode].bonusFieldLabel;
      document.getElementById("bonus-message").placeholder = PET_MODE_COPY[mode].bonusPlaceholder;
    });
  });
  document.getElementById("yearsLivedGroup").style.display = PET_MODE_COPY[mode].showYearsField ? "" : "none";
}

// --- Style picker (deck-wide visual style) --------------------------------
function renderStylePicker() {
  const container = document.getElementById("stylePicker");
  container.innerHTML = Object.values(CARD_STYLES).map((s) => {
    const active = s.id === styleId ? " active" : "";
    return `<button type="button" class="style-option${active}" data-style="${s.id}" style="border-color: rgb(${s.accent.join(",")})">
      <span class="style-label">${s.label}</span>
      <span class="style-desc">${s.description}</span>
    </button>`;
  }).join("");
  container.querySelectorAll(".style-option").forEach((btn) => {
    btn.addEventListener("click", async () => {
      styleId = btn.getAttribute("data-style");
      renderStylePicker();
      // Re-crop the cover photo (if one was already added) to the new style's clip shape.
      if (coverPhoto && coverPhoto._sourceImg) {
        coverPhoto = await processCoverPhotoFile(null, CARD_STYLES[styleId], coverPhoto._sourceImg);
        renderCoverPhotoPreview();
      }
    });
  });
}

function renderCoverPhotoPreview() {
  const preview = document.getElementById("coverPhotoPreview");
  const removeBtn = document.getElementById("removeCoverPhotoBtn");
  if (coverPhoto) {
    preview.style.backgroundImage = `url(${coverPhoto.dataUrl})`;
    preview.classList.add("has-photo");
    removeBtn.style.display = "inline-flex";
  } else {
    preview.style.backgroundImage = "";
    preview.classList.remove("has-photo");
    removeBtn.style.display = "none";
  }
}

// Question text carries {name} and {verb} tokens — {name} reads as a
// question about the pet (the buyer, not the pet, fills this out); {verb}
// resolves to "is"/"was" per PET_MODE_COPY[mode], the one place mode
// actually touches the quiz itself.
function questionText(template) {
  const name = document.getElementById("buyer-name").value.trim();
  return template
    .replace(/\{name\}/g, name || "your pet")
    .replace(/\{verb\}/g, PET_MODE_COPY[mode].questionVerb);
}

function legendHtml(qIndex, q) {
  return `${qIndex + 1}. ${questionText(q.text)} <span class="hint">(choose as many as apply)</span>`;
}

function updateQuestionNames() {
  document.querySelectorAll("#questions legend").forEach((legend, qIndex) => {
    legend.innerHTML = legendHtml(qIndex, QUESTIONS[qIndex]);
  });
  document.querySelectorAll("#questions .option .option-text").forEach((span) => {
    span.textContent = questionText(span.getAttribute("data-template"));
  });
}

function renderQuestions() {
  const container = document.getElementById("questions");
  QUESTIONS.forEach((q, qIndex) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question";

    const legend = document.createElement("legend");
    legend.innerHTML = legendHtml(qIndex, q);
    fieldset.appendChild(legend);

    q.options.forEach((opt, oIndex) => {
      const label = document.createElement("label");
      label.className = "option";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = `q${qIndex}`;
      checkbox.value = oIndex;
      const span = document.createElement("span");
      span.className = "option-text";
      span.setAttribute("data-template", opt.label);
      span.textContent = questionText(opt.label);
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" "));
      label.appendChild(span);
      fieldset.appendChild(label);
    });

    container.appendChild(fieldset);
  });
}

function handleQuizSubmit(e) {
  e.preventDefault();
  const error = document.getElementById("quiz-error");
  const nameInput = document.getElementById("buyer-name");

  petName = nameInput.value.trim();
  if (!petName) {
    error.textContent = "Please enter a name so we know who this is for.";
    return;
  }
  const answered = QUESTIONS.every((_, qIndex) =>
    document.querySelectorAll(`input[name="q${qIndex}"]:checked`).length > 0
  );
  if (!answered) {
    error.textContent = "Please choose at least one option for every question.";
    return;
  }
  error.textContent = "";

  const scores = tallyScores();
  selectedCards = pickCards(scores);
  renderResults();
  showScreen("results");
}

function tallyScores() {
  const scores = {};
  AFFIRMATIONS_DATA.categories.forEach(c => (scores[c.id] = 0));

  QUESTIONS.forEach((q, qIndex) => {
    const checked = document.querySelectorAll(`input[name="q${qIndex}"]:checked`);
    checked.forEach(box => {
      const opt = q.options[Number(box.value)];
      Object.entries(opt.weights).forEach(([catId, weight]) => {
        scores[catId] += weight;
      });
    });
  });

  return scores;
}

// Counts scale to TOTAL_CARDS=36 (vs. the human decks' 52) — 36 divides
// cleanly by both 2 and 3, so the top-2/top-3 splits below land on whole
// numbers instead of an uneven remainder.
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

  // Fallback: if categories didn't yield enough (always true in the
  // 1-category case — a single category only holds 25 lines — top up
  // randomly from the other categories' unused pool.
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

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardText(card) {
  return card.text;
}

function renderResults() {
  document.getElementById("results-name").textContent = `Built for ${petName}`;
  const list = document.getElementById("results-list");
  list.innerHTML = "";
  selectedCards.forEach(card => {
    const li = document.createElement("li");
    li.textContent = cardText(card);
    list.appendChild(li);
  });
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
}

// --- PDF generation -------------------------------------------------
// Standard poker/tarot/ATC card size (2.5in x 3.5in) — same grid every
// sibling product uses. 36 content cards + 1 cover card = 37 minimum
// (+1 more, 38, if a bonus message card is added) — see downloadPdf().

const CARD_W = 2.5, CARD_H = 3.5;
const COLS = 2, ROWS = 3;
const MARGIN_X = 1.5, GAP_X = 0.5;
const MARGIN_Y = 0.2, GAP_Y = 0.05;
const CARDS_PER_PAGE = COLS * ROWS;

const DIVIDER_DEFAULT = [214, 209, 202];
const CROP_MARK = [180, 180, 180];

const SHOP_NAME = "GoodStockPress";
const PRODUCT_NAME = "Pet Tribute Deck";

async function downloadPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "in", format: "letter" });

  doc.addFileToVFS("Poppins-Regular.ttf", POPPINS_REGULAR_BASE64);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.addFileToVFS("Poppins-SemiBold.ttf", POPPINS_SEMIBOLD_BASE64);
  doc.addFont("Poppins-SemiBold.ttf", "Poppins", "bold");

  const style = CARD_STYLES[styleId] || CARD_STYLES[DEFAULT_CARD_STYLE];
  const fontDef = STYLE_FONT_FILES[style.displayFontKey];
  doc.addFileToVFS(fontDef.vfsName, fontDef.base64());
  doc.addFont(fontDef.vfsName, fontDef.family, fontDef.variant);

  doc.setProperties({ title: `${petName}'s Pet Tribute Deck` });

  // Buyer's chosen card-back color also drives the front faces' category
  // icons so both sides of the printed set match — same standing rule
  // every sibling deck product follows.
  const accentColor = BACK_COLORS.find((c) => c.id === backColorId) || BACK_COLORS[0];
  const iconPngs = await preloadIcons(accentColor.hex);

  drawInstructionsPage(doc, petName);

  doc.addPage();
  const backLabel = document.getElementById("backLabelInput").value.trim();
  drawCardBackPage(doc, backLabel, backPhoto, backPattern, accentColor.rgb, backShowText);

  // Cover card first, then the quiz-picked content cards, then an optional
  // bonus message card last — same "extra card(s) beyond the main set"
  // pattern as legacy-cards' 53rd card and New Mom's promo/cross-sell cards,
  // just with a cover card prepended too.
  const deck = [{ kind: "cover" }, ...selectedCards.map((c) => ({ kind: "content", card: c }))];
  if (bonusMessage.trim()) deck.push({ kind: "bonus", text: bonusMessage.trim() });

  deck.forEach((item, i) => {
    const posOnPage = i % CARDS_PER_PAGE;
    if (posOnPage === 0) doc.addPage();
    const [x, y] = slotXY(posOnPage);
    if (item.kind === "cover") {
      drawCoverCard(doc, x, y, style, fontDef, petName, mode, coverPhoto, yearsLived);
    } else if (item.kind === "bonus") {
      drawBonusMessageCard(doc, x, y, style, item.text, petName);
    } else {
      drawCard(doc, x, y, item.card, style, iconPngs);
    }
  });

  // Whatever's left empty on the last page gets used instead of left blank.
  const totalCards = deck.length;
  const leftoverOnLastPage = totalCards % CARDS_PER_PAGE;
  if (leftoverOnLastPage !== 0) {
    const emptySlotCount = CARDS_PER_PAGE - leftoverOnLastPage;
    if (emptySlotCount >= 2) {
      const [x1, y1] = slotXY(leftoverOnLastPage);
      drawPromoCard(doc, x1, y1, style);
      const [x2, y2] = slotXY(leftoverOnLastPage + 1);
      drawCrossSellCard(doc, x2, y2, style);
    } else {
      const [x, y] = slotXY(leftoverOnLastPage);
      drawCrossSellCard(doc, x, y, style);
    }
  }

  const filename = petName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${filename || "pet-tribute"}-deck.pdf`);
}

function drawInstructionsPage(doc, name) {
  const pageW = 8.5;
  const marginX = 1;
  let y = 1.1;

  doc.setFont("Poppins", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 26, 22);
  doc.text("How to Print Your Cards", pageW / 2, y, { align: "center" });
  y += 0.3;

  doc.setFont("Poppins", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 70, 60);
  doc.text(`For ${name}`, pageW / 2, y, { align: "center" });
  y += 0.6;

  const sections = [
    ["Paper", "Use heavyweight cardstock (80–110 lb cover, roughly 200–300 gsm) for a sturdy, shuffle-ready feel. Regular printer paper works fine too if you just want to try these out first."],
    ["Printer settings", "Paper size: Letter (8.5 x 11 in)  ·  Orientation: Portrait  ·  Scale: 100% / Actual Size. Do NOT use “Fit to Page” or “Shrink to Fit” — that will print your cards smaller than 2.5 x 3.5 in."],
    ["Cutting", "Cut along the small corner guide marks just outside each card. A paper cutter or a ruler + craft knife gives the straightest edges; scissors work fine too — cut just inside the guide marks rather than on the printed border itself."],
    ["Finished size", "Each card finishes at 2.5 x 3.5 in — standard poker/tarot card size — so they'll fit any standard card sleeve if you'd like to keep them together as a keepsake."],
  ];

  sections.forEach(([heading, body]) => {
    doc.setFont("Poppins", "bold");
    doc.setFontSize(12);
    doc.setTextColor(120, 70, 60);
    doc.text(heading, marginX, y);
    y += 0.25;

    doc.setFont("Poppins", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 26, 22);
    const lines = doc.splitTextToSize(body, pageW - marginX * 2);
    doc.text(lines, marginX, y, { lineHeightFactor: 1.4 });
    y += lines.length * 0.19 + 0.4;
  });
}

function slotXY(posOnPage) {
  const row = Math.floor(posOnPage / COLS);
  const col = posOnPage % COLS;
  return [MARGIN_X + col * (CARD_W + GAP_X), MARGIN_Y + row * (CARD_H + GAP_Y)];
}

function drawCropMarks(doc, x, y) {
  const markLen = 0.12;
  const gap = 0.04;
  doc.setDrawColor(...CROP_MARK);
  doc.setLineWidth(0.006);

  [
    [x, y, -1, -1],
    [x + CARD_W, y, 1, -1],
    [x, y + CARD_H, -1, 1],
    [x + CARD_W, y + CARD_H, 1, 1],
  ].forEach(([cx0, cy0, dx, dy]) => {
    doc.line(cx0 + dx * gap, cy0, cx0 + dx * (gap + markLen), cy0);
    doc.line(cx0, cy0 + dy * gap, cx0, cy0 + dy * (gap + markLen));
  });
}

// jsPDF's align:"center" doesn't account for charSpace when computing text
// width, so letter-spaced text drawn with { align: "center", charSpace }
// renders shifted right of true center (worse the longer the string). This
// measures and centers manually instead, using the font/size already set on
// doc at the call site.
function centeredSpacedText(doc, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map(ch => doc.getTextWidth(ch));
  const totalWidth = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - totalWidth / 2;
  chars.forEach((ch, i) => {
    doc.text(ch, x, y);
    x += widths[i] + spacing;
  });
}

function spacedTextWidth(doc, text, spacing) {
  const chars = [...text];
  return chars.map((ch) => doc.getTextWidth(ch)).reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
}

function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text, maxWidth);
}

// Shared shrink-to-fit + wrap helper for the cover card's display-font name
// (ported from wedding-party-cards' fitWrappedLines — see that repo's
// pdf-core.js for the full derivation of why font-relative ascent handling
// matters for script faces specifically).
function fitWrappedLines(doc, text, style, maxWidth, fontDef, maxLines, startSize, inkPad = 1.1) {
  doc.setFont(fontDef.family, fontDef.variant);
  let size = startSize || style.displayMaxSize;

  // Prefer shrinking to fit on one line over wrapping mid-name — a name
  // split across lines (or mid-word) reads as broken, not stylish.
  doc.setFontSize(size);
  while (size > style.displayMinSize && doc.getTextWidth(text) * inkPad > maxWidth) {
    size -= 1;
    doc.setFontSize(size);
  }
  if (doc.getTextWidth(text) * inkPad <= maxWidth) {
    return { size, lines: [text] };
  }

  // Only a genuinely long name reaches here — allow wrapping, continuing to
  // shrink past displayMinSize if needed to keep it within maxLines.
  const tooWide = (lines) => lines.length > maxLines || lines.some((l) => doc.getTextWidth(l) * inkPad > maxWidth);
  let lines = doc.splitTextToSize(text, maxWidth / inkPad);
  while (size > 10 && tooWide(lines)) {
    size -= 1;
    doc.setFontSize(size);
    lines = doc.splitTextToSize(text, maxWidth / inkPad);
  }
  return { size, lines };
}

// --- Card back customization (ported from Deck of Us — same pattern
// library, colors, and drawing logic every GoodStockPress deck product
// reuses verbatim) --------------------------------------------------------

const BACK_COLORS = [
  { id: "brass", label: "Brass", rgb: [169, 122, 63], hex: "#a97a3f", textHex: "#8a611f" },
  { id: "ink", label: "Ink", rgb: [28, 23, 18], hex: "#1c1712" },
  { id: "red", label: "Red", rgb: [176, 40, 38], hex: "#b02826" },
  { id: "purple", label: "Purple", rgb: [91, 58, 114], hex: "#5b3a72" },
  { id: "navy", label: "Navy", rgb: [30, 58, 95], hex: "#1e3a5f" },
];
const BACK_PATTERNS = [
  { id: "crosshatch", label: "Crosshatch", group: "modern" },
  { id: "stripes", label: "Stripes", group: "modern" },
  { id: "dots", label: "Dots", group: "modern" },
  { id: "grid", label: "Grid", group: "modern" },
  { id: "chevron", label: "Chevron", group: "modern" },
  { id: "fleur", label: "Fleur-de-Lis", group: "classic" },
  { id: "quatrefoil", label: "Quatrefoil", group: "classic" },
  { id: "scroll", label: "Scrollwork", group: "classic" },
  { id: "rosette", label: "Rosette", group: "classic" },
  { id: "trellis", label: "Diamond Trellis", group: "classic" },
];
const BACK_INSET = 0.14;
const BACK_INNER_ASPECT = (CARD_W - BACK_INSET * 2) / (CARD_H - BACK_INSET * 2);

function fillClosedPath(doc, points) {
  const deltas = [];
  for (let i = 1; i < points.length; i++) {
    deltas.push([points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]]);
  }
  doc.lines(deltas, points[0][0], points[0][1], [1, 1], "F", true);
}

function heartPoints(cx, cy, r, pointDown) {
  const N = 48;
  const raw = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    raw.push([x, y]);
  }
  const xMax = Math.max(...raw.map((p) => Math.abs(p[0])));
  const ys = raw.map((p) => p[1]);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const yCenter = (yMin + yMax) / 2;
  const sx = (r * 0.95) / xMax;
  const sy = (r * 0.95) / ((yMax - yMin) / 2);
  return raw.map(([x, y]) => {
    const centered = (y - yCenter) * sy;
    const dy = pointDown ? -centered : centered;
    return [cx + x * sx, cy + dy];
  });
}

const BACK_PATTERN_DRAW = {
  crosshatch(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.007);
    const step = 0.17;
    for (let d = -ih; d <= iw + ih; d += step) {
      doc.line(ix + d, iy, ix + d + ih, iy + ih);
      doc.line(ix + d, iy, ix + d - ih, iy + ih);
    }
  },
  stripes(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.009);
    const step = 0.15;
    for (let d = -ih; d <= iw + ih; d += step) {
      doc.line(ix + d, iy, ix + d + ih, iy + ih);
    }
  },
  dots(doc, ix, iy, iw, ih, color) {
    doc.setFillColor(...color);
    const step = 0.17, r = 0.03;
    for (let yy = iy + step / 2; yy <= iy + ih; yy += step) {
      for (let xx = ix + step / 2; xx <= ix + iw; xx += step) {
        doc.circle(xx, yy, r, "F");
      }
    }
  },
  grid(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.007);
    const step = 0.17;
    for (let xx = ix; xx <= ix + iw; xx += step) doc.line(xx, iy, xx, iy + ih);
    for (let yy = iy; yy <= iy + ih; yy += step) doc.line(ix, yy, ix + iw, yy);
  },
  chevron(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.012);
    const stepX = 0.15, amp = 0.09, rowH = amp * 2;
    for (let rowY = iy; rowY <= iy + ih + rowH; rowY += rowH) {
      let prevX = ix - stepX, prevY = rowY, up = true;
      for (let xx = ix - stepX; xx <= ix + iw + stepX; xx += stepX) {
        const yPos = up ? rowY - amp : rowY + amp;
        doc.line(prevX, prevY, xx, yPos);
        prevX = xx;
        prevY = yPos;
        up = !up;
      }
    }
  },
  fleur(doc, ix, iy, iw, ih, color) {
    doc.setFillColor(...color);
    const step = 0.36, R = 0.09;
    for (let yy = iy + step / 2; yy <= iy + ih; yy += step) {
      for (let xx = ix + step / 2; xx <= ix + iw; xx += step) {
        fillClosedPath(doc, heartPoints(xx, yy - R * 0.35, R, false));
        doc.circle(xx - R * 0.85, yy + R * 0.15, R * 0.38, "F");
        doc.circle(xx + R * 0.85, yy + R * 0.15, R * 0.38, "F");
        doc.rect(xx - R * 0.95, yy + R * 0.55, R * 1.9, R * 0.22, "F");
        fillClosedPath(doc, [
          [xx, yy + R * 1.05],
          [xx + R * 0.22, yy + R * 0.77],
          [xx - R * 0.22, yy + R * 0.77],
        ]);
      }
    }
  },
  quatrefoil(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.01);
    doc.setFillColor(...color);
    const step = 0.34, off = 0.071, r = 0.059;
    for (let yy = iy - step; yy <= iy + ih + step; yy += step) {
      for (let xx = ix - step; xx <= ix + iw + step; xx += step) {
        doc.circle(xx, yy - off, r, "S");
        doc.circle(xx, yy + off, r, "S");
        doc.circle(xx - off, yy, r, "S");
        doc.circle(xx + off, yy, r, "S");
        doc.circle(xx, yy, 0.013, "F");
      }
    }
  },
  scroll(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.013);
    doc.setFillColor(...color);
    const waveW = 0.42, amp = 0.09, rowH = 0.24, sampleStep = waveW / 8;
    for (let rowY = iy; rowY <= iy + ih + rowH; rowY += rowH) {
      let prevX = ix - waveW, prevY = rowY;
      for (let xx = ix - waveW; xx <= ix + iw + waveW; xx += sampleStep) {
        const t = ((xx - (ix - waveW)) / waveW) * Math.PI;
        const yy = rowY - amp * Math.sin(t);
        doc.line(prevX, prevY, xx, yy);
        prevX = xx;
        prevY = yy;
      }
      let bud = 0;
      for (let xx = ix - waveW / 2; xx <= ix + iw + waveW; xx += waveW) {
        doc.circle(xx, rowY - (bud % 2 === 0 ? amp : -amp), 0.02, "F");
        bud++;
      }
    }
  },
  rosette(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.009);
    doc.setFillColor(...color);
    const step = 0.32, R = 0.11, d = R * 0.707;
    for (let yy = iy + step / 2; yy <= iy + ih; yy += step) {
      for (let xx = ix + step / 2; xx <= ix + iw; xx += step) {
        doc.line(xx, yy - R, xx, yy + R);
        doc.line(xx - R, yy, xx + R, yy);
        doc.line(xx - d, yy - d, xx + d, yy + d);
        doc.line(xx + d, yy - d, xx - d, yy + d);
        doc.circle(xx, yy, R, "S");
        doc.circle(xx, yy, 0.02, "F");
      }
    }
  },
  trellis(doc, ix, iy, iw, ih, color) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.011);
    doc.setFillColor(...color);
    const step = 0.34, s = step / 2;
    for (let yy = iy - step; yy <= iy + ih + step; yy += step) {
      for (let xx = ix - step; xx <= ix + iw + step; xx += step) {
        const cx = xx + s, cy = yy + s;
        doc.lines([[s, s], [-s, s], [-s, -s]], cx, cy - s, [1, 1], "S", true);
        doc.circle(cx, cy, 0.025, "F");
      }
    }
  },
};

function backPatternDataUri(patternId, colorHex) {
  const svgs = {
    crosshatch: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 24L24 0M-3 3L3-3M21 27L27 21M0 0L24 24M-3 21L3 27M21 -3L27 3" stroke="${colorHex}" stroke-width="1.1" fill="none"/></svg>`,
    stripes: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M-2 2L2-2M0 16L16 0M14 18L18 14" stroke="${colorHex}" stroke-width="1.3" fill="none"/></svg>`,
    dots: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="7" cy="7" r="1.6" fill="${colorHex}"/></svg>`,
    grid: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path d="M14 0H0V14" stroke="${colorHex}" stroke-width="1" fill="none"/></svg>`,
    chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="14"><path d="M0 10L7 3L14 10L21 3L28 10" stroke="${colorHex}" stroke-width="1.4" fill="none"/></svg>`,
    fleur: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><g fill="${colorHex}"><path d="M15 3C19 7 19 13 15 15C11 13 11 7 15 3Z"/><circle cx="7.5" cy="15.5" r="3"/><circle cx="22.5" cy="15.5" r="3"/><rect x="6" y="17.5" width="18" height="2.2" rx="1"/><path d="M15 26L18.5 19.5L11.5 19.5Z"/></g></svg>`,
    quatrefoil: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><g fill="none" stroke="${colorHex}" stroke-width="1"><circle cx="12" cy="7.2" r="4.2"/><circle cx="12" cy="16.8" r="4.2"/><circle cx="7.2" cy="12" r="4.2"/><circle cx="16.8" cy="12" r="4.2"/></g><circle cx="12" cy="12" r="1" fill="${colorHex}"/></svg>`,
    scroll: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><path d="M0 10Q10 0 20 10T40 10" stroke="${colorHex}" stroke-width="1.3" fill="none"/><circle cx="10" cy="2" r="1.8" fill="${colorHex}"/><circle cx="30" cy="18" r="1.8" fill="${colorHex}"/></svg>`,
    rosette: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><g stroke="${colorHex}" stroke-width="1" fill="none"><path d="M13 3L13 23M3 13L23 13M5.9 5.9L20.1 20.1M20.1 5.9L5.9 20.1"/><circle cx="13" cy="13" r="9"/></g><circle cx="13" cy="13" r="1.8" fill="${colorHex}"/></svg>`,
    trellis: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M14 0L28 14L14 28L0 14Z" stroke="${colorHex}" stroke-width="1" fill="none"/><circle cx="14" cy="14" r="2" fill="${colorHex}"/></svg>`,
  };
  return `url(data:image/svg+xml,${encodeURIComponent(svgs[patternId] || svgs.crosshatch)})`;
}

function renderBackcardPreview() {
  const preview = document.getElementById("backcardPreview");
  const color = BACK_COLORS.find((c) => c.id === backColorId) || BACK_COLORS[0];

  if (backPhoto) {
    preview.style.backgroundImage = `url(${backPhoto})`;
    preview.classList.add("has-photo");
  } else {
    preview.style.backgroundImage = backPatternDataUri(backPattern, color.hex);
    preview.classList.remove("has-photo");
  }
  document.getElementById("removeBackPhotoBtn").style.display = backPhoto ? "inline-flex" : "none";

  const plate = document.getElementById("backcardPlate");
  const label = document.getElementById("backLabelInput").value.trim();
  plate.textContent = (label || SHOP_NAME).toUpperCase();
  plate.style.display = backShowText ? "" : "none";
  plate.style.color = color.textHex || color.hex;
  plate.style.borderColor = color.hex;

  document.getElementById("backLabelGroup").classList.toggle("disabled", !backShowText);
}

function renderBackSwatches() {
  const color = BACK_COLORS.find((c) => c.id === backColorId) || BACK_COLORS[0];

  const patternRow = document.getElementById("patternSwatches");
  const patternGroups = [["modern", "Modern"], ["classic", "Classic"]];
  patternRow.innerHTML = patternGroups.map(([groupId, groupLabel]) => `
    <div class="swatch-subgroup">
      <span class="swatch-subgroup-label">${groupLabel}</span>
      <div class="swatch-row">
        ${BACK_PATTERNS.filter((p) => p.group === groupId).map((p) => {
          const active = p.id === backPattern ? " active" : "";
          return `<button type="button" class="swatch pattern-swatch${active}" data-pattern="${p.id}" title="${p.label}" aria-label="${p.label} pattern" style="background-image:${backPatternDataUri(p.id, color.hex)}"></button>`;
        }).join("")}
      </div>
    </div>
  `).join("");
  patternRow.querySelectorAll(".pattern-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      backPattern = btn.getAttribute("data-pattern");
      renderBackSwatches();
      renderBackcardPreview();
    });
  });

  const colorRow = document.getElementById("colorSwatches");
  colorRow.innerHTML = BACK_COLORS.map((c) => {
    const active = c.id === backColorId ? " active" : "";
    return `<button type="button" class="swatch color-swatch${active}" data-color="${c.id}" title="${c.label}" aria-label="${c.label} color" style="background-color:${c.hex}"></button>`;
  }).join("");
  colorRow.querySelectorAll(".color-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      backColorId = btn.getAttribute("data-color");
      renderBackSwatches();
      renderBackcardPreview();
    });
  });
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function cropImageToDataUrl(img, targetAspect, outW, outH) {
  const imgAspect = img.width / img.height;
  let sx, sy, sw, sh;
  if (imgAspect > targetAspect) {
    sh = img.height;
    sw = sh * targetAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function processBackPhotoFile(file) {
  const img = await loadImageFile(file);
  const outW = 820;
  return cropImageToDataUrl(img, BACK_INNER_ASPECT, outW, Math.round(outW / BACK_INNER_ASPECT));
}

// --- Cover-card photo pipeline (reused pattern from Deck of Us's
// loadImageFile/cropImageToDataUrl — the same two utilities above) --------
// A single photo on the cover card only, not per-card (Deck of Us's own
// per-card photo pipeline is that product's whole differentiator; this one
// is tagged Low effort in the roadmap, so one cover photo is the deliberate
// scope line). Clip shape/aspect follows the chosen style's photoClip, and
// re-crops automatically if the buyer switches styles after adding a photo.
function photoClipAspect(clip) {
  return clip === "square" ? 1 : clip === "circle" ? 1 : 0.86; // "rounded" reads best slightly taller than wide
}

async function processCoverPhotoFile(file, style, existingImg) {
  const img = existingImg || (await loadImageFile(file));
  const outW = 700;
  const aspect = photoClipAspect(style.photoClip);
  const outH = Math.round(outW / aspect);
  let dataUrl = cropImageToDataUrl(img, aspect, outW, outH);
  if (style.photoTreatment === "sepia") dataUrl = await applySepia(dataUrl, outW, outH);
  return { dataUrl, _sourceImg: img };
}

function applySepia(dataUrl, w, h) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });
}

// --- Card-back page ---------------------------------------------------
function drawCardBackTile(doc, x, y, label, photo, patternId, color, showText) {
  drawCropMarks(doc, x, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.014);
  doc.roundedRect(x, y, CARD_W, CARD_H, 0.08, 0.08, "S");

  const inset = BACK_INSET;
  const ix = x + inset, iy = y + inset, iw = CARD_W - inset * 2, ih = CARD_H - inset * 2;
  doc.setLineWidth(0.006);
  doc.roundedRect(ix, iy, iw, ih, 0.05, 0.05, "S");

  if (photo) {
    doc.saveGraphicsState();
    doc.roundedRect(ix, iy, iw, ih, 0.05, 0.05, null);
    doc.clip();
    doc.discardPath();
    doc.addImage(photo, "JPEG", ix, iy, iw, ih);
    doc.restoreGraphicsState();
  } else {
    doc.saveGraphicsState();
    doc.roundedRect(ix, iy, iw, ih, 0.05, 0.05, null);
    doc.clip();
    doc.discardPath();
    (BACK_PATTERN_DRAW[patternId] || BACK_PATTERN_DRAW.crosshatch)(doc, ix, iy, iw, ih, color);
    doc.restoreGraphicsState();
  }

  if (!showText) return;

  const cx = x + CARD_W / 2, cy = y + CARD_H / 2;
  const plateH = 0.34;
  const spacing = 0.012;
  const maxPlateW = iw - 0.3;
  const labelText = (label || SHOP_NAME).toUpperCase();

  doc.setFont("Poppins", "bold");
  let fontSize = 8.5;
  doc.setFontSize(fontSize);
  while (spacedTextWidth(doc, labelText, spacing) + 0.36 > maxPlateW && fontSize > 6) {
    fontSize -= 0.5;
    doc.setFontSize(fontSize);
  }
  const plateW = Math.min(maxPlateW, Math.max(1.1, spacedTextWidth(doc, labelText, spacing) + 0.36));

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cx - plateW / 2, cy - plateH / 2, plateW, plateH, 0.05, 0.05, "F");
  doc.setDrawColor(...color);
  doc.setLineWidth(0.012);
  doc.roundedRect(cx - plateW / 2, cy - plateH / 2, plateW, plateH, 0.05, 0.05, "S");
  doc.setTextColor(...color);
  const vOffset = (fontSize / 72) * 0.34;
  centeredSpacedText(doc, labelText, cx, cy + vOffset, spacing);
}

function drawCardBackPage(doc, label, photo, patternId, color, showText) {
  for (let pos = 0; pos < CARDS_PER_PAGE; pos++) {
    const [x, y] = slotXY(pos);
    drawCardBackTile(doc, x, y, label, photo, patternId, color, showText);
  }

  const marginX = 0.2;
  const colW = MARGIN_X - marginX * 2;
  let y = 0.7;

  doc.setFont("Poppins", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(30, 26, 22);
  const headingLines = doc.splitTextToSize("Card Backs", colW);
  doc.text(headingLines, marginX, y, { lineHeightFactor: 1.25 });
  y += headingLines.length * 0.22 + 0.35;

  const sections = [
    "This page is the card back — the same design repeats behind every card in your deck.",
    "To print two-sided: print your card-front pages first, then run the same paper back through your printer with this page selected, printing it on the reverse of each sheet.",
    "Test one sheet first — printers vary, so check your printer's manual duplex guide for the correct paper orientation before running the whole deck.",
  ];

  doc.setFont("Poppins", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 26, 22);
  sections.forEach(text => {
    const lines = doc.splitTextToSize(text, colW);
    doc.text(lines, marginX, y, { lineHeightFactor: 1.4 });
    y += lines.length * 0.155 + 0.28;
  });
}

// --- Border/frame treatment, dispatches on the style's borderStyle (same
// role dad-support-card's FRAME_STYLES / wedding-party-cards'
// WEDDING_FRAME_STYLES play) — each of these 3 also draws a small
// procedural ornament (a paw print, a soft wash accent, a formal rule) so
// styles read as genuinely different, not just a palette swap. -----------

function drawPawPrint(doc, cx, cy, r, color) {
  doc.setFillColor(...color);
  doc.circle(cx, cy + r * 0.15, r * 0.55, "F");
  const toeR = r * 0.28;
  [[-0.62, -0.55], [-0.22, -0.85], [0.22, -0.85], [0.62, -0.55]].forEach(([dx, dy]) => {
    doc.circle(cx + dx * r, cy + dy * r, toeR, "F");
  });
}

const FRAME_STYLES = {
  // Cozy Cabin: a rugged single-rule border with a paw print at top-center —
  // dad-support-card's "adventurous" trail-marker treatment, re-themed.
  rustic(doc, x, y, w, h, style) {
    doc.setDrawColor(...style.accent);
    doc.setLineWidth(0.016);
    doc.roundedRect(x, y, w, h, 0.05, 0.05, "S");
    drawPawPrint(doc, x + w / 2, y + 0.2, 0.11, style.accent);
  },
  // Whimsical Watercolor: a soft double-line "wash" border (offset inner
  // rule at a lighter visual weight) plus a few small dot "paint spatter"
  // accents in one corner, evoking a watercolor edge without needing real
  // alpha blending.
  painterly(doc, x, y, w, h, style) {
    doc.setDrawColor(...style.accent);
    doc.setLineWidth(0.01);
    doc.roundedRect(x, y, w, h, 0.1, 0.1, "S");
    doc.setLineWidth(0.005);
    doc.roundedRect(x + 0.05, y + 0.05, w - 0.1, h - 0.1, 0.08, 0.08, "S");
    doc.setFillColor(...style.accent);
    [[0.14, 0.14, 0.02], [0.24, 0.1, 0.014], [0.1, 0.24, 0.012]].forEach(([dx, dy, r]) => {
      doc.circle(x + dx, y + dy, r, "F");
    });
  },
  // Timeless Portrait: a formal double-rule frame (outer heavy, inner
  // hairline) — dad-support-card's "tailored" treatment.
  formal(doc, x, y, w, h, style) {
    doc.setDrawColor(...style.accent);
    doc.setLineWidth(0.02);
    doc.roundedRect(x, y, w, h, 0.03, 0.03, "S");
    doc.setLineWidth(0.005);
    doc.roundedRect(x + 0.08, y + 0.08, w - 0.16, h - 0.16, 0.02, 0.02, "S");
  },
};

function drawBorderFrame(doc, x, y, w, h, style) {
  if (style.panelFill) {
    doc.setFillColor(...style.panelFill);
    doc.rect(x, y, w, h, "F");
  }
  const drawFrame = FRAME_STYLES[style.borderStyle] || FRAME_STYLES.formal;
  drawFrame(doc, x, y, w, h, style);
}

// --- Content card (style-driven) -----------------------------------------
function drawCard(doc, x, y, card, style, iconPngs) {
  drawCropMarks(doc, x, y);
  drawBorderFrame(doc, x, y, CARD_W, CARD_H, style);

  const cx = x + CARD_W / 2;
  const iconCy = y + 0.62;
  const iconSize = 0.5;
  doc.addImage(iconPngs[card.category], "PNG", cx - iconSize / 2, iconCy - iconSize / 2, iconSize, iconSize);

  doc.setDrawColor(...style.divider);
  doc.setLineWidth(0.008);
  doc.line(x + 0.45, y + 1.05, x + CARD_W - 0.45, y + 1.05);

  doc.setFont("Poppins", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...style.ink);
  const wrapWidth = CARD_W - 0.5;
  const lines = doc.splitTextToSize(cardText(card), wrapWidth);
  const lineHeight = 0.19;
  const textBlockTop = y + 1.2;
  const textBlockBottom = y + CARD_H - 0.45;
  const textHeight = lines.length * lineHeight;
  const textStartY = textBlockTop + (textBlockBottom - textBlockTop - textHeight) / 2 + lineHeight * 0.75;
  doc.text(lines, cx, textStartY, { align: "center", lineHeightFactor: 1.35 });

  doc.setFont("Poppins", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...style.accent);
  centeredSpacedText(doc, `FOR ${petName.toUpperCase()}`, cx, y + CARD_H - 0.28, 0.02);
}

// --- Cover card ------------------------------------------------------------
// Card position 0 of every deck — the pet's name in the style's display
// font, the mode's eyebrow/title framing, an optional photo, and (Memorial
// only) a years-lived line. Real card-sized, crop-marked and framed exactly
// like every content card, matching the precedent every sibling product's
// bonus/cover cards already set.
function drawCoverCard(doc, x, y, style, fontDef, name, modeId, photo, years) {
  drawCropMarks(doc, x, y);
  drawBorderFrame(doc, x, y, CARD_W, CARD_H, style);

  const modeCopy = PET_MODE_COPY[modeId];
  const cx = x + CARD_W / 2;
  let ty = y + 0.42;

  doc.setFont("Poppins", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...style.accent);
  doc.text(modeCopy.coverEyebrow, cx, ty, { align: "center" });
  ty += 0.22;

  if (photo && photo.dataUrl) {
    const photoSize = 1.0;
    if (style.photoClip === "circle") {
      doc.saveGraphicsState();
      doc.circle(cx, ty + photoSize / 2, photoSize / 2, null);
      doc.clip();
      doc.discardPath();
      doc.addImage(photo.dataUrl, "JPEG", cx - photoSize / 2, ty, photoSize, photoSize);
      doc.restoreGraphicsState();
    } else {
      const r = style.photoClip === "square" ? 0.02 : 0.08;
      doc.saveGraphicsState();
      doc.roundedRect(cx - photoSize / 2, ty, photoSize, photoSize, r, r, null);
      doc.clip();
      doc.discardPath();
      doc.addImage(photo.dataUrl, "JPEG", cx - photoSize / 2, ty, photoSize, photoSize);
      doc.restoreGraphicsState();
    }
    ty += photoSize + 0.14;
  } else {
    ty += 0.1;
  }

  const nameText = style.displayUppercase ? name.toUpperCase() : name;
  doc.setTextColor(...style.ink);
  const { size: usedSize, lines: nameLines } = fitWrappedLines(doc, nameText, style, CARD_W - 0.4, fontDef, 2);
  ty += (usedSize / 72) * fontDef.ascentRatio;
  const nameLineGap = (usedSize / 72) * 1.05;
  doc.setFont(fontDef.family, fontDef.variant);
  doc.setFontSize(usedSize);
  nameLines.forEach((line, i) => doc.text(line, cx, ty + i * nameLineGap, { align: "center" }));
  ty += (nameLines.length - 1) * nameLineGap + (usedSize / 72) * 0.35;

  if (modeCopy.showYearsField && years) {
    doc.setFont("Poppins", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...style.ink);
    doc.text(years, cx, ty, { align: "center" });
  }

  doc.setFont("Poppins", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...style.accent);
  centeredSpacedText(doc, SHOP_NAME.toUpperCase(), cx, y + CARD_H - 0.28, 0.02);
}

// --- Optional bonus free-text card (ported from legacy-cards' "optional
// 53rd card" mechanic — presence of text is the toggle, not a checkbox;
// same frame/crop-marks as a real card so it doesn't look out of place).
// Available in both modes (Kevin's call 2026-08-12) — a celebration buyer
// may want to add their own line too, not just a grieving one.
function drawBonusMessageCard(doc, x, y, style, message, name) {
  drawCropMarks(doc, x, y);
  drawBorderFrame(doc, x, y, CARD_W, CARD_H, style);

  const cx = x + CARD_W / 2;

  doc.setFont("Poppins", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...style.accent);
  doc.text("IN YOUR OWN WORDS", cx, y + 0.45, { align: "center" });

  doc.setDrawColor(...style.divider);
  doc.setLineWidth(0.008);
  doc.line(x + 0.45, y + 0.62, x + CARD_W - 0.45, y + 0.62);

  doc.setFont("Poppins", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(...style.ink);
  const lines = doc.splitTextToSize(`"${message}"`, CARD_W - 0.5);
  const lineHeight = 0.19;
  const textBlockTop = y + 0.8;
  const textBlockBottom = y + CARD_H - 0.45;
  const textHeight = lines.length * lineHeight;
  const textStartY = textBlockTop + (textBlockBottom - textBlockTop - textHeight) / 2 + lineHeight * 0.75;
  doc.text(lines, cx, textStartY, { align: "center", lineHeightFactor: 1.35 });

  doc.setFont("Poppins", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...style.accent);
  centeredSpacedText(doc, `FOR ${name.toUpperCase()}`, cx, y + CARD_H - 0.28, 0.02);
}

// Bonus "card" that fills whatever slot is left empty on the last page,
// instead of leaving blank space.
function drawPromoCard(doc, x, y, style) {
  drawCropMarks(doc, x, y);
  drawBorderFrame(doc, x, y, CARD_W, CARD_H, style);

  const cx = x + CARD_W / 2;

  doc.setFont("Poppins", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...style.accent);
  doc.text(PRODUCT_NAME, cx, y + 0.6, { align: "center" });

  doc.setDrawColor(...style.divider);
  doc.setLineWidth(0.008);
  doc.line(x + 0.45, y + 0.78, x + CARD_W - 0.45, y + 0.78);

  doc.setFont("Poppins", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...style.ink);
  const message = `Thank you for bringing ${PRODUCT_NAME} into your home. If these words meant something, a quick review helps other pet families find them too.`;
  const lines = doc.splitTextToSize(message, CARD_W - 0.5);
  doc.text(lines, cx, y + 1.15, { align: "center", lineHeightFactor: 1.4 });

  doc.setFont("Poppins", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...style.accent);
  centeredSpacedText(doc, `BY ${SHOP_NAME.toUpperCase()}`, cx, y + CARD_H - 0.28, 0.02);
}

// Cross-sell bonus card — turns the deck into a mini catalog for the rest
// of the shop instead of just a thank-you.
function drawCrossSellCard(doc, x, y, style) {
  drawCropMarks(doc, x, y);
  drawBorderFrame(doc, x, y, CARD_W, CARD_H, style);

  const cx = x + CARD_W / 2;

  doc.setFont("Poppins", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...style.accent);
  doc.text(["More From", "GoodStockPress"], cx, y + 0.55, { align: "center", lineHeightFactor: 1.3 });

  doc.setDrawColor(...style.divider);
  doc.setLineWidth(0.008);
  doc.line(x + 0.45, y + 0.95, x + CARD_W - 0.45, y + 0.95);

  doc.setFont("Poppins", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...style.ink);
  const message = "Thanks for getting this Pet Tribute Deck. Search GoodStockPress on Etsy for more personalized keepsakes like this.";
  const lines = doc.splitTextToSize(message, CARD_W - 0.5);
  doc.text(lines, cx, y + 1.3, { align: "center", lineHeightFactor: 1.4 });

  doc.setFont("Poppins", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...style.accent);
  centeredSpacedText(doc, `BY ${SHOP_NAME.toUpperCase()}`, cx, y + CARD_H - 0.28, 0.02);
}

// --- Phosphor icons, one per category ------------------------------------
function svgToPngDataUrl(svgString, pxSize) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = pxSize;
    canvas.height = pxSize;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, pxSize, pxSize);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Icons ship baked to the brand dusty rose (fill="#8b3a52") — swap in the
// buyer's chosen accent hex before rasterizing so icons match the card
// border/footer color they picked.
async function preloadIcons(accentHex) {
  const pngs = {};
  for (const cat of AFFIRMATIONS_DATA.categories.map(c => c.id)) {
    const svg = MATERIAL_ICONS_SVG[cat].replace(/fill="#[0-9a-f]{6}"/i, `fill="${accentHex}"`);
    pngs[cat] = await svgToPngDataUrl(svg, 240);
  }
  return pngs;
}
