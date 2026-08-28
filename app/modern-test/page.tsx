"use client";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import {
  countPoeticUnits,
  haikuDateLabel,
  haikuImageFilename,
  poemLinesClassName,
  type Haiku,
  type Language,
  type Mode,
} from "../haiku";
import InkWashIllustration from "../ink-wash";
import {
  DEFAULT_POEM_STYLES,
  POEM_FONT_OPTIONS,
  POEM_STYLE_STORAGE_KEY,
  poemFont,
  readPoemStyles,
  type PoemStyle,
} from "../poem-style";

type HaikuForm = "traditional" | "modern";

const UI_COPY: Record<Language, {
  languageLabel: string;
  languageRule: string;
  languageGroup: string;
  formGroup: string;
  traditionalForm: string;
  modernForm: string;
  modeGroup: string;
  randomMode: string;
  keywordMode: string;
  keywordPrompt: string;
  keywordPlaceholder: string;
  keywordError: string;
  emptyPoem: string;
  save: string;
  saved: string;
  saveAria: string;
  saveError: string;
  generateRandom: string;
  generateKeyword: string;
  generating: string;
  generationError: string;
  unreachableError: string;
  haikulyThis: string;
  copyLine: string;
  copiedLine: string;
  copyLineError: string;
  lineMenuLabel: string;
  edit: string;
  done: string;
  revert: string;
  editLineAriaStart: string;
  editLineAriaEnd: string;
  humanEdited: string;
  pageTitle: string;
  homeAria: string;
  emailAria: string;
  eyebrow: string;
  heroTitle: string;
  heroAccent: string;
  intro: string;
  paperRule: string;
  subscriptionTitle: string;
  subscriptionIntro: string;
  subscriptionEmailLabel: string;
  subscriptionPlaceholder: string;
  subscriptionTimezoneLabel: string;
  subscriptionTimezoneHelp: string;
  subscriptionButton: string;
  subscriptionSending: string;
  subscriptionPrivacy: string;
  subscriptionError: string;
  styleHeading: string;
  fontLabel: string;
  fontSizeLabel: string;
  lineSpacingLabel: string;
  artIntensityLabel: string;
  styleHelp: string;
  resetStyle: string;
}> = {
  en: {
    languageLabel: "Poem language",
    languageRule: "Three lines · modern voice",
    languageGroup: "Poem language",
    formGroup: "Haiku form",
    traditionalForm: "5-7-5",
    modernForm: "Modern Haiku",
    modeGroup: "Generation mode",
    randomMode: "By chance",
    keywordMode: "From a word",
    keywordPrompt: "What is on your mind?",
    keywordPlaceholder: "late train, low battery, home…",
    keywordError: "Enter a word or short phrase first.",
    emptyPoem: "Your next small moment will appear here.",
    save: "Save Haiku",
    saved: "Saved",
    saveAria: "Save haiku as a picture",
    saveError: "The haiku image could not be saved. Please try again.",
    generateRandom: "Write a modern haiku",
    generateKeyword: "Write my modern haiku",
    generating: "Writing, reviewing, and painting…",
    generationError: "DeepSeek could not write a modern short haiku. Please try again.",
    unreachableError: "DeepSeek could not be reached. Please try again.",
    haikulyThis: "Haikuly this!",
    copyLine: "Copy",
    copiedLine: "Copied",
    copyLineError: "Could not copy this line. Please try again.",
    lineMenuLabel: "Line actions",
    edit: "Edit",
    done: "Done",
    revert: "Revert",
    editLineAriaStart: "Edit line",
    editLineAriaEnd: "",
    humanEdited: "Human-edited",
    pageTitle: "Spring Whispers, Haiku-ly~",
    homeAria: "Haiku-ly home",
    emailAria: "Email Haiku-ly at zhiguoinusa@gmail.com",
    eyebrow: "Make room for a small moment",
    heroTitle: "Spring Whispers,",
    heroAccent: "Haiku-ly~",
    intro: "Find a modern three-line poem and its quiet ink-wash world by chance, or begin with a word already on your mind.",
    paperRule: "Three lines · modern haiku",
    subscriptionTitle: "A haiku in your inbox",
    subscriptionIntro: "Receive one quiet, three-line poem each day.",
    subscriptionEmailLabel: "Email address",
    subscriptionPlaceholder: "you@example.com",
    subscriptionTimezoneLabel: "Delivery timezone",
    subscriptionTimezoneHelp: "Your haiku arrives around 8:00 AM in this timezone. Submit the same email again to change it later.",
    subscriptionButton: "Send confirmation",
    subscriptionSending: "Sending…",
    subscriptionPrivacy: "Confirmation is required. We store your timezone, not your IP address or precise location. Your email is encrypted, never sold, and you can unsubscribe in one click.",
    subscriptionError: "The subscription could not be started. Please try again.",
    styleHeading: "Poem style",
    fontLabel: "Typeface",
    fontSizeLabel: "Text size",
    lineSpacingLabel: "Line spacing",
    artIntensityLabel: "Painting intensity",
    styleHelp: "Style choices are saved on this device. A typeface can use its closest fallback when it is not installed.",
    resetStyle: "Reset style",
  },
  zh: {
    languageLabel: "诗歌语言",
    languageRule: "三行 · 当代中文",
    languageGroup: "诗歌语言",
    formGroup: "俳句形式",
    traditionalForm: "五七五俳句",
    modernForm: "现代短俳",
    modeGroup: "生成方式",
    randomMode: "随机生成",
    keywordMode: "关键词生成",
    keywordPrompt: "此刻你在想什么？",
    keywordPlaceholder: "下班，雨夜，已读不回…",
    keywordError: "请先输入一个词或短语。",
    emptyPoem: "下一刻诗意将在此浮现。",
    save: "保存俳句",
    saved: "已保存",
    saveAria: "将俳句保存为图片",
    saveError: "无法保存短俳图片，请重试。",
    generateRandom: "写一首现代短俳",
    generateKeyword: "写我的现代短俳",
    generating: "正在创作、审校与绘制…",
    generationError: "DeepSeek 暂时无法创作现代短俳，请重试。",
    unreachableError: "暂时无法连接 DeepSeek，请重试。",
    haikulyThis: "以此句再作一首",
    copyLine: "复制",
    copiedLine: "已复制",
    copyLineError: "无法复制这一句，请重试。",
    lineMenuLabel: "这一句的操作",
    edit: "编辑",
    done: "完成",
    revert: "还原",
    editLineAriaStart: "编辑第",
    editLineAriaEnd: "行",
    humanEdited: "人工编辑",
    pageTitle: "春风十里，Haiku-ly~",
    homeAria: "返回 Haiku-ly 首页",
    emailAria: "发送邮件至 zhiguoinusa@gmail.com 联系 Haiku-ly",
    eyebrow: "给一个小小的瞬间留点位置",
    heroTitle: "春风十里，",
    heroAccent: "Haiku-ly~",
    intro: "随机发现一首现代短俳和它的水墨世界，或从此刻萦绕心头的一个词开始。",
    paperRule: "三行 · 现代短俳",
    subscriptionTitle: "每日一首，寄到邮箱",
    subscriptionIntro: "每天收到一首安静的三行短俳。",
    subscriptionEmailLabel: "邮箱地址",
    subscriptionPlaceholder: "you@example.com",
    subscriptionTimezoneLabel: "投递时区",
    subscriptionTimezoneHelp: "俳句将在此时区每天上午 8 点左右送达。之后可用同一邮箱再次提交来更改。",
    subscriptionButton: "发送确认邮件",
    subscriptionSending: "正在发送…",
    subscriptionPrivacy: "需要邮件确认。我们只保存时区，不保存 IP 地址或精确位置。邮箱将加密保存，绝不出售，并可一键取消订阅。",
    subscriptionError: "暂时无法开始订阅，请重试。",
    styleHeading: "俳句样式",
    fontLabel: "字体",
    fontSizeLabel: "字号",
    lineSpacingLabel: "行距",
    artIntensityLabel: "水墨浓度",
    styleHelp: "样式会保存在此设备上。若设备未安装所选字体，将自动使用最接近的字体。",
    resetStyle: "重置样式",
  },
  ja: {
    languageLabel: "詩の言語",
    languageRule: "三行 · 現代語",
    languageGroup: "詩の言語",
    formGroup: "俳句の形式",
    traditionalForm: "五・七・五",
    modernForm: "現代短俳",
    modeGroup: "作句方法",
    randomMode: "おまかせ",
    keywordMode: "言葉から",
    keywordPrompt: "今、心にあるものは？",
    keywordPlaceholder: "終電、通知、雨の夜…",
    keywordError: "言葉または短いフレーズを入力してください。",
    emptyPoem: "次の小さな瞬間がここに現れます。",
    save: "俳句を保存",
    saved: "保存しました",
    saveAria: "俳句を画像として保存",
    saveError: "短俳の画像を保存できませんでした。もう一度お試しください。",
    generateRandom: "現代短俳を詠む",
    generateKeyword: "私の現代短俳を詠む",
    generating: "作句・推敲・描画中…",
    generationError: "DeepSeekが現代短俳を作れませんでした。もう一度お試しください。",
    unreachableError: "DeepSeekに接続できませんでした。もう一度お試しください。",
    haikulyThis: "この句で詠む",
    copyLine: "コピー",
    copiedLine: "コピーしました",
    copyLineError: "この句をコピーできませんでした。もう一度お試しください。",
    lineMenuLabel: "句の操作",
    edit: "編集",
    done: "完了",
    revert: "元に戻す",
    editLineAriaStart: "",
    editLineAriaEnd: "行目を編集",
    humanEdited: "人間編集",
    pageTitle: "春のささやき、Haiku-ly~",
    homeAria: "Haiku-ly ホームへ戻る",
    emailAria: "zhiguoinusa@gmail.com にメールで Haiku-ly へ連絡",
    eyebrow: "小さな瞬間のために余白を",
    heroTitle: "今この時を、",
    heroAccent: "Haiku-ly~",
    intro: "おまかせで現代の三行詩と静かな水墨の世界を見つけるか、心にある一つの言葉から始めましょう。",
    paperRule: "三行 · 現代短俳",
    subscriptionTitle: "毎日一篇をメールで",
    subscriptionIntro: "静かな三行の俳句を、毎日一通お届けします。",
    subscriptionEmailLabel: "メールアドレス",
    subscriptionPlaceholder: "you@example.com",
    subscriptionTimezoneLabel: "配信タイムゾーン",
    subscriptionTimezoneHelp: "このタイムゾーンの午前8時ごろに届きます。後から同じメールアドレスで変更できます。",
    subscriptionButton: "確認メールを送る",
    subscriptionSending: "送信中…",
    subscriptionPrivacy: "メール確認が必要です。保存する位置情報はタイムゾーンのみで、IPアドレスや正確な位置は保存しません。アドレスは暗号化され、ワンクリックで解除できます。",
    subscriptionError: "購読を開始できませんでした。もう一度お試しください。",
    styleHeading: "俳句のスタイル",
    fontLabel: "書体",
    fontSizeLabel: "文字サイズ",
    lineSpacingLabel: "行間",
    artIntensityLabel: "水墨の濃さ",
    styleHelp: "スタイルはこの端末に保存されます。書体がない場合は近い書体で表示します。",
    resetStyle: "スタイルをリセット",
  },
};

