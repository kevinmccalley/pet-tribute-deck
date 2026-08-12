// Content validation, run before ever touching the browser. Node-only, no deps.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "data.js"), "utf8"), sandbox, { filename: "data.js" });
const data = vm.runInContext("AFFIRMATIONS_DATA", sandbox);
const QUESTIONS = vm.runInContext("QUESTIONS", sandbox);
const PET_MODE_COPY = vm.runInContext("PET_MODE_COPY", sandbox);

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.log("FAIL: " + msg); } else { console.log("OK: " + msg); }
}

check(data.categories.length === 6, `6 categories (got ${data.categories.length})`);
check(data.affirmations.length === 150, `150 affirmations total (got ${data.affirmations.length})`);

const catIds = data.categories.map(c => c.id);
const countByCat = {};
catIds.forEach(id => (countByCat[id] = 0));
data.affirmations.forEach(a => { if (countByCat[a.category] !== undefined) countByCat[a.category]++; });
let allTwentyFive = true;
for (const id of catIds) {
  if (countByCat[id] !== 25) { allTwentyFive = false; console.log(`  ${id}: ${countByCat[id]} lines (expected 25)`); }
}
check(allTwentyFive, "exactly 25 affirmations per category");

const ids = data.affirmations.map(a => a.id);
check(new Set(ids).size === ids.length, `no duplicate affirmation ids (${ids.length} total, ${new Set(ids).size} unique)`);

const badCategory = data.affirmations.find(a => !catIds.includes(a.category));
check(!badCategory, `every affirmation.category exists in data.categories${badCategory ? ` (bad: ${badCategory.id} -> ${badCategory.category})` : ""}`);

check(QUESTIONS.length === 4, `4 quiz questions (got ${QUESTIONS.length})`);
let allFourOptions = true;
QUESTIONS.forEach((q, i) => { if (q.options.length !== 4) { allFourOptions = false; console.log(`  Q${i + 1} has ${q.options.length} options`); } });
check(allFourOptions, "every question has exactly 4 options");

const coveredCats = new Set();
QUESTIONS.forEach(q => q.options.forEach(opt => Object.keys(opt.weights).forEach(id => coveredCats.add(id))));
const uncovered = catIds.filter(id => !coveredCats.has(id));
check(uncovered.length === 0, `every category id appears in at least one quiz option's weights${uncovered.length ? ` (missing: ${uncovered.join(", ")})` : ""}`);

// No stray whitespace / empty text
const emptyText = data.affirmations.find(a => !a.text || !a.text.trim());
check(!emptyText, "no empty affirmation text");

// Every question's text carries both {verb} and {name} tokens (the one place
// mode actually touches the quiz — see questionText() in app.js).
let allTokensPresent = true;
QUESTIONS.forEach((q, i) => {
  if (!q.text.includes("{name}")) { allTokensPresent = false; console.log(`  Q${i + 1} missing {name} token`); }
});
check(allTokensPresent, "every question text includes a {name} token");

// Mode branching: both modes present with the fields app.js actually reads.
check(!!PET_MODE_COPY.celebration && !!PET_MODE_COPY.memorial, "both celebration and memorial modes present in PET_MODE_COPY");
const requiredModeFields = ["coverEyebrow", "showYearsField", "bonusFieldLabel", "bonusPlaceholder", "questionVerb"];
let allModeFieldsOk = true;
["celebration", "memorial"].forEach((modeId) => {
  requiredModeFields.forEach((field) => {
    if (!(field in PET_MODE_COPY[modeId])) {
      allModeFieldsOk = false;
      console.log(`  PET_MODE_COPY.${modeId} missing field: ${field}`);
    }
  });
});
check(allModeFieldsOk, "every mode has all fields app.js reads (coverEyebrow, showYearsField, bonusFieldLabel, bonusPlaceholder, questionVerb)");
check(PET_MODE_COPY.memorial.showYearsField === true && PET_MODE_COPY.celebration.showYearsField === false,
  "years-lived field is memorial-only");

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
