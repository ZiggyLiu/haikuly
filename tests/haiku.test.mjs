import assert from "node:assert/strict";
import test from "node:test";
import {
  countPoeticUnits,
  countJapaneseMora,
  estimateSyllables,
  generationSourceLabel,
  haikuDateLabel,
  haikuImageFilename,
  isIllustrationRecipe,
  poemLinesClassName,
} from "../app/haiku.ts";

test("creation dates use the selected poem language", () => {
  const createdAt = new Date(2026, 7, 10, 12).toISOString();
  assert.equal(haikuDateLabel(createdAt, "en"), "AUG 10, 2026");
  assert.equal(haikuDateLabel(createdAt, "zh"), "2026年8月10日");
  assert.equal(haikuDateLabel(createdAt, "ja"), "2026年8月10日");
  assert.equal(haikuDateLabel("not-a-date", "en"), "DATE —");
});

test("saved haiku pictures get a clear dated filename", () => {
  const createdAt = new Date(2026, 7, 10, 12).toISOString();
  assert.equal(haikuImageFilename(createdAt), "stillpoint-haiku-2026-08-10.png");
  assert.equal(haikuImageFilename("not-a-date"), "stillpoint-haiku.png");
});

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

test("Japanese mora counting handles contracted and independent kana", () => {
  assert.equal(countJapaneseMora("ふるいけや"), 5);
  assert.equal(countJapaneseMora("かわずとびこむ"), 7);
  assert.equal(countJapaneseMora("みずのおと"), 5);
  assert.equal(countJapaneseMora("きょう"), 2);
  assert.equal(countJapaneseMora("がっこう"), 4);
  assert.equal(countJapaneseMora("スーパー"), 4);
  assert.equal(countPoeticUnits("ふるいけや", "ja"), 5);
});

test("the only generation source is DeepSeek", () => {
  assert.equal(generationSourceLabel("deepseek"), "Written & painted with DeepSeek");
  assert.equal(generationSourceLabel("deepseek", "zh"), "由 DeepSeek 创作与绘制");
  assert.equal(generationSourceLabel("deepseek", "ja"), "DeepSeekによる作句・描画");
});

test("illustration recipes allow only the restrained render vocabulary", () => {
  assert.equal(isIllustrationRecipe({
    motif: "mountains",
    accent: "bird",
    tone: "blue-gray",
    placement: "left",
  }), true);
  assert.equal(isIllustrationRecipe({
    motif: "mountains",
    accent: "bird",
    tone: "neon",
    placement: "left",
  }), false);
  assert.equal(isIllustrationRecipe({
    motif: "mountains",
    accent: "bird",
    tone: "sage",
    placement: "center",
  }), false);
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

test("Japanese lines keep their standard presentation", () => {
  assert.equal(poemLinesClassName(["古池や", "蛙飛びこむ", "水の音"], "ja"), "poem-lines");
});