const STRICT_FORM_COPY: Record<Language, {
  languageRule: string;
  generateRandom: string;
  generateKeyword: string;
  generationError: string;
  intro: string;
  paperRule: string;
}> = {
  en: {
    languageRule: "5 · 7 · 5 syllables",
    generateRandom: "Write a 5-7-5 haiku",
    generateKeyword: "Write my 5-7-5 haiku",
    generationError: "DeepSeek could not write a coherent 5-7-5 haiku. Please try again.",
    intro: "Find a strict 5-7-5 haiku and its quiet watercolor world by chance, or begin with a word already on your mind.",
    paperRule: "5 · 7 · 5 syllables",
  },
  zh: {
    languageRule: "五 · 七 · 五字",
    generateRandom: "写一首五七五俳句",
    generateKeyword: "写我的五七五俳句",
    generationError: "DeepSeek 暂时无法创作合规的五七五俳句，请重试。",
    intro: "随机发现一首严格遵循五七五字数的俳句和它的水彩世界，或从此刻萦绕心头的一个词开始。",
    paperRule: "五 · 七 · 五字",
  },
  ja: {
    languageRule: "五 · 七 · 五音",
    generateRandom: "五・七・五を詠む",
    generateKeyword: "私の五・七・五を詠む",
    generationError: "DeepSeekが五・七・五の俳句を作れませんでした。もう一度お試しください。",
    intro: "五・七・五を守る俳句と静かな水彩の世界をおまかせで見つけるか、心にある一つの言葉から始めましょう。",
    paperRule: "五 · 七 · 五音",
  },
};

