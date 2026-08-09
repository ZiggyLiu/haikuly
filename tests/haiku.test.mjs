import assert from "node:assert/strict";
import test from "node:test";
import {
  FIVE_SYLLABLE_LINES,
  KEYWORD_ENDINGS,
  SEVEN_SYLLABLE_LINES,
  THEME_LINES,
  detectTheme,
  estimateSyllables,
  keywordLine,
  makeKeywordHaiku,
  makeRandomHaiku,
} from "../app/haiku.ts";

test("all curated random lines match their syllable target", () => {
  for (const line of FIVE_SYLLABLE_LINES) assert.equal(estimateSyllables(line), 5, line);
  for (const line of SEVEN_SYLLABLE_LINES) assert.equal(estimateSyllables(line), 7, line);
  for (const theme of Object.values(THEME_LINES)) {
    for (const line of theme.five) assert.equal(estimateSyllables(line), 5, line);
    for (const line of theme.seven) assert.equal(estimateSyllables(line), 7, line);
  }

  for (let seed = 0; seed < 100; seed += 1) {
    const haiku = makeRandomHaiku(seed);
    assert.deepEqual(haiku.lines.map(estimateSyllables), [5, 7, 5]);
  }
});

test("every keyword ending matches its declared syllable count", () => {
  for (const [target, endings] of Object.entries(KEYWORD_ENDINGS)) {
    for (const ending of endings) {
      assert.equal(estimateSyllables(ending), Number(target), ending || "empty ending");
    }
  }
});

test("keyword mode keeps inputs and always assembles a seven-syllable middle line", () => {
  const examples = [
    "rain",
    "ocean",
    "memory",
    "quiet river",
    "autumn river rain",
    "beautiful quiet fire",
    "beautiful quiet river",
  ];

  for (const keyword of examples) {
    for (let seed = 0; seed < 30; seed += 1) {
      const line = keywordLine(keyword, seed);
      assert.ok(line, `${keyword} must produce a line`);
      assert.equal(estimateSyllables(line), 7, line);
      assert.ok(line.toLowerCase().startsWith(keyword.toLowerCase()));

      const haiku = makeKeywordHaiku(keyword, seed);
      assert.ok(haiku);
      assert.deepEqual(haiku.lines.map(estimateSyllables), [5, 7, 5]);
    }
  }
});

test("keyword mode rejects invalid input and selects known themes", () => {
  assert.equal(keywordLine("", 1), null);
  assert.equal(keywordLine("beautiful quiet river rain", 1), null);
  assert.equal(detectTheme("ocean breeze"), "water");
  assert.equal(detectTheme("moon shadow"), "night");
  assert.equal(detectTheme("unknown thought"), "earth");
});
