import assert from "node:assert/strict";
import test from "node:test";
import {
  FIVE_SYLLABLE_LINES,
  KEYWORD_ENDINGS,
  SEVEN_SYLLABLE_LINES,
  THEME_LINES,
  detectTheme,
  estimateSyllables,
  generationSourceLabel,
  isSemanticallyCoherent,
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
  assert.equal(detectTheme("unknown thought"), "neutral");
});

test("long phrases keep a usable keyword fragment in the fallback", () => {
  const haiku = makeKeywordHaiku("artificial intelligence", 7);
  assert.ok(haiku);
  assert.deepEqual(haiku.lines.map(estimateSyllables), [5, 7, 5]);
  assert.match(haiku.lines[1], /artificial|intelligence/i);
});

test("generation source labels are explicit", () => {
  assert.equal(generationSourceLabel("local"), "Local generator");
  assert.equal(generationSourceLabel("openai"), "Written with OpenAI");
  assert.equal(generationSourceLabel("local-fallback"), "Local fallback");
});

test("seasonal fallback poems keep common-sense context", () => {
  const cases = [
    ["hot summer", /winter|snow|ice|frost|frozen|blizzard|cold/i],
    ["cold winter", /summer|hot|heat|humid|cicada/i],
    ["spring blossoms", /autumn|harvest|frozen|blizzard/i],
    ["autumn harvest", /spring|blossom|thaw|cicada/i],
  ];

  for (const [keyword, contradiction] of cases) {
    for (let seed = 0; seed < 100; seed += 1) {
      const haiku = makeKeywordHaiku(keyword, seed);
      assert.ok(haiku);
      assert.deepEqual(haiku.lines.map(estimateSyllables), [5, 7, 5]);
      assert.doesNotMatch(haiku.lines.join(" "), contradiction, `${keyword}: ${haiku.lines.join(" / ")}`);
      assert.equal(isSemanticallyCoherent(keyword, haiku.lines), true);
    }
  }
});

test("semantic checks reject accidents and allow deliberate contrast", () => {
  const accidental = [
    "Wild grass leans eastward",
    "Hot summer under moonlight",
    "Snow rests on cedar",
  ];
  const artistic = [
    "Wild grass leans eastward",
    "Summer remembers the snow",
    "A quiet bell rings",
  ];

  assert.equal(isSemanticallyCoherent("hot summer", accidental), false);
  assert.equal(isSemanticallyCoherent("hot summer", artistic), true);
  assert.equal(isSemanticallyCoherent("summer snow", accidental), true);
  assert.equal(detectTheme("hot summer"), "summer");
  assert.equal(detectTheme("cold winter"), "winter");
});

test("general fallback settings use compatible curated scenes", () => {
  const cases = [
    ["underwater", "water", /snow|cedar|office|desert|stars burn/i],
    ["indoor office", "indoor", /snow|cedar|dunes|cave|moon dust/i],
    ["desert sun", "desert", /snow|rain|stream|office|cedar/i],
    ["dark cave", "cave", /sun|dunes|office|cedar|window/i],
    ["vacuum of space", "space", /rain|stream|grass|office|cedar/i],
    ["unknown thought", "neutral", /snow|rain|desert|cave|cedar/i],
  ];

  for (const [keyword, expectedTheme, conflict] of cases) {
    assert.equal(detectTheme(keyword), expectedTheme);
    for (let seed = 0; seed < 100; seed += 1) {
      const haiku = makeKeywordHaiku(keyword, seed);
      assert.ok(haiku);
      assert.deepEqual(haiku.lines.map(estimateSyllables), [5, 7, 5]);
      assert.doesNotMatch(haiku.lines.join(" "), conflict, `${keyword}: ${haiku.lines.join(" / ")}`);
    }
  }
});