function languageTag(language: Language) {
  if (language === "zh") return "zh-CN";
  return language;
}

type DisplayedHaiku = {
  haiku: Haiku;
  language: Language;
  form: HaikuForm;
};

function setCanvasFont(context: CanvasRenderingContext2D, style: CSSStyleDeclaration) {
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  context.fillStyle = style.color;
  context.textAlign = "left";
  context.textBaseline = "top";
}

function elementPosition(element: Element, paperBounds: DOMRect) {
  const bounds = element.getBoundingClientRect();
  return { x: bounds.left - paperBounds.left, y: bounds.top - paperBounds.top };
}

function editableLineUnitCount(line: string, language: Language, form: HaikuForm) {
  if (form === "traditional") return countPoeticUnits(line, language);
  if (language === "en") return line.trim().split(/\s+/).filter(Boolean).length;
  return Array.from(line.replace(/[\p{P}\p{S}\s]/gu, "")).length;
}

function pngFileFromCanvas(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL("image/png");
  const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return {
    dataUrl,
    file: new File([bytes], filename, { type: "image/png", lastModified: Date.now() }),
  };
}

export default function ModernShortHaikuTest() {
  const [mode, setMode] = useState<Mode>("random");
  const [language, setLanguage] = useState<Language>("en");
  const [haikuForm, setHaikuForm] = useState<HaikuForm>("modern");
  const [poemStyles, setPoemStyles] = useState<Record<Language, PoemStyle>>(() => readPoemStyles(DEFAULT_POEM_STYLES));
  const [poemStyleHydrated, setPoemStyleHydrated] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [displayed, setDisplayed] = useState<DisplayedHaiku | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [openMenuLine, setOpenMenuLine] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [copiedLine, setCopiedLine] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayLines, setDisplayLines] = useState<string[] | null>(null);
  const [subscriptionEmail, setSubscriptionEmail] = useState("");
  const [subscriptionTimezone, setSubscriptionTimezone] = useState("UTC");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSucceeded, setSubscriptionSucceeded] = useState(false);
  const poemPaperRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const recentLinesRef = useRef<Record<Language, string[]>>({ en: [], zh: [], ja: [] });
  const haiku = displayed?.haiku ?? null;
  const lines = displayLines ?? haiku?.lines ?? null;
  const displayedForm = displayed?.form ?? haikuForm;
  const displayedLanguage = displayed?.language ?? language;
  const poemStyle = poemStyles[displayedLanguage];
  const selectedPoemFont = poemFont(displayedLanguage, poemStyle.fontId);
  const isEdited = haiku !== null && lines !== null &&
    lines.some((line, index) => line !== haiku.lines[index]);
  const expectedCounts = [5, 7, 5];
  const counts = lines?.map((line) => editableLineUnitCount(line, displayedLanguage, displayedForm)) ?? null;
  const copy = UI_COPY[language];
  const formCopy = haikuForm === "modern" ? copy : STRICT_FORM_COPY[language];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) setSubscriptionTimezone(detected);
      } catch {
        // UTC remains the privacy-preserving fallback when the browser cannot report a timezone.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    const runtimeWindow = window as Window & {
      __STILLPOINT_FALLBACK_ACTIVE__?: boolean;
      __STILLPOINT_REACT_READY__?: boolean;
    };
    if (runtimeWindow.__STILLPOINT_FALLBACK_ACTIVE__) return;
    runtimeWindow.__STILLPOINT_REACT_READY__ = true;
    return () => {
      runtimeWindow.__STILLPOINT_REACT_READY__ = false;
    };
  }, []);

  useEffect(() => {
    document.title = UI_COPY[language].pageTitle;
    document.documentElement.lang = languageTag(language);
  }, [language]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedStyles = window.localStorage.getItem(POEM_STYLE_STORAGE_KEY);
        if (storedStyles) setPoemStyles(readPoemStyles(JSON.parse(storedStyles)));
      } catch {
        // Default styles remain available when storage is blocked or invalid.
      } finally {
        setPoemStyleHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!poemStyleHydrated) return;
    try {
      window.localStorage.setItem(POEM_STYLE_STORAGE_KEY, JSON.stringify(poemStyles));
    } catch {
      // Style changes still apply for this session when storage is unavailable.
    }
  }, [poemStyles, poemStyleHydrated]);

  function closeLineMenu() {
    setOpenMenuLine(null);
    setMenuPosition(null);
  }

  function openLineMenu(event: ReactMouseEvent, index: number) {
    event.stopPropagation();
    if (openMenuLine === index) {
      closeLineMenu();
      return;
    }
    const lineNode = lineRefs.current[index];
    const form = formRef.current;
    if (lineNode && form) {
      const lineRect = lineNode.getBoundingClientRect();
      const formRect = form.getBoundingClientRect();
      const left = Math.max(8, Math.min(lineRect.left - formRect.left, formRect.width - 190));
      setMenuPosition({ top: lineRect.bottom - formRect.top + 6, left });
    }
    setOpenMenuLine(index);
  }

  useEffect(() => {
    if (openMenuLine === null) return;
    const close = () => {
      setOpenMenuLine(null);
      setMenuPosition(null);
    };
    const onPointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Element | null;
      if (target && target.closest?.(".poem-line, .line-menu")) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onScroll = () => close();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [openMenuLine]);

  function copyLineText(index: number) {
    if (!haiku || !lines) return;
    const line = lines[index];
    const textarea = document.createElement("textarea");
    textarea.value = line;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(textarea);
    if (!ok) {
      setError(copy.copyLineError);
      return;
    }
    setCopiedLine(true);
    window.setTimeout(() => {
      setCopiedLine(false);
      closeLineMenu();
    }, 1200);
  }

  function haikulyThisLine(index: number) {
    if (!haiku || !lines) return;
    const line = lines[index];
    const haikuLanguage = displayed?.language ?? language;
    closeLineMenu();
    setMode("keyword");
    setKeyword(line);
    setLanguage(haikuLanguage);
    void generate(undefined, { mode: "keyword", language: haikuLanguage, keyword: line });
  }

  function toggleEdit() {
    if (!haiku) return;
    closeLineMenu();
    setIsEditing((editing) => !editing);
    setDisplayLines((current) => current ?? [...haiku.lines]);
  }

  function handleEditLine(index: number, text: string) {
    setDisplayLines((current) => {
      const base = current ?? haiku?.lines ?? [];
      if (base[index] === text) return current;
      const next = [...base];
      next[index] = text;
      return next;
    });
    setSaved(false);
  }

  function revertEdit() {
    if (!haiku) return;
    setDisplayLines([...haiku.lines]);
    setSaved(false);
  }

  async function generate(event?: FormEvent<HTMLFormElement>, overrides?: { mode?: Mode; language?: Language; keyword?: string }) {
    event?.preventDefault();
    const effectiveMode = overrides?.mode ?? mode;
    const effectiveLanguage = overrides?.language ?? language;
    const effectiveKeyword = overrides?.keyword ?? keyword;
    const effectiveCopy = UI_COPY[effectiveLanguage];
    const effectiveFormCopy = haikuForm === "modern" ? effectiveCopy : STRICT_FORM_COPY[effectiveLanguage];
    setSaved(false);
    if (effectiveMode === "keyword" && !effectiveKeyword.trim()) {
      setError(effectiveCopy.keywordError);
      return;
    }

    setIsGenerating(true);
    setError("");
    try {
      const isModernForm = haikuForm === "modern";
      const response = await fetch(isModernForm ? "/api/modern-haiku" : "/api/v23-haiku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: effectiveMode,
          language: effectiveLanguage,
          ...(isModernForm ? { recentLines: recentLinesRef.current[effectiveLanguage] } : {}),
          ...(effectiveMode === "keyword" ? { keyword: effectiveKeyword.trim() } : {}),
        }),
      });
      const result = (await response.json()) as { haiku?: Haiku; error?: string; language?: Language };
      if (!response.ok || !result.haiku) {
        setError(result.error ?? effectiveFormCopy.generationError);
        return;
      }
      if (isModernForm) {
        recentLinesRef.current[effectiveLanguage] = [
          ...result.haiku.lines,
          ...recentLinesRef.current[effectiveLanguage],
        ].slice(0, 15);
      }
      closeLineMenu();
      setDisplayLines([...result.haiku.lines]);
      setIsEditing(false);
      setDisplayed({ haiku: result.haiku, language: result.language ?? effectiveLanguage, form: haikuForm });
    } catch {
      setError(effectiveCopy.unreachableError);
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveHaiku() {
    closeLineMenu();
    const paper = poemPaperRef.current;
    if (!haiku || !paper) return;

    try {
      if ("fonts" in document) await document.fonts.ready;
      const paperBounds = paper.getBoundingClientRect();
      const width = Math.round(paperBounds.width);
      const height = Math.round(paperBounds.height);
      if (width <= 0 || height <= 0) throw new Error("The haiku card is not ready.");

      const scale = Math.min(3, 2048 / Math.max(width, height));
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.round(width * scale);
      exportCanvas.height = Math.round(height * scale);
      const context = exportCanvas.getContext("2d");
      if (!context) throw new Error("Image export is not available.");
      context.setTransform(scale, 0, 0, scale, 0, 0);

      context.fillStyle = "#f8f5ed";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(54, 83, 71, 0.025)";
      context.lineWidth = 1;
      for (let y = 30; y < height; y += 30) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      const illustration = paper.querySelector<HTMLCanvasElement>(".ink-wash-canvas");
      if (illustration && illustration.width > 0 && illustration.height > 0) {
        context.save();
        const illustrationOpacity = Number.parseFloat(window.getComputedStyle(illustration).opacity);
        context.globalAlpha = Number.isFinite(illustrationOpacity) ? illustrationOpacity : 0.82;
        context.drawImage(illustration, 0, 0, width, height);
        context.restore();
      }

      const readabilityWash = context.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.55,
      );
      readabilityWash.addColorStop(0, "rgba(248, 245, 237, 0.42)");
      readabilityWash.addColorStop(0.55, "rgba(248, 245, 237, 0.2)");
      readabilityWash.addColorStop(1, "rgba(248, 245, 237, 0)");
      context.fillStyle = readabilityWash;
      context.fillRect(0, 0, width, height);

      const seal = paper.querySelector<HTMLElement>(".sun-seal");
      if (seal) {
        const sealBounds = seal.getBoundingClientRect();
        const sealPosition = elementPosition(seal, paperBounds);
        const centerX = sealPosition.x + sealBounds.width / 2;
        const centerY = sealPosition.y + sealBounds.height / 2;
        context.strokeStyle = "rgba(201, 111, 76, 0.13)";
        context.fillStyle = "rgba(201, 111, 76, 0.04)";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(centerX, centerY, sealBounds.width / 2, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.beginPath();
        context.arc(centerX, centerY, sealBounds.width * 0.16, 0, Math.PI * 2);
        context.stroke();

        const sealLabel = seal.querySelector<HTMLElement>(".sun-seal-label");
        if (sealLabel) {
          const labelStyle = window.getComputedStyle(sealLabel);
          const lineHeight = Number.parseFloat(labelStyle.lineHeight) || 10;
          setCanvasFont(context, labelStyle);
          context.textAlign = "center";
          const labelLines = Array.from(sealLabel.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0)
            .map((node) => node.textContent ?? "");
          if (labelLines.length === 2) {
            context.fillText(labelLines[0].trim(), centerX, centerY - lineHeight);
            context.fillText(labelLines[1].trim(), centerX, centerY);
          } else {
            context.fillText(sealLabel.textContent?.trim() ?? "", centerX, centerY);
          }
        }
      }

      const date = paper.querySelector<HTMLElement>(".paper-date");
      if (date) {
        const position = elementPosition(date, paperBounds);
        setCanvasFont(context, window.getComputedStyle(date));
        context.fillText(date.textContent?.trim() ?? "", position.x, position.y);
      }

      const humanBadge = paper.querySelector<HTMLElement>(".human-edited-badge");
      if (humanBadge) {
        const badgePosition = elementPosition(humanBadge, paperBounds);
        setCanvasFont(context, window.getComputedStyle(humanBadge));
        context.fillText(humanBadge.textContent?.trim() ?? "", badgePosition.x, badgePosition.y);
      }

      paper.querySelectorAll<HTMLElement>(".poem-line p").forEach((line) => {
        const position = elementPosition(line, paperBounds);
        setCanvasFont(context, window.getComputedStyle(line));
        context.shadowColor = "rgba(248, 245, 237, 0.9)";
        context.shadowBlur = 12;
        context.shadowOffsetY = 1;
        context.fillText(line.textContent ?? "", position.x, position.y, width - position.x - 20);
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
      });

      const footer = paper.querySelector<HTMLElement>(".paper-footer");
      if (footer) {
        const footerPosition = elementPosition(footer, paperBounds);
        context.strokeStyle = "rgba(54, 83, 71, 0.17)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(footerPosition.x, footerPosition.y);
        context.lineTo(width - footerPosition.x, footerPosition.y);
        context.stroke();
        footer.querySelectorAll<HTMLElement>("span").forEach((label) => {
          const position = elementPosition(label, paperBounds);
          setCanvasFont(context, window.getComputedStyle(label));
          context.fillText(label.textContent ?? "", position.x, position.y);
        });
      }

      context.strokeStyle = "rgba(54, 83, 71, 0.13)";
      context.lineWidth = 1;
      context.strokeRect(0.5, 0.5, width - 1, height - 1);

      const filename = haikuImageFilename(haiku.createdAt);
      const image = pngFileFromCanvas(exportCanvas, filename);
      const shareData = { files: [image.file] };
      if (typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (shareError) {
          if (shareError instanceof DOMException && shareError.name === "AbortError") return;
        }
      }

      const link = document.createElement("a");
      link.href = image.dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError(copy.saveError);
    }
  }

  function changeMode(nextMode: Mode) {
    closeLineMenu();
    setMode(nextMode);
    setError("");
    setSaved(false);
  }

  function changeLanguage(nextLanguage: Language) {
    closeLineMenu();
    setLanguage(nextLanguage);
    setError("");
    setSaved(false);
  }

  function changeHaikuForm(nextForm: HaikuForm) {
    if (nextForm === haikuForm) return;
    closeLineMenu();
    setHaikuForm(nextForm);
    setDisplayed(null);
    setDisplayLines(null);
    setIsEditing(false);
    setError("");
    setSaved(false);
  }

  function updatePoemStyle(nextStyle: Partial<PoemStyle>) {
    setPoemStyles((current) => ({
      ...current,
      [displayedLanguage]: { ...current[displayedLanguage], ...nextStyle },
    }));
    setSaved(false);
  }

  function resetPoemStyle() {
    setPoemStyles((current) => ({
      ...current,
      [displayedLanguage]: { ...DEFAULT_POEM_STYLES[displayedLanguage] },
    }));
    setSaved(false);
  }

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubscribing) return;
    const submittedLanguage = language;
    const submittedCopy = UI_COPY[submittedLanguage];
    const formData = new FormData(event.currentTarget);
    setIsSubscribing(true);
    setSubscriptionMessage("");
    setSubscriptionSucceeded(false);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subscriptionEmail,
          language: submittedLanguage,
          timezone: subscriptionTimezone,
          website: formData.get("website") ?? "",
        }),
      });
      const result: unknown = await response.json();
      const message = result && typeof result === "object" && !Array.isArray(result) &&
        typeof (result as { message?: unknown }).message === "string"
        ? (result as { message: string }).message
        : submittedCopy.subscriptionError;
      setSubscriptionMessage(message);
      setSubscriptionSucceeded(response.ok);
      if (response.ok) setSubscriptionEmail("");
    } catch {
      setSubscriptionMessage(submittedCopy.subscriptionError);
      setSubscriptionSucceeded(false);
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <main className="page-shell" id="modern-short-haiku-app" data-version="26">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" id="brand-home" href="#modern-top" aria-label={copy.homeAria}>
          <span className="brand-mark" aria-hidden="true">間</span>
          <span>Haiku-ly</span>
        </a>
        <span className="header-note">A haiku studio</span>
      </header>

      <section className="hero" id="modern-top">
        <p className="eyebrow" id="modern-eyebrow">{copy.eyebrow}</p>
        <h1 lang={languageTag(language)}><span id="hero-title">{copy.heroTitle}</span><br /><em id="hero-accent">{copy.heroAccent}</em></h1>
        <p className="intro" id="modern-intro">{formCopy.intro}</p>
      </section>

      <section className="studio" aria-label={copy.pageTitle}>
        <div className="language-control">
          <span className="language-label">{copy.languageLabel}</span>
          <div className="language-switch" role="group" aria-label={copy.languageGroup}>
            <button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => changeLanguage("en")} data-language="en">English</button>
            <button type="button" className={language === "zh" ? "active" : ""} aria-pressed={language === "zh"} onClick={() => changeLanguage("zh")} lang="zh-CN" data-language="zh">中文</button>
            <button type="button" className={language === "ja" ? "active" : ""} aria-pressed={language === "ja"} onClick={() => changeLanguage("ja")} lang="ja" data-language="ja">日本語</button>
          </div>
          <span className="language-rule">{formCopy.languageRule}</span>
        </div>

        <div className="haiku-form-switch" role="group" aria-label={copy.formGroup}>
          <button
            type="button"
            className={haikuForm === "traditional" ? "active" : ""}
            aria-pressed={haikuForm === "traditional"}
            onClick={() => changeHaikuForm("traditional")}
            data-haiku-form="traditional"
          >
            {copy.traditionalForm}
          </button>
          <button
            type="button"
            className={haikuForm === "modern" ? "active" : ""}
            aria-pressed={haikuForm === "modern"}
            onClick={() => changeHaikuForm("modern")}
            data-haiku-form="modern"
          >
            {copy.modernForm}
          </button>
        </div>

        <div className="mode-switch" role="group" aria-label={copy.modeGroup}>
          <button type="button" className={mode === "random" ? "active" : ""} aria-pressed={mode === "random"} onClick={() => changeMode("random")} data-mode="random">
            <span aria-hidden="true">✦</span> {copy.randomMode}
          </button>
          <button type="button" className={mode === "keyword" ? "active" : ""} aria-pressed={mode === "keyword"} onClick={() => changeMode("keyword")} data-mode="keyword">
            <span aria-hidden="true">⌁</span> {copy.keywordMode}
          </button>
        </div>

        <form ref={formRef} onSubmit={generate} className="modern-generator-form">
          <div className="keyword-field" id="keyword-field" hidden={mode !== "keyword"}>
            <label htmlFor="keyword" id="keyword-label">{copy.keywordPrompt}</label>
            <div className="input-wrap">
              <input
                id="keyword"
                value={keyword}
                onChange={(event) => { setKeyword(event.target.value); setError(""); }}
                maxLength={48}
                placeholder={copy.keywordPlaceholder}
                autoComplete="off"
              />
              <span>{keyword.length}/48</span>
            </div>
          </div>

          <div
            ref={poemPaperRef}
            id="poem-paper"
            className={`poem-paper${haiku ? " has-illustration" : ""}${isEditing ? " is-editing" : ""}`}
            aria-live="polite"
            aria-atomic="true"
            style={{
              "--poem-font": selectedPoemFont.family,
              "--poem-font-size": `${poemStyle.fontSize}px`,
              "--poem-line-height": poemStyle.lineHeight,
              "--illustration-opacity": poemStyle.illustrationOpacity,
            } as CSSProperties}
          >
            {haiku && <InkWashIllustration recipe={haiku.illustration} seed={haiku.seed} />}
            {haiku ? (
              <time className="paper-number paper-date" id="paper-date" dateTime={haiku.createdAt}>{haikuDateLabel(haiku.createdAt, displayed?.language ?? language)}</time>
            ) : (
              <span className="paper-number paper-date" id="paper-date" aria-hidden="true">DATE —</span>
            )}
            {isEdited && (
              <span className="human-edited-badge" id="human-edited-badge">
                {UI_COPY[displayedLanguage].humanEdited}
              </span>
            )}
            <div className="sun-seal" aria-hidden="true"><span className="sun-seal-label">https://<br />haikuly.fyi</span></div>
            {haiku ? (
              <div className={poemLinesClassName(lines ?? [], displayedLanguage)} id="poem-lines" lang={languageTag(displayedLanguage)}>
                {lines?.map((line, index) => (
                  <div
                    className={`poem-line${isEditing ? " poem-line-editing" : ""}`}
                    key={`${haiku.seed}-${index}`}
                    ref={(node) => { lineRefs.current[index] = node; }}
                  >
                    {isEditing ? (
                      <>
                        <p
                          className="poem-line-input"
                          contentEditable
                          suppressContentEditableWarning
                          role="textbox"
                          aria-label={`${copy.editLineAriaStart} ${index + 1} ${copy.editLineAriaEnd}`.trim()}
                          onInput={(event) => handleEditLine(index, event.currentTarget.textContent ?? "")}
                          ref={(node) => {
                            if (node && node.textContent !== line) node.textContent = line;
                          }}
                        />
                        {counts !== null && (
                          <span
                            className={`poem-line-count${displayedForm === "traditional" && counts[index] !== expectedCounts[index] ? " mismatch" : ""}`}
                            aria-hidden="true"
                          >
                            {displayedForm === "traditional" ? `${counts[index]}/${expectedCounts[index]}` : counts[index]}
                          </span>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        className="poem-line-trigger"
                        onClick={(event) => openLineMenu(event, index)}
                        aria-haspopup="menu"
                        aria-expanded={openMenuLine === index}
                      >
                        <p>{line}</p>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="poem-lines poem-empty" id="poem-lines"><p id="empty-poem">{copy.emptyPoem}</p></div>
            )}
            <section className="poem-style-editor" id="haiku-edit-panel" hidden={!isEditing} aria-label={copy.styleHeading}>
              <div className="poem-style-heading">
                <strong id="poem-style-heading">{copy.styleHeading}</strong>
                <button type="button" id="reset-poem-style" onClick={resetPoemStyle}>{copy.resetStyle}</button>
              </div>
              <fieldset className="poem-font-fieldset">
                <legend id="poem-font-label">{copy.fontLabel}</legend>
                <div className="poem-font-switch" role="group" aria-labelledby="poem-font-label">
                  {POEM_FONT_OPTIONS[displayedLanguage].map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      className={poemStyle.fontId === font.id ? "active" : ""}
                      aria-pressed={poemStyle.fontId === font.id}
                      onClick={() => updatePoemStyle({ fontId: font.id })}
                      data-poem-font={font.id}
                      style={{ fontFamily: font.family }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="poem-style-slider-grid">
                <label>
                  <span><span id="poem-font-size-label">{copy.fontSizeLabel}</span> <output id="poem-font-size-output">{poemStyle.fontSize}px</output></span>
                  <input
                    type="range"
                    min="16"
                    max="44"
                    step="1"
                    value={poemStyle.fontSize}
                    data-poem-style="fontSize"
                    aria-labelledby="poem-font-size-label"
                    onChange={(event) => updatePoemStyle({ fontSize: Number(event.target.value) })}
                  />
                </label>
                <label>
                  <span><span id="poem-line-height-label">{copy.lineSpacingLabel}</span> <output id="poem-line-height-output">{poemStyle.lineHeight.toFixed(2)}</output></span>
                  <input
                    type="range"
                    min="1.1"
                    max="2"
                    step="0.05"
                    value={poemStyle.lineHeight}
                    data-poem-style="lineHeight"
                    aria-labelledby="poem-line-height-label"
                    onChange={(event) => updatePoemStyle({ lineHeight: Number(event.target.value) })}
                  />
                </label>
                <label>
                  <span><span id="poem-art-opacity-label">{copy.artIntensityLabel}</span> <output id="poem-art-opacity-output">{Math.round(poemStyle.illustrationOpacity * 100)}%</output></span>
                  <input
                    type="range"
                    min="0.35"
                    max="1"
                    step="0.01"
                    value={poemStyle.illustrationOpacity}
                    data-poem-style="illustrationOpacity"
                    aria-labelledby="poem-art-opacity-label"
                    onChange={(event) => updatePoemStyle({ illustrationOpacity: Number(event.target.value) })}
                  />
                </label>
              </div>
              <p className="poem-style-help" id="poem-style-help">{copy.styleHelp}</p>
            </section>
            <div className="paper-footer">
              <span id="paper-rule">{formCopy.paperRule}</span>
              <div className="footer-actions">
                {isEditing && (
                  <button type="button" id="revert-haiku" onClick={revertEdit} disabled={!isEdited}>{copy.revert}</button>
                )}
                <button
                  type="button"
                  id="edit-haiku"
                  onClick={toggleEdit}
                  aria-pressed={isEditing}
                  aria-expanded={isEditing}
                  aria-controls="haiku-edit-panel"
                  disabled={!haiku || isGenerating}
                >
                  {isEditing ? copy.done : copy.edit}
                </button>
                <button type="button" id="save-haiku" onClick={saveHaiku} aria-label={copy.saveAria} disabled={!haiku || isEditing}>{saved ? copy.saved : copy.save}</button>
              </div>
            </div>
          </div>

          {openMenuLine !== null && haiku && menuPosition && (
            <div
              className="line-menu"
              role="menu"
              aria-label={copy.lineMenuLabel}
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <button type="button" role="menuitem" onClick={() => haikulyThisLine(openMenuLine)}>
                {copy.haikulyThis}
              </button>
              <button type="button" role="menuitem" onClick={() => copyLineText(openMenuLine)}>
                {copiedLine ? copy.copiedLine : copy.copyLine}
              </button>
            </div>
          )}

          <div className="action-row">
            <p className="error-message" id="error-message" role="alert">{error}</p>
            <button type="submit" className="generate-button" id="generate-haiku" disabled={isGenerating}>
              {isGenerating ? copy.generating : mode === "random" ? formCopy.generateRandom : formCopy.generateKeyword}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </section>

      <section className="subscription-section" aria-labelledby="subscription-title">
        <div className="subscription-copy">
          <p className="subscription-kicker">Daily Haiku-ly</p>
          <h2 id="subscription-title">{copy.subscriptionTitle}</h2>
          <p id="subscription-intro">{copy.subscriptionIntro}</p>
        </div>
        <form className="subscription-form" id="daily-subscription-form" onSubmit={subscribe}>
          <label id="subscription-email-label" htmlFor="subscription-email">{copy.subscriptionEmailLabel}</label>
          <div className="subscription-input-row">
            <input
              id="subscription-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              value={subscriptionEmail}
              placeholder={copy.subscriptionPlaceholder}
              onChange={(event) => {
                setSubscriptionEmail(event.target.value);
                setSubscriptionMessage("");
                setSubscriptionSucceeded(false);
              }}
            />
            <button id="subscription-submit" type="submit" disabled={isSubscribing}>
              {isSubscribing ? copy.subscriptionSending : copy.subscriptionButton}
            </button>
          </div>
          <div className="subscription-timezone-field">
            <label id="subscription-timezone-label" htmlFor="subscription-timezone">{copy.subscriptionTimezoneLabel}</label>
            <input
              id="subscription-timezone"
              name="timezone"
              type="text"
              required
              maxLength={64}
              value={subscriptionTimezone}
              onChange={(event) => {
                setSubscriptionTimezone(event.target.value);
                setSubscriptionMessage("");
                setSubscriptionSucceeded(false);
              }}
              aria-describedby="subscription-timezone-help"
            />
            <p id="subscription-timezone-help">{copy.subscriptionTimezoneHelp}</p>
          </div>
          <input className="subscription-honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <p className="subscription-privacy" id="subscription-privacy">{copy.subscriptionPrivacy}</p>
          <p
            className={`subscription-message${subscriptionSucceeded ? " success" : ""}`}
            id="subscription-message"
            role="status"
            aria-live="polite"
          >
            {subscriptionMessage}
          </p>
        </form>
      </section>

      <footer>
        <p>Pause. Notice. Begin again.</p>
        <div className="footer-meta">
          <span>Built for brief moments of attention.</span>
          <a className="footer-contact" id="footer-contact" href="mailto:zhiguoinusa@gmail.com" aria-label={copy.emailAria}>zhiguoinusa@gmail.com</a>
        </div>
      </footer>

    </main>
  );
}
