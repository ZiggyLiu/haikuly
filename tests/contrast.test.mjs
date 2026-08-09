import assert from "node:assert/strict";
import test from "node:test";

function luminance(hex) {
  const channels = hex
    .match(/../g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test("normal text colors meet WCAG AA contrast", () => {
  const pairs = [
    ["4f5d55", "eee9dc"],
    ["536159", "f8f5ed"],
    ["5f6c64", "f8f5ed"],
    ["5f6c64", "eee9dc"],
  ];
  for (const [foreground, background] of pairs) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  }
});
