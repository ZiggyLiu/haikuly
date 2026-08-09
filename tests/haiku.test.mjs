import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCAL_COMPOSITION_BANKS,
  detectTheme,
  estimateSyllables,
  generationSourceLabel,
  isSemanticallyCoherent,
  makeKeywordHaiku,
  makeRandomHaiku,
} from "../app/haiku.ts";

test("random composition always keeps the 5–7–5 form", () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const haiku = makeRandomHaiku(seed);
    assert.deepEqual(haiku.lines.map(estimateSyllables), [5, 7, 5]);
  }
});

test("local composition fragments produce exact five- and seven-syllable lines", () => {
  for (const [context, bank] of Object.entries(LOCAL_COMPOSITION_BANKS)) {
    for (const entry of bank.images) {
      assert.equal(estimateSyllables(entry.subject), 2, `${context} subject: ${entry.subject}`);
      const shortSettings = bank.shortSettings.filter((candidate) =>
        candidate.tags.some((tag) => entry.tags.includes(tag)),
      );
      const longSettings = bank.longSettings.filter((candidate) =>
        candidate.tags.some((tag) => entry.tags.includes(tag)),
      );
      assert.ok(shortSettings.length > 0, `${context} short settings for ${entry.subject}`);
      assert.ok(longSettings.length > 0, `${context} long settings for ${entry.subject}`);
      for (const action of entry.actions) {
        assert.equal(estimateSyllables(action), 1, `${context} action: ${action}`);
        for (const candidate of shortSettings) {
          const line = `${entry.subject} ${action} ${candidate.text}`;
          assert.equal(estimateSyllables(line), 5, `${context}: ${line}`);
        }
        for (const candidate of longSettings) {
          const line = `${entry.subject} ${action} ${candidate.text}`;
          assert.equal(estimateSyllables(line), 7, `${context}: ${line}`);
        }
      }
    }
  }
});

test("the compositional generator creates broad local variety", () => {
  const randomPoems = new Set();
  const summerPoems = new Set();
  const unknownPoems = new Set();

  for (let seed = 0; seed < 500; seed += 1) {
    const random = makeRandomHaiku(seed);
    const summer = makeKeywordHaiku("hot summer", seed);
    const unknown = makeKeywordHaiku("unknown thought", seed);
    assert.ok(summer);
    assert.ok(unknown);
    assert.notEqual(random.lines[0], random.lines[2]);
    assert.notEqual(summer.lines[0], summer.lines[2]);
    randomPoems.add(random.lines.join("\n"));
    summerPoems.add(summer.lines.join("\n"));
    unknownPoems.add(unknown.lines.join("\n"));
  }

  assert.ok(randomPoems.size > 450, `random variety: ${randomPoems.size}`);
  assert.ok(summerPoems.size > 200, `summer variety: ${summerPoems.size}`);
  assert.ok(unknownPoems.size > 150, `unknown variety: ${unknownPoems.size}`);
});

test("keyword poems avoid repeated images, actions, and settings", () => {
  const cases = [
    ["hot summer", "summer"],
    ["first snow", "winter"],
    ["ocean", "water"],
    ["city street", "city"],
    ["love", "heart"],
    ["season", "season"],
  ];

  for (const [keyword, context] of cases) {
    const bank = LOCAL_COMPOSITION_BANKS[context];
    for (let seed = 0; seed < 500; seed += 1) {
      const haiku = makeKeywordHaiku(keyword, seed);
      assert.ok(haiku);
      const parts = haiku.lines.map((line) => {
        const entry = bank.images.find((candidate) => line.startsWith(`${candidate.subject} `));
        assert.ok(entry, `${keyword}: ${line}`);
        const remainder = line.slice(entry.subject.length + 1);
        const action = entry.actions.find((candidate) => remainder.startsWith(`${candidate} `));
        assert.ok(action, `${keyword}: ${line}`);
        return { subject: entry.subject, action, setting: remainder.slice(action.length + 1) };
      });
      assert.equal(new Set(parts.map((part) => part.subject)).size, 3, `${keyword}: repeated subject`);
      assert.equal(new Set(parts.map((part) => part.action)).size, 3, `${keyword}: repeated action`);
      assert.equal(new Set(parts.map((part) => part.setting)).size, 3, `${keyword}: repeated setting`);
    }
  }
});

test("every detected theme keeps a positive keyword connection", () => {
  const cases = [
    ["love", "heart"],
    ["grief", "heart"],
    ["city street", "city"],
    ["traffic", "city"],
    ["season", "season"],
  ];

  for (const [keyword, context] of cases) {
    assert.equal(detectTheme(keyword), context);
    const haiku = makeKeywordHaiku(keyword, 137);
    assert.ok(haiku);
    const subjects = LOCAL_COMPOSITION_BANKS[context].images.map((entry) => entry.subject);
    assert.ok(haiku.lines.every((line) => subjects.some((subject) => line.startsWith(`${subject} `))));
  }
});

test("keyword mode always assembles an exact 5–7–5 poem", () => {
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
      const haiku = makeKeywordHaiku(keyword, seed);
      assert.ok(haiku);
      assert.deepEqual(haiku.lines.map(estimateSyllables), [5, 7, 5]);
    }
  }
});

test("keyword mode rejects empty input and selects known themes", () => {
  assert.equal(makeKeywordHaiku("", 1), null);
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
