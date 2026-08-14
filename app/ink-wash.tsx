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

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
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

  if (recipe.motif === "window") {
    const frameWidth = Math.min(span * 0.74, 360);
    const frameHeight = Math.min(height * 0.48, 205);
    const left = originX - frameWidth / 2;
    const top = height * 0.18;
    paintWash(context, originX, top + frameHeight * 0.5, frameWidth * 0.72, frameHeight * 0.72, palette.wash, 0.07);
    softStroke(context, () => {
      context.rect(left, top, frameWidth, frameHeight);
      context.moveTo(originX, top);
      context.lineTo(originX, top + frameHeight);
      context.moveTo(left, top + frameHeight * 0.54);
      context.lineTo(left + frameWidth, top + frameHeight * 0.54);
    }, palette.ink, 0.9, random);
    softStroke(context, () => {
      context.moveTo(left - side * 12, top - 8);
      context.bezierCurveTo(left + side * 18, top + 62, left - side * 10, top + 126, left + side * 32, top + frameHeight + 18);
    }, palette.ink, 0.7, random);
  } else if (recipe.motif === "skyline") {
    const baseline = ground + 38;
    softStroke(context, () => {
      context.moveTo(originX - span * 0.7, baseline);
      context.lineTo(originX + span * 0.7, baseline);
    }, palette.ink, 0.7, random);
    let x = originX - span * 0.65;
    for (let building = 0; building < 9; building += 1) {
      const buildingWidth = 28 + random() * 34;
      const buildingHeight = 58 + random() * 105;
      softStroke(context, () => {
        context.moveTo(x, baseline);
        context.lineTo(x, baseline - buildingHeight);
        context.lineTo(x + buildingWidth, baseline - buildingHeight);
        context.lineTo(x + buildingWidth, baseline);
      }, palette.ink, 0.65, random);
      paintWash(context, x + buildingWidth / 2, baseline - buildingHeight * 0.55, buildingWidth * 0.7, buildingHeight * 0.6, palette.wash, 0.035);
      x += buildingWidth + 8 + random() * 12;
    }
  } else if (recipe.motif === "transit") {
    const carWidth = Math.min(span * 1.2, 520);
    const carHeight = 112;
    const left = originX - carWidth / 2;
    const top = ground - carHeight;
    paintWash(context, originX, top + carHeight * 0.45, carWidth * 0.58, carHeight * 0.78, palette.wash, 0.06);
    softStroke(context, () => {
      roundedRectPath(context, left, top, carWidth, carHeight, 18);
      context.moveTo(left + 28, top + 36);
      context.lineTo(left + carWidth - 28, top + 36);
      context.moveTo(left - 35, ground + 28);
      context.lineTo(left + carWidth + 35, ground + 28);
      context.moveTo(left - 20, ground + 42);
      context.lineTo(left + carWidth + 20, ground + 42);
    }, palette.ink, 0.8, random);
    for (let pane = 0; pane < 5; pane += 1) {
      const paneX = left + 38 + pane * ((carWidth - 76) / 5);
      softStroke(context, () => {
        context.rect(paneX, top + 49, (carWidth - 110) / 5, 35);
      }, palette.ink, 0.45, random);
    }
  } else if (recipe.motif === "cafe") {
    const tableY = ground - 6;
    paintWash(context, originX, tableY - 42, span * 0.55, 80, palette.accent, 0.055);
    softStroke(context, () => {
      context.moveTo(originX - span * 0.55, tableY);
      context.bezierCurveTo(originX - span * 0.18, tableY - 5, originX + span * 0.2, tableY + 5, originX + span * 0.55, tableY);
      context.moveTo(originX - span * 0.3, tableY + 2);
      context.lineTo(originX - span * 0.38, tableY + 90);
      context.moveTo(originX + span * 0.3, tableY + 2);
      context.lineTo(originX + span * 0.38, tableY + 90);
      context.ellipse(originX, tableY - 44, 24, 8, 0, 0, Math.PI * 2);
      context.moveTo(originX - 20, tableY - 43);
      context.lineTo(originX - 16, tableY - 12);
      context.quadraticCurveTo(originX, tableY - 5, originX + 16, tableY - 12);
      context.lineTo(originX + 20, tableY - 43);
    }, palette.ink, 0.75, random);
  } else if (recipe.motif === "desk") {
    const deskY = ground + 8;
    paintWash(context, originX, deskY - 42, span * 0.62, 86, palette.wash, 0.05);
    softStroke(context, () => {
      context.moveTo(originX - span * 0.62, deskY);
      context.lineTo(originX + span * 0.62, deskY);
      context.moveTo(originX - span * 0.46, deskY);
      context.lineTo(originX - span * 0.5, deskY + 92);
      context.moveTo(originX + span * 0.46, deskY);
      context.lineTo(originX + span * 0.5, deskY + 92);
      context.moveTo(originX - 72, deskY - 9);
      context.lineTo(originX - 55, deskY - 84);
      context.lineTo(originX + 62, deskY - 84);
      context.lineTo(originX + 76, deskY - 9);
      context.closePath();
      context.moveTo(originX - 82, deskY - 7);
      context.lineTo(originX + 86, deskY - 7);
    }, palette.ink, 0.8, random);
  } else if (recipe.motif === "doorway") {
    const doorWidth = Math.min(span * 0.5, 210);
    const doorHeight = Math.min(height * 0.58, 250);
    const left = originX - doorWidth / 2;
    const top = ground - doorHeight + 44;
    paintWash(context, originX + side * 18, top + doorHeight * 0.52, doorWidth * 0.8, doorHeight * 0.68, palette.accent, 0.055);
    softStroke(context, () => {
      context.rect(left, top, doorWidth, doorHeight);
      context.moveTo(left + doorWidth * 0.3, top + doorHeight * 0.42);
      context.lineTo(left + doorWidth * 0.82, top + doorHeight * 0.3);
      context.lineTo(left + doorWidth * 0.82, top + doorHeight);
      context.moveTo(left + doorWidth * 0.82, top + doorHeight);
      context.lineTo(originX + side * span * 0.56, ground + 68);
      context.moveTo(left + doorWidth * 0.3, top + doorHeight);
      context.lineTo(originX - side * span * 0.48, ground + 68);
    }, palette.ink, 0.9, random);
  } else if (recipe.motif === "street") {
    const vanishX = originX + side * span * 0.08;
    const vanishY = height * 0.37;
    softStroke(context, () => {
      context.moveTo(vanishX, vanishY);
      context.lineTo(originX - span * 0.72, ground + 92);
      context.moveTo(vanishX, vanishY);
      context.lineTo(originX + span * 0.72, ground + 92);
      context.moveTo(vanishX - span * 0.18, vanishY + 8);
      context.lineTo(originX - span * 0.9, ground + 46);
      context.moveTo(vanishX + span * 0.18, vanishY + 8);
      context.lineTo(originX + span * 0.9, ground + 46);
    }, palette.ink, 0.75, random);
    for (let stripe = 0; stripe < 6; stripe += 1) {
      const y = vanishY + 38 + stripe * 23;
      const half = 18 + stripe * 13;
      softStroke(context, () => {
        context.moveTo(vanishX - half, y);
        context.lineTo(vanishX + half, y);
      }, palette.ink, 0.48, random);
    }
  } else if (recipe.motif === "phone") {
    const phoneWidth = 112;
    const phoneHeight = 214;
    const left = originX - phoneWidth / 2;
    const top = height * 0.2;
    paintWash(context, originX, top + phoneHeight * 0.48, 105, 145, palette.wash, 0.07);
    softStroke(context, () => {
      roundedRectPath(context, left, top, phoneWidth, phoneHeight, 18);
      context.moveTo(originX - 18, top + 15);
      context.lineTo(originX + 18, top + 15);
      context.moveTo(originX - 14, top + phoneHeight - 14);
      context.lineTo(originX + 14, top + phoneHeight - 14);
    }, palette.ink, 0.85, random);
    for (let glow = 0; glow < 3; glow += 1) {
      paintWash(context, originX + (random() - 0.5) * 30, top + 58 + glow * 46, 46, 19, palette.accent, 0.045);
    }
  } else if (recipe.motif === "laundry") {
    const lineY = height * 0.31;
    softStroke(context, () => {
      context.moveTo(originX - span * 0.68, lineY);
      context.quadraticCurveTo(originX, lineY + 32, originX + span * 0.68, lineY);
    }, palette.ink, 0.75, random);
    for (let item = 0; item < 4; item += 1) {
      const x = originX - span * 0.42 + item * span * 0.28;
      const y = lineY + 18 + item % 2 * 6;
      const itemWidth = 46 + random() * 24;
      const itemHeight = 74 + random() * 42;
      paintWash(context, x, y + itemHeight * 0.48, itemWidth, itemHeight * 0.7, item % 2 ? palette.accent : palette.wash, 0.05);
      softStroke(context, () => {
        context.moveTo(x - itemWidth / 2, y);
        context.lineTo(x - itemWidth * 0.62, y + 24);
        context.lineTo(x - itemWidth * 0.4, y + 32);
        context.lineTo(x - itemWidth * 0.34, y + itemHeight);
        context.lineTo(x + itemWidth * 0.34, y + itemHeight);
        context.lineTo(x + itemWidth * 0.4, y + 32);
        context.lineTo(x + itemWidth * 0.62, y + 24);
        context.lineTo(x + itemWidth / 2, y);
      }, palette.ink, 0.55, random);
    }
  } else if (recipe.motif === "bicycle") {
    const wheelY = ground + 8;
    const wheelRadius = Math.min(62, span * 0.15);
    const leftWheel = originX - wheelRadius * 1.35;
    const rightWheel = originX + wheelRadius * 1.35;
    paintWash(context, originX, wheelY - 30, span * 0.5, 110, palette.wash, 0.045);
    softStroke(context, () => {
      context.arc(leftWheel, wheelY, wheelRadius, 0, Math.PI * 2);
      context.moveTo(rightWheel + wheelRadius, wheelY);
      context.arc(rightWheel, wheelY, wheelRadius, 0, Math.PI * 2);
      const crankX = originX - 8;
      const crankY = wheelY - 8;
      context.moveTo(leftWheel, wheelY);
      context.lineTo(crankX, crankY);
      context.lineTo(rightWheel, wheelY);
      context.lineTo(originX + 24, wheelY - 78);
      context.lineTo(crankX, crankY);
      context.lineTo(originX - 34, wheelY - 82);
      context.moveTo(originX + 24, wheelY - 78);
      context.lineTo(originX + 54, wheelY - 91);
    }, palette.ink, 0.75, random);
  } else if (recipe.motif === "mountains") {
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
  } else if (recipe.accent === "lamp") {
    paintWash(context, x + side * 8, y + 14, 46, 38, palette.accent, 0.11);
    softStroke(context, () => {
      context.moveTo(x - side * 44, y + 92);
      context.quadraticCurveTo(x - side * 34, y + 12, x, y + 8);
      context.lineTo(x + side * 24, y + 24);
      context.lineTo(x - side * 10, y + 29);
      context.closePath();
    }, palette.ink, 0.75, random);
  } else if (recipe.accent === "cup") {
    paintWash(context, x, y + 20, 34, 30, palette.accent, 0.1);
    softStroke(context, () => {
      context.ellipse(x, y + 8, 18, 6, 0, 0, Math.PI * 2);
      context.moveTo(x - 17, y + 9);
      context.lineTo(x - 13, y + 35);
      context.quadraticCurveTo(x, y + 43, x + 13, y + 35);
      context.lineTo(x + 17, y + 9);
      context.moveTo(x + 16, y + 16);
      context.quadraticCurveTo(x + 34, y + 15, x + 27, y + 30);
      context.moveTo(x - 7, y - 2);
      context.quadraticCurveTo(x - 15, y - 14, x - 4, y - 24);
      context.moveTo(x + 5, y - 1);
      context.quadraticCurveTo(x - 2, y - 12, x + 9, y - 22);
    }, palette.ink, 0.6, random);
  } else if (recipe.accent === "umbrella") {
    paintWash(context, x, y + 8, 58, 34, palette.accent, 0.08);
    softStroke(context, () => {
      context.arc(x, y + 26, 43, Math.PI, Math.PI * 2);
      context.moveTo(x, y - 17);
      context.lineTo(x, y + 71);
      context.quadraticCurveTo(x, y + 87, x + side * 14, y + 79);
    }, palette.ink, 0.7, random);
  } else if (recipe.accent === "plant") {
    softStroke(context, () => {
      context.moveTo(x, y + 72);
      context.quadraticCurveTo(x - side * 8, y + 34, x + side * 2, y - 8);
      context.moveTo(x - 20, y + 72);
      context.lineTo(x + 20, y + 72);
      context.lineTo(x + 14, y + 94);
      context.lineTo(x - 14, y + 94);
      context.closePath();
    }, palette.ink, 0.65, random);
    for (let leaf = 0; leaf < 7; leaf += 1) {
      const leafY = y + 8 + leaf * 8;
      paintWash(context, x + (leaf % 2 ? -1 : 1) * (12 + random() * 12), leafY, 18, 9, palette.wash, 0.1);
    }
  } else if (recipe.accent === "cat") {
    paintWash(context, x, y + 46, 42, 58, palette.wash, 0.06);
    softStroke(context, () => {
      context.moveTo(x - 17, y + 31);
      context.lineTo(x - 12, y + 8);
      context.lineTo(x, y + 20);
      context.lineTo(x + 13, y + 7);
      context.lineTo(x + 18, y + 31);
      context.bezierCurveTo(x + 31, y + 62, x + 20, y + 91, x, y + 96);
      context.bezierCurveTo(x - 24, y + 88, x - 31, y + 58, x - 17, y + 31);
      context.moveTo(x + 14, y + 82);
      context.quadraticCurveTo(x + side * 45, y + 76, x + side * 36, y + 53);
    }, palette.ink, 0.7, random);
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
