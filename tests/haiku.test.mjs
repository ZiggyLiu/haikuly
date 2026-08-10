import assert from "node:assert/strict";
import test from "node:test";
import {
  countPoeticUnits,
  estimateSyllables,
  generationSourceLabel,
  poemLinesClassName,
} from "../app/haiku.ts";

test("the syllable estimator verifies representative 5–7–5 lines", () => {
  const lines = [
    "Moonlight fills the pines",
    "The river carries the sky",
    "A quiet bell rings",
  ];
  assert.deepEqual(lines.map(estimateSyllables), [5, 7, 5]);
});

test("known pronunciation exceptions stay stable", () => {
  assert.equal(estimateSyllables("autumn"), 2);
  assert.equal(estimateSyllables("beautiful"), 3);
  assert.equal(estimateSyllables("moonlight"), 2);
  assert.equal(estimateSyllables("quiet"), 2);
  assert.equal(estimateSyllables("science"), 2);
});

test("Chinese poetic units count Han characters", () => {
  assert.equal(countPoeticUnits("春雨落花间", "zh"), 5);
  assert.equal(countPoeticUnits("远山藏入暮云中", "zh"), 7);
  assert.equal(countPoeticUnits("春雨，落花间", "zh"), 5);
});

test("the only generation source is DeepSeek", () => {
  assert.equal(generationSourceLabel("deepseek"), "Written with DeepSeek");
});

test("the longest English line selects one shared poem size", () => {
  assert.equal(poemLinesClassName(["x".repeat(20), "x".repeat(27), "x".repeat(18)], "en"), "poem-lines");
  assert.equal(
    poemLinesClassName(["x".repeat(20), "x".repeat(28), "x".repeat(18)], "en"),
    "poem-lines lines-tight",
  );
  assert.equal(
    poemLinesClassName(["x".repeat(39), "x".repeat(28), "x".repeat(18)], "en"),
    "poem-lines lines-extra-tight",
  );
});

test("Chinese lines keep their standard presentation", () => {
  assert.equal(poemLinesClassName(["春雨落花间", "远山藏入暮云中", "归鸟过长空"], "zh"), "poem-lines");
});
