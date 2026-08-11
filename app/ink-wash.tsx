"use client";

import { useEffect, useRef } from "react";
import type { IllustrationRecipe } from "./haiku";

type InkWashProps = {
  recipe: IllustrationRecipe;
  seed: number;
};

type Palette = {
  ink: [number, number, number];
  wash: [number, number, number];
  accent: [number, number, number];
};

const PALETTES: Record<IllustrationRecipe["tone"], Palette> = {
  sage: { ink: [54, 83, 71], wash: [158, 174, 157], accent: [169, 137, 119] },
  "blue-gray": { ink: [61, 78, 84], wash: [161, 175, 180], accent: [142, 149, 159] },
  sepia: { ink: [91, 77, 64], wash: [188, 175, 151], accent: [163, 126, 104] },
  "plum-gray": { ink: [83, 70, 78], wash: [179, 164, 170], accent: [149, 125, 134] },
};

function rgba(color: [number, number, number], alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function paintWash(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  color: [number, number, number],
  alpha: number,
) {
  context.save();
  context.translate(x, y);
  context.scale(1, radiusY / radiusX);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radiusX);
  gradient.addColorStop(0, rgba(color, alpha));
  gradient.addColorStop(0.62, rgba(color, alpha * 0.45));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, radiusX, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function softStroke(
  context: CanvasRenderingContext2D,
  draw: () => void,
  color: [number, number, number],
  width: number,
  random: () => number,
) {
  for (let pass = 0; pass < 3; pass += 1) {
    context.save();
    context.translate((random() - 0.5) * 1.8, (random() - 0.5) * 1.8);
    context.strokeStyle = rgba(color, 0.12 + pass * 0.035);
    context.lineWidth = width + pass * 0.55;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    draw();
    context.stroke();
    context.restore();
  }
}

function drawMotif(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  recipe: IllustrationRecipe,
  palette: Palette,
  random: () => number,
) {
  const side = recipe.placement === "left" ? 1 : -1;
  const originX = recipe.placement === "left" ? width * 0.36 : width * 0.64;
  const span = Math.min(width * 0.72, 560);
  const ground = height * 0.74;

  paintWash(context, width * 0.5, height * 0.52, width * 0.46, height * 0.4, palette.wash, 0.035);

  for (let index = 0; index < 12; index += 1) {
    paintWash(
      context,
      width * (0.12 + random() * 0.76),
      height * (0.12 + random() * 0.76),
      60 + random() * 120,
      38 + random() * 92,
      index % 3 === 0 ? palette.accent : palette.wash,
      0.04 + random() * 0.04,
    );
  }

  if (recipe.motif === "mountains") {
    for (let ridge = 0; ridge < 3; ridge += 1) {
      const ridgeY = ground + ridge * 18;
      softStroke(context, () => {
        context.moveTo(originX - side * span * 0.68, ridgeY);
        context.lineTo(originX - side * span * 0.2, ridgeY - 70 - ridge * 16);
        context.lineTo(originX + side * span * 0.12, ridgeY - 20);
        context.lineTo(originX + side * span * 0.52, ridgeY - 100 + ridge * 12);
        context.lineTo(originX + side * span * 0.82, ridgeY);
      }, palette.ink, 1.3, random);
    }
  } else if (recipe.motif === "river" || recipe.motif === "shore") {
    for (let line = 0; line < 5; line += 1) {
      const y = ground - 28 + line * 17;
      softStroke(context, () => {
        context.moveTo(originX - span * 0.72, y);
        context.bezierCurveTo(originX - span * 0.2, y - 13, originX + span * 0.18, y + 12, originX + span * 0.75, y - 3);
      }, palette.ink, 0.75, random);
    }
  } else if (recipe.motif === "pine") {
    softStroke(context, () => {
      context.moveTo(originX, ground + 55);
      context.quadraticCurveTo(originX - side * 8, ground - 18, originX + side * 7, ground - 128);
    }, palette.ink, 2.1, random);
    for (let branch = 0; branch < 8; branch += 1) {
      const y = ground - 18 - branch * 13;
      const reach = 24 + (7 - branch) * 4;
      softStroke(context, () => {
        context.moveTo(originX, y);
        context.quadraticCurveTo(originX + side * reach * 0.5, y + 5, originX + side * reach, y + 18);
      }, palette.ink, 1, random);
    }
  } else if (recipe.motif === "rain") {
    for (let drop = 0; drop < 28; drop += 1) {
      const x = originX + (random() - 0.5) * span * 1.5;
      const y = height * (0.15 + random() * 0.68);
      softStroke(context, () => {
        context.moveTo(x, y);
        context.lineTo(x - 8, y + 22 + random() * 17);
      }, palette.ink, 0.55, random);
    }
  } else if (recipe.motif === "blossoms") {
    softStroke(context, () => {
      context.moveTo(originX - side * span * 0.55, ground + 8);
      context.quadraticCurveTo(originX, ground - 70, originX + side * span * 0.52, ground - 130);
    }, palette.ink, 1.6, random);
    for (let flower = 0; flower < 22; flower += 1) {
      const x = originX + side * (random() - 0.3) * span;
      const y = ground - 35 - random() * 110;
      paintWash(context, x, y, 7 + random() * 7, 5 + random() * 6, palette.accent, 0.14);
    }
  } else if (recipe.motif === "reeds" || recipe.motif === "field") {
    for (let stem = 0; stem < 22; stem += 1) {
      const x = originX + (random() - 0.5) * span * 1.25;
      const heightOffset = 40 + random() * 105;
      softStroke(context, () => {
        context.moveTo(x, ground + 52);
        context.quadraticCurveTo(x + side * 13, ground - heightOffset * 0.55, x + side * 5, ground - heightOffset);
      }, palette.ink, 0.7, random);
    }
  } else if (recipe.motif === "snow") {
    for (let flake = 0; flake < 34; flake += 1) {
      const x = originX + (random() - 0.5) * span * 1.7;
      const y = height * (0.14 + random() * 0.62);
      context.fillStyle = rgba(palette.ink, 0.12 + random() * 0.08);
      context.beginPath();
      context.arc(x, y, 0.8 + random() * 1.8, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    for (let band = 0; band < 7; band += 1) {
      paintWash(context, originX + (random() - 0.5) * span, height * (0.28 + band * 0.07), span * 0.65, 18, palette.wash, 0.055);
    }
  }
}

function drawAccent(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  recipe: IllustrationRecipe,
  palette: Palette,
  random: () => number,
) {
  if (recipe.accent === "none") return;
  const side = recipe.placement === "left" ? 1 : -1;
  const x = recipe.placement === "left" ? width * 0.36 : width * 0.64;
  const y = height * 0.28;

  if (recipe.accent === "moon" || recipe.accent === "sun") {
    paintWash(context, x, y, 34, 34, palette.accent, recipe.accent === "sun" ? 0.15 : 0.11);
    context.fillStyle = rgba(palette.accent, 0.12);
    context.beginPath();
    context.arc(x, y, 17, 0, Math.PI * 2);
    context.fill();
  } else if (recipe.accent === "bird") {
    softStroke(context, () => {
      context.moveTo(x - side * 18, y);
      context.quadraticCurveTo(x - side * 9, y - 9, x, y);
      context.quadraticCurveTo(x + side * 9, y - 9, x + side * 18, y);
    }, palette.ink, 0.8, random);
  } else if (recipe.accent === "lantern") {
    paintWash(context, x, y + 18, 26, 34, palette.accent, 0.13);
    context.strokeStyle = rgba(palette.ink, 0.18);
    context.lineWidth = 1;
    context.strokeRect(x - 10, y, 20, 32);
  } else {
    for (let flower = 0; flower < 9; flower += 1) {
      paintWash(context, x + (random() - 0.5) * 68, y + (random() - 0.5) * 55, 7, 6, palette.accent, 0.13);
    }
  }
}

export default function InkWashIllustration({ recipe, seed }: InkWashProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paint = () => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const targetWidth = Math.round(bounds.width * pixelRatio);
      const targetHeight = Math.round(bounds.height * pixelRatio);
      if (canvas.width !== targetWidth) canvas.width = targetWidth;
      if (canvas.height !== targetHeight) canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);
      const palette = PALETTES[recipe.tone];
      const random = seededRandom(seed);
      drawMotif(context, bounds.width, bounds.height, recipe, palette, random);
      drawAccent(context, bounds.width, bounds.height, recipe, palette, random);
    };

    let frameId = 0;
    const schedulePaint = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(paint);
    };

    schedulePaint();
    window.addEventListener("resize", schedulePaint, { passive: true });
    window.addEventListener("orientationchange", schedulePaint, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", schedulePaint);
      window.removeEventListener("orientationchange", schedulePaint);
    };
  }, [recipe, seed]);

  return (
    <canvas
      ref={canvasRef}
      className="ink-wash-canvas"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    />
  );
}
