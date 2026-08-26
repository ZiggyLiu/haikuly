"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import InkWashIllustration from "../ink-wash";
import type { IllustrationRecipe } from "../haiku";

type FontOption = {
  id: string;
  name: string;
  detail: string;
  family: string;
};

type SampleOption = {
  id: string;
  label: string;
  lines: [string, string, string];
};

const FONT_OPTIONS: FontOption[] = [
  {
    id: "douyin",
    name: "Douyin Sans",
    detail: "当前使用",
    family: '"DouyinSans", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  {
    id: "pingfang",
    name: "苹方 PingFang SC",
    detail: "现代 · 清晰",
    family: '"PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: "songti",
    name: "宋体 Songti SC",
    detail: "书卷 · 细衬线",
    family: '"Songti SC", "STSong", "SimSun", serif',
  },
  {
    id: "kaiti",
    name: "楷体 Kaiti SC",
    detail: "手写 · 有温度",
    family: '"Kaiti SC", "STKaiti", "KaiTi", serif',
  },
  {
    id: "heiti",
    name: "黑体 Heiti SC",
    detail: "端正 · 有分量",
    family: '"Heiti SC", "STHeiti", "SimHei", sans-serif',
  },
  {
    id: "noto-serif",
    name: "Noto Serif CJK",
    detail: "雅致 · 衬线",
    family: '"Noto Serif CJK SC", "Noto Serif SC", "Source Han Serif SC", serif',
  },
  {
    id: "system",
    name: "系统无衬线",
    detail: "设备默认",
    family: 'system-ui, -apple-system, "PingFang SC", sans-serif',
  },
  {
    id: "noto-sans",
    name: "Noto Sans CJK",
    detail: "中性 · 开放",
    family: '"Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  },
  {
    id: "source-han-serif",
    name: "思源宋体",
    detail: "古典 · 稳定",
    family: '"Source Han Serif SC", "Noto Serif CJK SC", serif',
  },
  {
    id: "lxgw-wenkai",
    name: "霞鹜文楷",
    detail: "人文 · 松弛",
    family: '"LXGW WenKai", "霞鹜文楷", serif',
  },
  {
    id: "harmonyos",
    name: "HarmonyOS Sans SC",
    detail: "轻盈 · 现代",
    family: '"HarmonyOS Sans SC", "HarmonyOS Sans", sans-serif',
  },
  {
    id: "misans",
    name: "MiSans",
    detail: "简洁 · 中性",
    family: '"MiSans", "MiSans Latin", sans-serif',
  },
  {
    id: "alibaba-puhuiti",
    name: "阿里巴巴普惠体",
    detail: "友好 · 饱满",
    family: '"Alibaba PuHuiTi", "Alibaba PuHuiTi 2.0", sans-serif',
  },
  {
    id: "oppo-sans",
    name: "OPPO Sans",
    detail: "简约 · 亲和",
    family: '"OPPO Sans", "OPPO Sans 4.0", sans-serif',
  },
  {
    id: "yuanti",
    name: "圆体 Yuanti",
    detail: "圆润 · 轻快",
    family: '"Yuanti SC", "STYuanti", "幼圆", sans-serif',
  },
  {
    id: "fangsong",
    name: "仿宋 Fangsong",
    detail: "清瘦 · 书写",
    family: '"Fangsong", "STFangsong", "仿宋", serif',
  },
  {
    id: "hannotate",
    name: "手札 Hannotate",
    detail: "随笔 · 手感",
    family: '"Hannotate SC", "Hannotate", "手札", cursive',
  },
  {
    id: "xinwei",
    name: "新魏 Xinwei",
    detail: "标题 · 个性",
    family: '"STXinwei", "Xinwei", "华文新魏", cursive',
  },
];

const SAMPLE_OPTIONS: SampleOption[] = [
  {
    id: "station",
    label: "雨后站台",
    lines: ["雨停在站台边", "一盏灯把影子拉长", "晚风替我等"],
  },
  {
    id: "window",
    label: "春日窗边",
    lines: ["春风经过窗前", "把未写完的信吹开", "花影落在纸上"],
  },
  {
    id: "city",
    label: "城市夜行",
    lines: ["末班车驶过街角", "手机亮了一下又暗", "月色没有说话"],
  },
];

const RECIPES: IllustrationRecipe[] = [
  { motif: "rain", accent: "umbrella", tone: "blue-gray", placement: "right" },
  { motif: "window", accent: "blossoms", tone: "sage", placement: "left" },
  { motif: "street", accent: "moon", tone: "plum-gray", placement: "right" },
];

function fontStyle(font: FontOption, size: number, lineHeight: number): CSSProperties {
  return {
    fontFamily: font.family,
    fontSize: `${size}px`,
    lineHeight,
  };
}

function customFontOption(name: string): FontOption {
  const safeName = name.trim().replace(/["';]/g, "");
  return {
    id: "custom",
    name: safeName || "自定义字体",
    detail: "设备字体",
    family: safeName
      ? `"${safeName}", "PingFang SC", sans-serif`
      : '"PingFang SC", sans-serif',
  };
}

export default function FontTesterPage() {
  const [selectedFontId, setSelectedFontId] = useState("hannotate");
  const [customFontName, setCustomFontName] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState("station");
  const [fontSize, setFontSize] = useState(30);
  const [lineHeight, setLineHeight] = useState(1.55);
  const [washOpacity, setWashOpacity] = useState(0.82);

  const selectedFont = selectedFontId === "custom"
    ? customFontOption(customFontName)
    : FONT_OPTIONS.find((font) => font.id === selectedFontId) ?? FONT_OPTIONS[0];
  const candidateFonts = customFontName.trim()
    ? [...FONT_OPTIONS, customFontOption(customFontName)]
    : FONT_OPTIONS;
  const selectedSampleIndex = SAMPLE_OPTIONS.findIndex((sample) => sample.id === selectedSampleId);
  const selectedSample = SAMPLE_OPTIONS[selectedSampleIndex] ?? SAMPLE_OPTIONS[0];
  const recipe = RECIPES[selectedSampleIndex >= 0 ? selectedSampleIndex : 0];

  useEffect(() => {
    document.title = "Chinese Font Tester · Haiku-ly";
    document.documentElement.lang = "zh-CN";
  }, []);

  const previewStyle = useMemo(
    () => fontStyle(selectedFont, fontSize, lineHeight),
    [selectedFont, fontSize, lineHeight],
  );

  return (
    <main className="page-shell font-tester-shell" id="font-tester">
      <header className="site-header font-tester-header">
        <Link className="brand" href="/" aria-label="返回 Haiku-ly 首页">
          <span className="brand-mark" aria-hidden="true">間</span>
          <span>Haiku-ly</span>
        </Link>
        <span className="header-note">Chinese type lab</span>
      </header>

      <section className="font-tester-hero">
        <p className="eyebrow">中文字体试验场</p>
        <h1>找到适合这三行诗的字</h1>
        <p>
          在真实的 Haiku-ly 水墨卡片里比较字形、留白、行距和笔画重量。
          选好之后，再把决定带回正式页面。
        </p>
      </section>

      <section className="font-tester-layout" aria-label="中文字体比较工具">
        <div className="font-tester-controls">
          <div className="font-tester-control-heading">
            <div>
              <p className="font-tester-kicker">Quick comparison</p>
              <h2>先调感觉，再看细节</h2>
            </div>
            <span className="font-tester-current">当前：{selectedFont.name}</span>
          </div>

          <fieldset className="font-tester-fieldset">
            <legend>测试文本</legend>
            <div className="font-tester-sample-switch" role="group" aria-label="测试文本">
              {SAMPLE_OPTIONS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={selectedSampleId === sample.id ? "active" : ""}
                  aria-pressed={selectedSampleId === sample.id}
                  onClick={() => setSelectedSampleId(sample.id)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="font-tester-custom-field">
            <span>输入已安装的字体名称 <small>例如：LXGW WenKai</small></span>
            <div className="font-tester-custom-input">
              <input
                type="text"
                value={customFontName}
                placeholder="输入字体 family name"
                spellCheck={false}
                onChange={(event) => {
                  setCustomFontName(event.target.value);
                  if (event.target.value.trim()) setSelectedFontId("custom");
                }}
              />
              {customFontName && (
                <button
                  type="button"
                  aria-label="清除自定义字体"
                  onClick={() => {
                    setCustomFontName("");
                    setSelectedFontId("hannotate");
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </label>

          <div className="font-tester-slider-grid">
            <label>
              <span>字大小 <output>{fontSize}px</output></span>
              <input type="range" min="22" max="44" step="1" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
            </label>
            <label>
              <span>行距 <output>{lineHeight.toFixed(2)}</output></span>
              <input type="range" min="1.2" max="2" step="0.05" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} />
            </label>
            <label>
              <span>水墨浓度 <output>{Math.round(washOpacity * 100)}%</output></span>
              <input type="range" min="0.35" max="1" step="0.01" value={washOpacity} onChange={(event) => setWashOpacity(Number(event.target.value))} />
            </label>
          </div>

          <p className="font-tester-tip">
            小屏幕上也看一下：中文字体在窄卡片里最容易暴露行距和重心的问题。系统字体会按当前设备的可用情况回退。
          </p>
        </div>

        <div className="font-tester-preview-column">
          <div className="font-tester-preview-label">
            <span>Live card preview</span>
            <span>{selectedSample.label} · {recipe.motif}</span>
          </div>
          <div className="font-tester-card" style={{ "--tester-wash-opacity": washOpacity } as CSSProperties}>
            <InkWashIllustration recipe={recipe} seed={420 + selectedSampleIndex} />
            <span className="font-tester-date">2026年8月25日</span>
            <div className="font-tester-seal" aria-hidden="true">間</div>
            <div className="font-tester-preview-lines" style={previewStyle} lang="zh-CN">
              {selectedSample.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className="font-tester-card-footer">
              <span>三行 · 现代短俳</span>
              <span>haikuly.fyi</span>
            </div>
          </div>
          <p className="font-tester-preview-note">这张卡片使用正式页面同一套水墨画布、纸张纹理和文字阴影。</p>
        </div>
      </section>

      <section className="font-tester-candidates" aria-labelledby="font-candidates-title">
        <div className="font-tester-section-heading">
          <div>
            <p className="font-tester-kicker">Candidate shelf</p>
            <h2 id="font-candidates-title">点击任意一张，放大检查</h2>
          </div>
          <span>{candidateFonts.length} 个候选字体{customFontName.trim() ? " · 含自定义" : ""}</span>
        </div>
        <div className="font-tester-grid">
          {candidateFonts.map((font) => (
            <button
              key={font.id}
              type="button"
              className={`font-tester-sample${selectedFontId === font.id ? " active" : ""}`}
              onClick={() => setSelectedFontId(font.id)}
              aria-pressed={selectedFontId === font.id}
            >
              <span className="font-tester-sample-meta">
                <strong>{font.name}</strong>
                <small>{font.detail}</small>
              </span>
              <span className="font-tester-sample-lines" style={fontStyle(font, 23, 1.48)} lang="zh-CN">
                {selectedSample.lines.map((line) => <span key={line}>{line}</span>)}
              </span>
              <span className="font-tester-sample-mark" aria-hidden="true">{selectedFontId === font.id ? "选中" : "选择"} ↗</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="font-tester-footer">
        <p>字体先服务于诗，再服务于风格。</p>
        <Link href="/">返回 Haiku-ly ↗</Link>
      </footer>
    </main>
  );
}
