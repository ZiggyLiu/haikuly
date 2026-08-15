(function () {
  "use strict";

  var COPY = {
    en: {
      languageLabel: "Poem language", languageRule: "5 · 7 · 5 syllables", languageGroup: "Poem language",
      modeGroup: "Generation mode", randomMode: "By chance", keywordMode: "From a word",
      keywordPrompt: "What is on your mind?", keywordPlaceholder: "moonlight, first snow, home…",
      keywordError: "Enter a word or short phrase first.",
      emptyPoem: "Your next small moment will appear here.", save: "Save Haiku",
      saved: "Saved", saveAria: "Save haiku as a picture", saveError: "The haiku image could not be saved. Please try again.",
      generateRandom: "Write a haiku", generateKeyword: "Write my haiku", generating: "Writing, reviewing, and painting…",
      generationError: "DeepSeek could not write a poem. Please try again.", unreachableError: "DeepSeek could not be reached. Please try again.",
      haikulyThis: "Haikuly this!", copyLine: "Copy", copiedLine: "Copied",
      copyLineError: "Could not copy this line. Please try again.", lineMenuLabel: "Line actions",
      edit: "Edit", done: "Done", revert: "Revert", humanEdited: "Human-edited",
      editLineAriaStart: "Edit line", editLineAriaEnd: "",
      pageTitle: "Spring Whispers, Haiku-ly~",
      homeAria: "Haiku-ly home", emailAria: "Email Haiku-ly at zhiguoinusa@gmail.com",
      heroTitle: "Spring Whispers,", heroTitleAccent: "Haiku-ly~"
    },
    zh: {
      languageLabel: "诗歌语言", languageRule: "5 · 7 · 5 字", languageGroup: "诗歌语言", modeGroup: "生成方式",
      randomMode: "随机生成", keywordMode: "关键词生成", keywordPrompt: "此刻你在想什么？",
      keywordPlaceholder: "月光，初雪，故乡…", keywordError: "请先输入一个词或短语。",
      emptyPoem: "下一刻诗意将在此浮现。",
      save: "保存俳句", saved: "已保存", saveAria: "将俳句保存为图片", saveError: "无法保存俳句图片，请重试。",
      generateRandom: "写一首俳句", generateKeyword: "写我的俳句", generating: "正在创作、审校与绘制…",
      generationError: "DeepSeek 暂时无法创作俳句，请重试。", unreachableError: "暂时无法连接 DeepSeek，请重试。",
      haikulyThis: "以此句再作一首", copyLine: "复制", copiedLine: "已复制",
      copyLineError: "无法复制这一句，请重试。", lineMenuLabel: "这一句的操作",
      edit: "编辑", done: "完成", revert: "还原", humanEdited: "人工编辑",
      editLineAriaStart: "编辑第", editLineAriaEnd: "行",
      pageTitle: "春风十里，Haiku-ly~",
      homeAria: "返回 Haiku-ly 首页", emailAria: "发送邮件至 zhiguoinusa@gmail.com 联系 Haiku-ly",
      heroTitle: "春风十里，", heroTitleAccent: "Haiku-ly~"
    },
    ja: {
      languageLabel: "俳句の言語", languageRule: "5 · 7 · 5 音", languageGroup: "俳句の言語", modeGroup: "作句方法",
      randomMode: "おまかせ", keywordMode: "言葉から", keywordPrompt: "今、心にあるものは？",
      keywordPlaceholder: "月明かり、初雪、故郷…", keywordError: "言葉または短いフレーズを入力してください。",
      emptyPoem: "次の小さな瞬間がここに現れます。",
      save: "俳句を保存", saved: "保存しました", saveAria: "俳句を画像として保存",
      saveError: "俳句の画像を保存できませんでした。もう一度お試しください。", generateRandom: "俳句を詠む",
      generateKeyword: "私の俳句を詠む", generating: "作句・推敲・描画中…",
      generationError: "DeepSeekが俳句を作れませんでした。もう一度お試しください。",
      unreachableError: "DeepSeekに接続できませんでした。もう一度お試しください。",
      haikulyThis: "この句で詠む", copyLine: "コピー", copiedLine: "コピーしました",
      copyLineError: "この句をコピーできませんでした。もう一度お試しください。", lineMenuLabel: "句の操作",
      edit: "編集", done: "完了", revert: "元に戻す", humanEdited: "人間編集",
      editLineAriaStart: "", editLineAriaEnd: "行目を編集",
      pageTitle: "春のささやき、Haiku-ly~",
      homeAria: "Haiku-ly ホームへ戻る", emailAria: "zhiguoinusa@gmail.com にメールで Haiku-ly へ連絡",
      heroTitle: "春のささやき、", heroTitleAccent: "Haiku-ly~"
    }
  };

  var MODERN_COPY = {
    en: {
      languageLabel: "Poem language", languageRule: "Three lines · modern voice", languageGroup: "Poem language",
      modeGroup: "Generation mode", randomMode: "By chance", keywordMode: "From a word",
      keywordPrompt: "What is on your mind?", keywordPlaceholder: "late train, low battery, home…",
      keywordError: "Enter a word or short phrase first.",
      emptyPoem: "Your next small moment will appear here.", save: "Save Haiku",
      saved: "Saved", saveAria: "Save haiku as a picture", saveError: "The haiku image could not be saved. Please try again.",
      generateRandom: "Write a modern haiku", generateKeyword: "Write my modern haiku", generating: "Writing, reviewing, and painting…",
      generationError: "DeepSeek could not write a modern short haiku. Please try again.", unreachableError: "DeepSeek could not be reached. Please try again.",
      haikulyThis: "Haikuly this!", copyLine: "Copy", copiedLine: "Copied",
      copyLineError: "Could not copy this line. Please try again.", lineMenuLabel: "Line actions",
      edit: "Edit", done: "Done", revert: "Revert", humanEdited: "Human-edited",
      editLineAriaStart: "Edit line", editLineAriaEnd: "",
      pageTitle: "Spring Whispers, Haiku-ly~",
      homeAria: "Haiku-ly home", emailAria: "Email Haiku-ly at zhiguoinusa@gmail.com",
      eyebrow: "Make room for a small moment", heroTitle: "Spring Whispers,", heroTitleAccent: "Haiku-ly~",
      intro: "Find a modern three-line poem and its quiet ink-wash world by chance, or begin with a word already on your mind.",
      paperRule: "Three lines · modern haiku"
    },
    zh: {
      languageLabel: "诗歌语言", languageRule: "三行 · 当代中文", languageGroup: "诗歌语言", modeGroup: "生成方式",
      randomMode: "随机生成", keywordMode: "关键词生成", keywordPrompt: "此刻你在想什么？",
      keywordPlaceholder: "下班，雨夜，已读不回…", keywordError: "请先输入一个词或短语。",
      emptyPoem: "下一刻诗意将在此浮现。",
      save: "保存俳句", saved: "已保存", saveAria: "将俳句保存为图片", saveError: "无法保存短俳图片，请重试。",
      generateRandom: "写一首现代短俳", generateKeyword: "写我的现代短俳", generating: "正在创作、审校与绘制…",
      generationError: "DeepSeek 暂时无法创作现代短俳，请重试。", unreachableError: "暂时无法连接 DeepSeek，请重试。",
      haikulyThis: "以此句再作一首", copyLine: "复制", copiedLine: "已复制",
      copyLineError: "无法复制这一句，请重试。", lineMenuLabel: "这一句的操作",
      edit: "编辑", done: "完成", revert: "还原", humanEdited: "人工编辑",
      editLineAriaStart: "编辑第", editLineAriaEnd: "行",
      pageTitle: "春风十里，Haiku-ly~",
      homeAria: "返回 Haiku-ly 首页", emailAria: "发送邮件至 zhiguoinusa@gmail.com 联系 Haiku-ly",
      eyebrow: "给一个小小的瞬间留点位置", heroTitle: "春风十里，", heroTitleAccent: "Haiku-ly~",
      intro: "随机发现一首现代短俳和它的水墨世界，或从此刻萦绕心头的一个词开始。",
      paperRule: "三行 · 现代短俳"
    },
    ja: {
      languageLabel: "詩の言語", languageRule: "三行 · 現代語", languageGroup: "詩の言語", modeGroup: "作句方法",
      randomMode: "おまかせ", keywordMode: "言葉から", keywordPrompt: "今、心にあるものは？",
      keywordPlaceholder: "終電、通知、雨の夜…", keywordError: "言葉または短いフレーズを入力してください。",
      emptyPoem: "次の小さな瞬間がここに現れます。",
      save: "俳句を保存", saved: "保存しました", saveAria: "俳句を画像として保存",
      saveError: "短俳の画像を保存できませんでした。もう一度お試しください。", generateRandom: "現代短俳を詠む",
      generateKeyword: "私の現代短俳を詠む", generating: "作句・推敲・描画中…",
      generationError: "DeepSeekが現代短俳を作れませんでした。もう一度お試しください。",
      unreachableError: "DeepSeekに接続できませんでした。もう一度お試しください。",
      haikulyThis: "この句で詠む", copyLine: "コピー", copiedLine: "コピーしました",
      copyLineError: "この句をコピーできませんでした。もう一度お試しください。", lineMenuLabel: "句の操作",
      edit: "編集", done: "完了", revert: "元に戻す", humanEdited: "人間編集",
      editLineAriaStart: "", editLineAriaEnd: "行目を編集",
      pageTitle: "春のささやき、Haiku-ly~",
      homeAria: "Haiku-ly ホームへ戻る", emailAria: "zhiguoinusa@gmail.com にメールで Haiku-ly へ連絡",
      eyebrow: "小さな瞬間のために余白を", heroTitle: "今この時を、", heroTitleAccent: "Haiku-ly~",
      intro: "おまかせで現代の三行詩と静かな水墨の世界を見つけるか、心にある一つの言葉から始めましょう。",
      paperRule: "三行 · 現代短俳"
    }
  };

  var V23_FORM_COPY = {
    en: {
      group: "Haiku form", traditional: "5-7-5", modern: "Modern Haiku",
      languageRule: "5 · 7 · 5 syllables", generateRandom: "Write a 5-7-5 haiku",
      generateKeyword: "Write my 5-7-5 haiku", generationError: "DeepSeek could not write a coherent 5-7-5 haiku. Please try again.",
      intro: "Find a strict 5-7-5 haiku and its quiet watercolor world by chance, or begin with a word already on your mind.",
      paperRule: "5 · 7 · 5 syllables"
    },
    zh: {
      group: "俳句形式", traditional: "五七五俳句", modern: "现代短俳",
      languageRule: "五 · 七 · 五字", generateRandom: "写一首五七五俳句",
      generateKeyword: "写我的五七五俳句", generationError: "DeepSeek 暂时无法创作合规的五七五俳句，请重试。",
      intro: "随机发现一首严格遵循五七五字数的俳句和它的水彩世界，或从此刻萦绕心头的一个词开始。",
      paperRule: "五 · 七 · 五字"
    },
    ja: {
      group: "俳句の形式", traditional: "五・七・五", modern: "現代短俳",
      languageRule: "五 · 七 · 五音", generateRandom: "五・七・五を詠む",
      generateKeyword: "私の五・七・五を詠む", generationError: "DeepSeekが五・七・五の俳句を作れませんでした。もう一度お試しください。",
      intro: "五・七・五を守る俳句と静かな水彩の世界をおまかせで見つけるか、心にある一つの言葉から始めましょう。",
      paperRule: "五 · 七 · 五音"
    }
  };

  var state = {
    language: "en", mode: "random", keyword: "", error: "", haiku: null,
    haikuLanguage: "en", haikuForm: "modern", generating: false,
    editing: false, displayLines: null, recentLines: { en: [], zh: [], ja: [] }
  };

  function publishState() {
    window.__STILLPOINT_FALLBACK_STATE__ = {
      language: state.language,
      mode: state.mode,
      keyword: state.keyword,
      error: state.error,
      haiku: state.haiku,
      haikuLanguage: state.haikuLanguage,
      haikuForm: state.haikuForm,
      generating: state.generating,
      editing: state.editing,
      displayLines: state.displayLines
    };
  }

  function reactReady() {
    return window.__STILLPOINT_FALLBACK_ACTIVE__ !== true && window.__STILLPOINT_REACT_READY__ === true;
  }
  function activateFallback() { window.__STILLPOINT_FALLBACK_ACTIVE__ = true; publishState(); }
  function byId(id) { return document.getElementById(id); }
  function isModernApp() { return !!document.getElementById("modern-short-haiku-app"); }
  function copy() { return (isModernApp() ? MODERN_COPY : COPY)[state.language]; }
  function selectedFormCopy() {
    if (!isModernApp() || state.haikuForm === "modern") return copy();
    return V23_FORM_COPY[state.language];
  }
  function setText(element, value) { if (element) element.textContent = value; }
  function setError(value) { state.error = value; setText(byId("error-message"), value); publishState(); }

  function setButtonCopy(button, icon, label) {
    if (!button) return;
    while (button.firstChild) button.removeChild(button.firstChild);
    var symbol = document.createElement("span");
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = icon;
    button.appendChild(symbol);
    button.appendChild(document.createTextNode(" " + label));
  }

  function setActionCopy(button, label) {
    if (!button) return;
    while (button.firstChild) button.removeChild(button.firstChild);
    button.appendChild(document.createTextNode(label));
    var symbol = document.createElement("span");
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = "↗";
    button.appendChild(symbol);
  }

  function updateControls() {
    var current = copy();
    var currentForm = selectedFormCopy();
    document.title = current.pageTitle;
    document.documentElement.lang = state.language === "zh" ? "zh-CN" : state.language;
    setText(byId("hero-title"), current.heroTitle);
    setText(byId("hero-accent"), current.heroTitleAccent);
    if (isModernApp()) {
      setText(byId("modern-eyebrow"), current.eyebrow);
      setText(byId("modern-intro"), currentForm.intro);
      setText(byId("paper-rule"), currentForm.paperRule);
    }
    var heroHeading = byId("hero-title");
    if (heroHeading && heroHeading.parentElement) {
      heroHeading.parentElement.setAttribute("lang", state.language === "zh" ? "zh-CN" : state.language);
    }
    var languageButtons = document.querySelectorAll("[data-language]");
    var formButtons = document.querySelectorAll("[data-haiku-form]");
    var modeButtons = document.querySelectorAll("[data-mode]");
    var index;
    for (index = 0; index < languageButtons.length; index += 1) {
      var languageActive = languageButtons[index].getAttribute("data-language") === state.language;
      languageButtons[index].className = languageActive ? "active" : "";
      languageButtons[index].setAttribute("aria-pressed", languageActive ? "true" : "false");
    }
    for (index = 0; index < formButtons.length; index += 1) {
      var formActive = formButtons[index].getAttribute("data-haiku-form") === state.haikuForm;
      formButtons[index].className = formActive ? "active" : "";
      formButtons[index].setAttribute("aria-pressed", formActive ? "true" : "false");
    }
    for (index = 0; index < modeButtons.length; index += 1) {
      var modeActive = modeButtons[index].getAttribute("data-mode") === state.mode;
      modeButtons[index].className = modeActive ? "active" : "";
      modeButtons[index].setAttribute("aria-pressed", modeActive ? "true" : "false");
    }

    setText(document.querySelector(".language-label"), current.languageLabel);
    setText(document.querySelector(".language-rule"), currentForm.languageRule);
    var languageGroup = document.querySelector(".language-switch");
    var formGroup = document.querySelector(".haiku-form-switch");
    var modeGroup = document.querySelector(".mode-switch");
    var studio = document.querySelector(".studio");
    if (studio) studio.setAttribute("aria-label", current.pageTitle);
    var home = byId("brand-home");
    var contact = byId("footer-contact");
    if (home) home.setAttribute("aria-label", current.homeAria);
    if (contact) contact.setAttribute("aria-label", current.emailAria);
    if (languageGroup) languageGroup.setAttribute("aria-label", current.languageGroup);
    if (formGroup && isModernApp()) {
      formGroup.setAttribute("aria-label", V23_FORM_COPY[state.language].group);
      setText(formGroup.querySelector('[data-haiku-form="traditional"]'), V23_FORM_COPY[state.language].traditional);
      setText(formGroup.querySelector('[data-haiku-form="modern"]'), V23_FORM_COPY[state.language].modern);
    }
    if (modeGroup) modeGroup.setAttribute("aria-label", current.modeGroup);
    setButtonCopy(document.querySelector('[data-mode="random"]'), "✦", current.randomMode);
    setButtonCopy(document.querySelector('[data-mode="keyword"]'), "⌁", current.keywordMode);

    setText(byId("keyword-label"), current.keywordPrompt);
    var input = byId("keyword");
    if (input) input.setAttribute("placeholder", current.keywordPlaceholder);

    var keywordField = byId("keyword-field");
    if (keywordField) keywordField.hidden = state.mode !== "keyword";
    if (!state.haiku) {
      setText(byId("empty-poem"), current.emptyPoem);
    }
    var save = byId("save-haiku");
    if (save) {
      save.setAttribute("aria-label", current.saveAria);
      setText(save, current.save);
    }
    var editButton = byId("edit-haiku");
    if (editButton) {
      editButton.disabled = !state.haiku || state.generating;
      editButton.setAttribute("aria-pressed", state.editing ? "true" : "false");
      setText(editButton, state.editing ? current.done : current.edit);
    }
    var revertButton = byId("revert-haiku");
    if (state.editing) {
      if (!revertButton) {
        revertButton = document.createElement("button");
        revertButton.type = "button";
        revertButton.id = "revert-haiku";
        var footerActions = document.querySelector(".footer-actions");
        if (footerActions) footerActions.insertBefore(revertButton, editButton || footerActions.firstChild);
      }
      if (revertButton) {
        revertButton.hidden = false;
        revertButton.disabled = !edited();
        setText(revertButton, current.revert);
      }
    } else if (revertButton) {
      revertButton.hidden = true;
    }
    updateHumanBadge();
    updateGenerateButton();
    publishState();
  }

  function updateGenerateButton() {
    var button = byId("generate-haiku");
    if (!button) return;
    var current = copy();
    var currentForm = selectedFormCopy();
    button.disabled = state.generating;
    setActionCopy(button, state.generating ? current.generating : (state.mode === "random" ? currentForm.generateRandom : currentForm.generateKeyword));
    publishState();
  }

  function dateLabel(createdAt, language) {
    var date = new Date(createdAt);
    if (isNaN(date.getTime())) return "DATE —";
    if (language === "zh" || language === "ja") {
      return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日";
    }
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
  }

  var SYLLABLE_EXCEPTIONS = {
    autumn: 2, beautiful: 3, branches: 2, carries: 2, crosses: 2, evening: 3,
    fire: 1, flower: 2, moonlight: 2, ocean: 2, pale: 1, poem: 2, quiet: 2,
    rises: 2, river: 2, science: 2, settles: 2
  };

  function estimateSyllables(text) {
    return String(text).toLowerCase().replace(/[^a-z\s'-]/g, " ").split(/\s+/).filter(Boolean)
      .reduce(function (total, word) {
        var clean = word.replace(/[^a-z]/g, "");
        if (!clean) return total;
        if (SYLLABLE_EXCEPTIONS[clean]) return total + SYLLABLE_EXCEPTIONS[clean];
        if (clean.length <= 3) return total + 1;
        var adjusted = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, "").replace(/^y/, "");
        var groups = adjusted.match(/[aeiouy]{1,2}/g);
        return total + Math.max(1, groups ? groups.length : 1);
      }, 0);
  }

  function countJapaneseMora(reading) {
    var combiningKana = new Set([
      "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "ゎ", "ゕ", "ゖ",
      "ァ", "ィ", "ゥ", "ェ", "ォ", "ャ", "ュ", "ョ", "ヮ", "ヵ", "ヶ"
    ]);
    var count = 0;
    Array.from(String(reading).normalize("NFC")).forEach(function (character) {
      if (!combiningKana.has(character)) count += 1;
    });
    return count;
  }

  function strictPoeticUnits(text, language) {
    if (language === "zh") {
      return Array.from(String(text)).filter(function (character) { return /\p{Script=Han}/u.test(character); }).length;
    }
    if (language === "ja") return countJapaneseMora(text);
    return estimateSyllables(text);
  }

  function editableLineUnits(text, language, form) {
    if (form === "traditional") return strictPoeticUnits(text, language);
    if (language === "en") return String(text).trim().split(/\s+/).filter(Boolean).length;
    return Array.from(String(text).replace(/[\p{P}\p{S}\s]/gu, "")).length;
  }

  function seededRandom(seed) {
    var value = seed >>> 0;
    return function () {
      value += 1831565813;
      var result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function palette(tone) {
    var colors = {
      sage: [[54, 83, 71], [158, 174, 157], [169, 137, 119]],
      "blue-gray": [[61, 78, 84], [161, 175, 180], [142, 149, 159]],
      sepia: [[91, 77, 64], [188, 175, 151], [163, 126, 104]],
      "plum-gray": [[83, 70, 78], [179, 164, 170], [149, 125, 134]]
    };
    return colors[tone] || colors.sage;
  }

  function rgba(color, alpha) { return "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + alpha + ")"; }

  function wash(context, x, y, radiusX, radiusY, color, alpha) {
    context.save();
    context.translate(x, y);
    context.scale(1, radiusY / radiusX);
    var gradient = context.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, rgba(color, alpha));
    gradient.addColorStop(0.62, rgba(color, alpha * 0.45));
    gradient.addColorStop(1, rgba(color, 0));
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radiusX, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function roundedCanvasRect(context, x, y, width, height, radius) {
    var corner = Math.min(radius, width / 2, height / 2);
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

  function drawInk(canvas, haiku) {
    var bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    var context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);
    var colors = palette(haiku.illustration && haiku.illustration.tone);
    var random = seededRandom(haiku.seed || 1);
    var width = bounds.width;
    var height = bounds.height;
    var index;
    wash(context, width * 0.5, height * 0.52, width * 0.46, height * 0.4, colors[1], 0.06);
    for (index = 0; index < 14; index += 1) {
      wash(context, width * (0.08 + random() * 0.84), height * (0.1 + random() * 0.78), 55 + random() * 125, 32 + random() * 90, index % 4 === 0 ? colors[2] : colors[1], 0.045 + random() * 0.055);
    }
    context.strokeStyle = rgba(colors[0], 0.22);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 1.2;
    var ground = height * 0.74;
    var motif = haiku.illustration && haiku.illustration.motif;
    var side = haiku.illustration && haiku.illustration.placement === "left" ? 1 : -1;
    var originX = haiku.illustration && haiku.illustration.placement === "left" ? width * 0.36 : width * 0.64;
    var span = Math.min(width * 0.72, 560);
    context.beginPath();
    if (motif === "window") {
      var frameWidth = Math.min(span * 0.74, 360);
      var frameHeight = Math.min(height * 0.48, 205);
      var frameLeft = originX - frameWidth / 2;
      var frameTop = height * 0.18;
      context.rect(frameLeft, frameTop, frameWidth, frameHeight);
      context.moveTo(originX, frameTop);
      context.lineTo(originX, frameTop + frameHeight);
      context.moveTo(frameLeft, frameTop + frameHeight * 0.54);
      context.lineTo(frameLeft + frameWidth, frameTop + frameHeight * 0.54);
    } else if (motif === "skyline") {
      var skylineBase = ground + 38;
      var skylineX = originX - span * 0.65;
      context.moveTo(originX - span * 0.7, skylineBase);
      context.lineTo(originX + span * 0.7, skylineBase);
      for (index = 0; index < 9; index += 1) {
        var buildingWidth = 28 + random() * 34;
        var buildingHeight = 58 + random() * 105;
        context.rect(skylineX, skylineBase - buildingHeight, buildingWidth, buildingHeight);
        skylineX += buildingWidth + 8 + random() * 12;
      }
    } else if (motif === "transit") {
      var carWidth = Math.min(span * 1.2, 520);
      var carHeight = 112;
      var carLeft = originX - carWidth / 2;
      var carTop = ground - carHeight;
      roundedCanvasRect(context, carLeft, carTop, carWidth, carHeight, 18);
      context.moveTo(carLeft - 28, ground + 28);
      context.lineTo(carLeft + carWidth + 28, ground + 28);
      for (index = 0; index < 5; index += 1) {
        context.rect(carLeft + 38 + index * ((carWidth - 76) / 5), carTop + 47, (carWidth - 110) / 5, 35);
      }
    } else if (motif === "cafe") {
      var tableY = ground - 6;
      context.moveTo(originX - span * 0.55, tableY);
      context.lineTo(originX + span * 0.55, tableY);
      context.moveTo(originX - span * 0.3, tableY);
      context.lineTo(originX - span * 0.38, tableY + 90);
      context.moveTo(originX + span * 0.3, tableY);
      context.lineTo(originX + span * 0.38, tableY + 90);
      context.ellipse(originX, tableY - 44, 24, 8, 0, 0, Math.PI * 2);
      context.moveTo(originX - 20, tableY - 43);
      context.lineTo(originX - 16, tableY - 12);
      context.quadraticCurveTo(originX, tableY - 5, originX + 16, tableY - 12);
      context.lineTo(originX + 20, tableY - 43);
    } else if (motif === "desk") {
      var deskY = ground + 8;
      context.moveTo(originX - span * 0.62, deskY);
      context.lineTo(originX + span * 0.62, deskY);
      context.moveTo(originX - 72, deskY - 9);
      context.lineTo(originX - 55, deskY - 84);
      context.lineTo(originX + 62, deskY - 84);
      context.lineTo(originX + 76, deskY - 9);
      context.closePath();
    } else if (motif === "doorway") {
      var doorWidth = Math.min(span * 0.5, 210);
      var doorHeight = Math.min(height * 0.58, 250);
      var doorLeft = originX - doorWidth / 2;
      var doorTop = ground - doorHeight + 44;
      context.rect(doorLeft, doorTop, doorWidth, doorHeight);
      context.moveTo(doorLeft + doorWidth * 0.3, doorTop + doorHeight * 0.42);
      context.lineTo(doorLeft + doorWidth * 0.82, doorTop + doorHeight * 0.3);
      context.lineTo(doorLeft + doorWidth * 0.82, doorTop + doorHeight);
    } else if (motif === "street") {
      var vanishX = originX + side * span * 0.08;
      var vanishY = height * 0.37;
      context.moveTo(vanishX, vanishY);
      context.lineTo(originX - span * 0.72, ground + 92);
      context.moveTo(vanishX, vanishY);
      context.lineTo(originX + span * 0.72, ground + 92);
      for (index = 0; index < 6; index += 1) {
        var stripeY = vanishY + 38 + index * 23;
        var stripeHalf = 18 + index * 13;
        context.moveTo(vanishX - stripeHalf, stripeY);
        context.lineTo(vanishX + stripeHalf, stripeY);
      }
    } else if (motif === "phone") {
      var phoneWidth = 112;
      var phoneHeight = 214;
      var phoneLeft = originX - phoneWidth / 2;
      var phoneTop = height * 0.2;
      roundedCanvasRect(context, phoneLeft, phoneTop, phoneWidth, phoneHeight, 18);
      context.moveTo(originX - 18, phoneTop + 15);
      context.lineTo(originX + 18, phoneTop + 15);
      context.moveTo(originX - 14, phoneTop + phoneHeight - 14);
      context.lineTo(originX + 14, phoneTop + phoneHeight - 14);
    } else if (motif === "laundry") {
      var laundryY = height * 0.31;
      context.moveTo(originX - span * 0.68, laundryY);
      context.quadraticCurveTo(originX, laundryY + 32, originX + span * 0.68, laundryY);
      for (index = 0; index < 4; index += 1) {
        var itemX = originX - span * 0.42 + index * span * 0.28;
        var itemY = laundryY + 18 + index % 2 * 6;
        var itemWidth = 46 + random() * 24;
        var itemHeight = 74 + random() * 42;
        context.rect(itemX - itemWidth / 2, itemY, itemWidth, itemHeight);
      }
    } else if (motif === "bicycle") {
      var wheelY = ground + 8;
      var wheelRadius = Math.min(62, span * 0.15);
      var leftWheel = originX - wheelRadius * 1.35;
      var rightWheel = originX + wheelRadius * 1.35;
      context.arc(leftWheel, wheelY, wheelRadius, 0, Math.PI * 2);
      context.moveTo(rightWheel + wheelRadius, wheelY);
      context.arc(rightWheel, wheelY, wheelRadius, 0, Math.PI * 2);
      context.moveTo(leftWheel, wheelY);
      context.lineTo(originX - 8, wheelY - 8);
      context.lineTo(rightWheel, wheelY);
      context.lineTo(originX + 24, wheelY - 78);
      context.lineTo(originX - 8, wheelY - 8);
      context.lineTo(originX - 34, wheelY - 82);
    } else if (motif === "mountains") {
      context.moveTo(width * 0.08, ground);
      context.lineTo(width * 0.31, ground - 92);
      context.lineTo(width * 0.49, ground - 28);
      context.lineTo(width * 0.69, ground - 112);
      context.lineTo(width * 0.92, ground);
    } else if (motif === "rain") {
      for (index = 0; index < 30; index += 1) {
        var rx = width * (0.08 + random() * 0.84);
        var ry = height * (0.12 + random() * 0.68);
        context.moveTo(rx, ry);
        context.lineTo(rx - 8, ry + 28);
      }
    } else if (motif === "pine" || motif === "reeds" || motif === "field") {
      for (index = 0; index < 24; index += 1) {
        var sx = width * (0.1 + random() * 0.8);
        var sh = 35 + random() * 110;
        context.moveTo(sx, ground + 45);
        context.quadraticCurveTo(sx + 12, ground - sh * 0.45, sx + 4, ground - sh);
      }
    } else {
      for (index = 0; index < 6; index += 1) {
        var lineY = ground - 36 + index * 17;
        context.moveTo(width * 0.08, lineY);
        context.bezierCurveTo(width * 0.32, lineY - 12, width * 0.65, lineY + 12, width * 0.92, lineY - 3);
      }
    }
    context.stroke();

    var accent = haiku.illustration && haiku.illustration.accent;
    var accentX = originX;
    var accentY = height * 0.28;
    context.strokeStyle = rgba(colors[0], 0.18);
    context.fillStyle = rgba(colors[2], 0.08);
    context.lineWidth = 0.8;
    context.beginPath();
    if (accent === "moon" || accent === "sun") {
      context.arc(accentX, accentY, 18, 0, Math.PI * 2);
      context.fill();
    } else if (accent === "lamp") {
      context.moveTo(accentX - side * 44, accentY + 92);
      context.quadraticCurveTo(accentX - side * 34, accentY + 12, accentX, accentY + 8);
      context.lineTo(accentX + side * 24, accentY + 24);
      context.lineTo(accentX - side * 10, accentY + 29);
    } else if (accent === "cup") {
      context.ellipse(accentX, accentY + 8, 18, 6, 0, 0, Math.PI * 2);
      context.moveTo(accentX - 17, accentY + 9);
      context.lineTo(accentX - 13, accentY + 35);
      context.quadraticCurveTo(accentX, accentY + 43, accentX + 13, accentY + 35);
      context.lineTo(accentX + 17, accentY + 9);
    } else if (accent === "umbrella") {
      context.arc(accentX, accentY + 26, 43, Math.PI, Math.PI * 2);
      context.moveTo(accentX, accentY - 17);
      context.lineTo(accentX, accentY + 71);
    } else if (accent === "plant") {
      context.moveTo(accentX, accentY + 72);
      context.quadraticCurveTo(accentX - side * 8, accentY + 34, accentX + side * 2, accentY - 8);
      context.rect(accentX - 18, accentY + 72, 36, 24);
    } else if (accent === "cat") {
      context.moveTo(accentX - 17, accentY + 31);
      context.lineTo(accentX - 12, accentY + 8);
      context.lineTo(accentX, accentY + 20);
      context.lineTo(accentX + 13, accentY + 7);
      context.lineTo(accentX + 18, accentY + 31);
      context.bezierCurveTo(accentX + 31, accentY + 62, accentX + 20, accentY + 91, accentX, accentY + 96);
      context.bezierCurveTo(accentX - 24, accentY + 88, accentX - 31, accentY + 58, accentX - 17, accentY + 31);
    }
    context.stroke();
  }

  function renderHaiku(haiku, language) {
    if (isModernApp() && state.haikuForm === "modern") {
      state.recentLines[language] = haiku.lines.concat(state.recentLines[language] || []).slice(0, 15);
    }
    state.haiku = haiku;
    state.haikuLanguage = language;
    publishState();
    closeLineMenu();
    var paper = byId("poem-paper");
    if (!paper) return;
    paper.classList.add("has-illustration");
    var oldCanvas = paper.querySelector(".ink-wash-canvas");
    if (oldCanvas && oldCanvas.parentNode) oldCanvas.parentNode.removeChild(oldCanvas);
    var canvas = document.createElement("canvas");
    canvas.className = "ink-wash-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.pointerEvents = "none";
    paper.insertBefore(canvas, paper.firstChild);

    var date = byId("paper-date");
    setText(date, dateLabel(haiku.createdAt, language));
    if (date) date.setAttribute("datetime", haiku.createdAt);
    state.displayLines = haiku.lines.slice();
    state.editing = false;
    renderLines();
    updateHumanBadge();
    var save = byId("save-haiku");
    if (save) save.disabled = false;
    var editButton = byId("edit-haiku");
    if (editButton) editButton.disabled = false;
    drawInk(canvas, haiku);
  }

  function renderLines() {
    var linesNode = byId("poem-lines");
    if (!linesNode || !state.haiku) return;
    while (linesNode.firstChild) linesNode.removeChild(linesNode.firstChild);
    var current = copy();
    var language = state.haikuLanguage || state.language;
    var source = state.displayLines || state.haiku.lines;
    linesNode.className = "poem-lines";
    if (language === "en") {
      var longest = Math.max(source[0].length, source[1].length, source[2].length);
      if (longest > 38) linesNode.className += " lines-extra-tight";
      else if (longest > 27) linesNode.className += " lines-tight";
    }
    linesNode.setAttribute("lang", language === "zh" ? "zh-CN" : language);
    for (var index = 0; index < source.length; index += 1) {
      var row = document.createElement("div");
      row.className = "poem-line" + (state.editing ? " poem-line-editing" : "");
      row.setAttribute("data-line-index", String(index));
      if (state.editing) {
        var editable = document.createElement("p");
        editable.className = "poem-line-input";
        editable.setAttribute("contenteditable", "true");
        editable.setAttribute("role", "textbox");
        editable.setAttribute("data-line-input", String(index));
        editable.setAttribute("aria-label",
          (current.editLineAriaStart + " " + (index + 1) + " " + current.editLineAriaEnd).trim());
        editable.textContent = source[index];
        var count = document.createElement("span");
        count.className = "poem-line-count";
        count.setAttribute("data-line-count", String(index));
        count.setAttribute("aria-hidden", "true");
        row.appendChild(editable);
        row.appendChild(count);
      } else {
        var trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "poem-line-trigger";
        trigger.setAttribute("data-line-trigger", String(index));
        trigger.setAttribute("aria-haspopup", "menu");
        trigger.setAttribute("aria-expanded", "false");
        var paragraph = document.createElement("p");
        paragraph.textContent = source[index];
        trigger.appendChild(paragraph);
        row.appendChild(trigger);
      }
      linesNode.appendChild(row);
    }
    updateLineCounts();
  }

  function updateLineCounts() {
    if (!state.editing || !state.haiku) return;
    var language = state.haikuLanguage || state.language;
    var source = state.displayLines || state.haiku.lines;
    var expected = [5, 7, 5];
    for (var index = 0; index < 3; index += 1) {
      var label = document.querySelector('[data-line-count="' + index + '"]');
      if (!label) continue;
      var count = editableLineUnits(source[index] || "", language, state.haikuForm);
      var strictMismatch = state.haikuForm === "traditional" && count !== expected[index];
      label.textContent = state.haikuForm === "traditional" ? String(count) + "/" + expected[index] : String(count);
      label.className = "poem-line-count" + (strictMismatch ? " mismatch" : "");
    }
  }

  function edited() {
    if (!state.haiku || !state.displayLines) return false;
    for (var index = 0; index < state.haiku.lines.length; index += 1) {
      if (state.displayLines[index] !== state.haiku.lines[index]) return true;
    }
    return false;
  }

  function toggleEdit() {
    if (!state.haiku) return;
    closeLineMenu();
    state.editing = !state.editing;
    if (!state.displayLines) state.displayLines = state.haiku.lines.slice();
    setError("");
    renderLines();
    updateControls();
  }

  function revertEdit() {
    if (!state.haiku) return;
    state.displayLines = state.haiku.lines.slice();
    renderLines();
    updateControls();
  }

  function updateHumanBadge() {
    var paper = byId("poem-paper");
    if (!paper) return;
    var badge = paper.querySelector(".human-edited-badge");
    if (edited()) {
      var sourceCopy = (isModernApp() ? MODERN_COPY : COPY)[state.haikuLanguage || state.language];
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "human-edited-badge";
        badge.id = "human-edited-badge";
        var date = byId("paper-date");
        if (date && date.parentNode) date.parentNode.insertBefore(badge, date.nextSibling);
      }
      badge.textContent = sourceCopy.humanEdited;
    } else if (badge && badge.parentNode) {
      badge.parentNode.removeChild(badge);
    }
  }

  function clearRenderedHaiku() {
    closeLineMenu();
    state.haiku = null;
    state.haikuLanguage = state.language;
    state.displayLines = null;
    state.editing = false;
    var paper = byId("poem-paper");
    if (paper) {
      paper.classList.remove("has-illustration");
      var canvas = paper.querySelector(".ink-wash-canvas");
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    var date = byId("paper-date");
    setText(date, "DATE —");
    if (date) date.removeAttribute("datetime");
    var lines = byId("poem-lines");
    if (lines) {
      while (lines.firstChild) lines.removeChild(lines.firstChild);
      lines.className = "poem-lines poem-empty";
      var empty = document.createElement("p");
      empty.id = "empty-poem";
      empty.textContent = copy().emptyPoem;
      lines.appendChild(empty);
    }
    var save = byId("save-haiku");
    if (save) save.disabled = true;
    var editButton = byId("edit-haiku");
    if (editButton) editButton.disabled = true;
    updateHumanBadge();
    publishState();
  }

  function generate() {
    if (state.generating) return;
    var current = copy();
    var currentForm = selectedFormCopy();
    var input = byId("keyword");
    var keyword = input ? input.value.replace(/^\s+|\s+$/g, "") : "";
    if (state.mode === "keyword" && !keyword) {
      setError(current.keywordError);
      return;
    }
    state.keyword = keyword;
    state.generating = true;
    setError("");
    updateGenerateButton();
    var payload = { mode: state.mode, language: state.language };
    if (state.mode === "keyword") payload.keyword = keyword;
    if (isModernApp() && state.haikuForm === "modern") payload.recentLines = state.recentLines[state.language] || [];
    var request = isModernApp()
      ? (state.haikuForm === "modern" ? fetchModernHaiku(payload) : fetchV23Haiku(payload))
      : fetchFormalHaiku(payload);
    request.then(function (response) {
      return response.json().then(function (result) { return { response: response, result: result }; });
    }).then(function (packet) {
      if (!packet.response.ok || !packet.result.haiku) throw new Error("generation");
      renderHaiku(packet.result.haiku, packet.result.language || state.language);
    }).catch(function (error) {
      setError(error && error.message === "generation" ? currentForm.generationError : current.unreachableError);
    }).then(function () {
      state.generating = false;
      updateGenerateButton();
    });
  }

  function fetchFormalHaiku(payload) {
    return fetch("/api/haiku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function fetchModernHaiku(payload) {
    return fetch("/api/modern-haiku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function fetchV23Haiku(payload) {
    return fetch("/api/v23-haiku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function canvasFont(context, style) {
    context.font = style.fontStyle + " " + style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
    context.fillStyle = style.color;
    context.textAlign = "left";
    context.textBaseline = "top";
  }

  function relativePosition(element, bounds) {
    var item = element.getBoundingClientRect();
    return { x: item.left - bounds.left, y: item.top - bounds.top };
  }

  function filename(createdAt) {
    var date = new Date(createdAt);
    var prefix = "stillpoint-haiku";
    if (isNaN(date.getTime())) return prefix + ".png";
    function pad(value) { return value < 10 ? "0" + value : String(value); }
    return prefix + "-" + date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + ".png";
  }

  function imageFromCanvas(canvas, name) {
    var dataUrl = canvas.toDataURL("image/png");
    var binary = window.atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return { dataUrl: dataUrl, file: new File([bytes], name, { type: "image/png", lastModified: Date.now() }) };
  }

  function saveHaiku() {
    closeLineMenu();
    var paper = byId("poem-paper");
    if (!state.haiku || !paper) return;
    try {
      var bounds = paper.getBoundingClientRect();
      var width = Math.round(bounds.width);
      var height = Math.round(bounds.height);
      var scale = Math.min(3, 2048 / Math.max(width, height));
      var output = document.createElement("canvas");
      output.width = Math.round(width * scale);
      output.height = Math.round(height * scale);
      var context = output.getContext("2d");
      if (!context) throw new Error("canvas");
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.fillStyle = "#f8f5ed";
      context.fillRect(0, 0, width, height);
      var art = paper.querySelector(".ink-wash-canvas");
      if (art && art.width > 0) {
        context.globalAlpha = 0.82;
        context.drawImage(art, 0, 0, width, height);
        context.globalAlpha = 1;
      }
      var washGradient = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.55);
      washGradient.addColorStop(0, "rgba(248,245,237,0.42)");
      washGradient.addColorStop(1, "rgba(248,245,237,0)");
      context.fillStyle = washGradient;
      context.fillRect(0, 0, width, height);

      var seal = paper.querySelector(".sun-seal");
      if (seal) {
        var sealBounds = seal.getBoundingClientRect();
        var sealPosition = relativePosition(seal, bounds);
        var centerX = sealPosition.x + sealBounds.width / 2;
        var centerY = sealPosition.y + sealBounds.height / 2;
        context.strokeStyle = "rgba(201,111,76,0.13)";
        context.fillStyle = "rgba(201,111,76,0.04)";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(centerX, centerY, sealBounds.width / 2, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.beginPath();
        context.arc(centerX, centerY, sealBounds.width * 0.16, 0, Math.PI * 2);
        context.stroke();
        var sealLabel = seal.querySelector(".sun-seal-label");
        if (sealLabel) {
          var sealStyle = window.getComputedStyle(sealLabel);
          var lineHeight = parseFloat(sealStyle.lineHeight) || 10;
          canvasFont(context, sealStyle);
          context.textAlign = "center";
          context.fillText("https://", centerX, centerY - lineHeight);
          context.fillText("haikuly.fyi", centerX, centerY);
        }
      }

      var date = byId("paper-date");
      if (date) {
        var datePosition = relativePosition(date, bounds);
        canvasFont(context, window.getComputedStyle(date));
        context.fillText(date.textContent || "", datePosition.x, datePosition.y);
      }
      var humanBadge = paper.querySelector(".human-edited-badge");
      if (humanBadge) {
        var badgePosition = relativePosition(humanBadge, bounds);
        canvasFont(context, window.getComputedStyle(humanBadge));
        context.fillText(humanBadge.textContent || "", badgePosition.x, badgePosition.y);
      }
      var lineNodes = paper.querySelectorAll(".poem-line p");
      for (var index = 0; index < lineNodes.length; index += 1) {
        var linePosition = relativePosition(lineNodes[index], bounds);
        canvasFont(context, window.getComputedStyle(lineNodes[index]));
        context.shadowColor = "rgba(248,245,237,0.9)";
        context.shadowBlur = 12;
        context.fillText(lineNodes[index].textContent || "", linePosition.x, linePosition.y, width - linePosition.x - 18);
        context.shadowBlur = 0;
      }
      var footer = paper.querySelector(".paper-footer");
      if (footer) {
        var labels = footer.querySelectorAll("span");
        for (index = 0; index < labels.length; index += 1) {
          var labelPosition = relativePosition(labels[index], bounds);
          canvasFont(context, window.getComputedStyle(labels[index]));
          context.fillText(labels[index].textContent || "", labelPosition.x, labelPosition.y);
        }
      }
      var name = filename(state.haiku.createdAt);
      var image = imageFromCanvas(output, name);
      var shareData = { files: [image.file] };
      if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare(shareData)) {
        navigator.share(shareData).then(function () {
          return;
        }).catch(function (error) {
          if (!error || error.name !== "AbortError") downloadImage(image.dataUrl, name);
        });
        return;
      }
      downloadImage(image.dataUrl, name);
    } catch {
      setError(copy().saveError);
    }
  }

  function downloadImage(dataUrl, name) {
    var link = document.createElement("a");
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function closestWithAttribute(target, attribute) {
    var element = target && target.nodeType === 1 ? target : target && target.parentElement;
    while (element && element !== document.documentElement) {
      if (element.hasAttribute && element.hasAttribute(attribute)) return element;
      element = element.parentElement;
    }
    return null;
  }

  var lineMenu = null;

  function closeLineMenu() {
    if (lineMenu && lineMenu.parentNode) lineMenu.parentNode.removeChild(lineMenu);
    lineMenu = null;
    var triggers = document.querySelectorAll("[data-line-trigger]");
    for (var index = 0; index < triggers.length; index += 1) {
      triggers[index].setAttribute("aria-expanded", "false");
    }
  }

  function openLineMenu(index) {
    closeLineMenu();
    var current = copy();
    var row = document.querySelector('[data-line-index="' + index + '"]');
    var form = document.querySelector(".modern-generator-form, .generator-form");
    if (!row || !form) return;
    var menu = document.createElement("div");
    menu.className = "line-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", current.lineMenuLabel);
    menu.setAttribute("data-index", String(index));
    var haikulyButton = document.createElement("button");
    haikulyButton.type = "button";
    haikulyButton.setAttribute("data-line-haikuly", String(index));
    haikulyButton.textContent = current.haikulyThis;
    var copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.setAttribute("data-line-copy", String(index));
    copyButton.textContent = current.copyLine;
    menu.appendChild(haikulyButton);
    menu.appendChild(copyButton);
    var rowRect = row.getBoundingClientRect();
    var formRect = form.getBoundingClientRect();
    var left = Math.max(8, Math.min(rowRect.left - formRect.left, formRect.width - 190));
    menu.style.top = String(rowRect.bottom - formRect.top + 6) + "px";
    menu.style.left = String(left) + "px";
    form.appendChild(menu);
    lineMenu = menu;
    var trigger = row.querySelector("[data-line-trigger]");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  function haikulyThisLine(index) {
    closeLineMenu();
    if (!state.haiku) return;
    var source = state.displayLines || state.haiku.lines;
    var line = source[index];
    var haikuLanguage = state.haikuLanguage || state.language;
    state.mode = "keyword";
    state.keyword = line;
    state.language = haikuLanguage;
    var input = byId("keyword");
    if (input) input.value = line;
    var counter = document.querySelector(".input-wrap span");
    if (counter) setText(counter, String(line.length) + "/48");
    setError("");
    updateControls();
    generate();
  }

  function copyLine(index) {
    if (!state.haiku) return;
    var source = state.displayLines || state.haiku.lines;
    var line = source[index];
    var current = copy();
    function finishCopy() {
      var button = lineMenu && lineMenu.querySelector("[data-line-copy]");
      if (button) setText(button, current.copiedLine);
      window.setTimeout(closeLineMenu, 1200);
    }
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = line;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(textarea);
      if (ok) finishCopy();
      else setError(current.copyLineError);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(line).then(finishCopy, fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  document.addEventListener("click", function (event) {
    if (reactReady()) return;
    var lineTrigger = closestWithAttribute(event.target, "data-line-trigger");
    if (lineTrigger) {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback();
      var triggerIndex = Number(lineTrigger.getAttribute("data-line-trigger"));
      if (lineMenu && lineMenu.getAttribute("data-index") === String(triggerIndex)) closeLineMenu();
      else openLineMenu(triggerIndex);
      return;
    }
    var haikulyButton = closestWithAttribute(event.target, "data-line-haikuly");
    if (haikulyButton) {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback();
      haikulyThisLine(Number(haikulyButton.getAttribute("data-line-haikuly")));
      return;
    }
    var copyButton = closestWithAttribute(event.target, "data-line-copy");
    if (copyButton) {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback();
      copyLine(Number(copyButton.getAttribute("data-line-copy")));
      return;
    }
    if (lineMenu && !lineMenu.contains(event.target)) closeLineMenu();
    var languageButton = closestWithAttribute(event.target, "data-language");
    if (languageButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      activateFallback();
      state.language = languageButton.getAttribute("data-language") || "en";
      setError(""); updateControls(); return;
    }
    var modeButton = closestWithAttribute(event.target, "data-mode");
    var formButton = closestWithAttribute(event.target, "data-haiku-form");
    if (formButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      activateFallback();
      var nextForm = formButton.getAttribute("data-haiku-form") || "modern";
      if (nextForm === state.haikuForm) return;
      state.haikuForm = nextForm;
      clearRenderedHaiku(); setError(""); updateControls(); return;
    }
    if (modeButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      activateFallback();
      state.mode = modeButton.getAttribute("data-mode") || "random";
      setError(""); updateControls(); return;
    }
    var idButton = closestWithAttribute(event.target, "id");
    if (idButton && idButton.id === "edit-haiku") {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback(); toggleEdit(); return;
    }
    if (idButton && idButton.id === "revert-haiku") {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback(); revertEdit(); return;
    }
    if (idButton && idButton.id === "save-haiku") {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback(); saveHaiku();
    }
  }, true);

  document.addEventListener("submit", function (event) {
    if (reactReady()) return;
    var form = event.target;
    if (form && form.classList && (form.classList.contains("generator-form") || form.classList.contains("modern-generator-form"))) {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback(); generate();
    }
  }, true);

  document.addEventListener("input", function (event) {
    if (reactReady()) return;
    var target = event.target;
    if (target && target.hasAttribute && target.hasAttribute("data-line-input")) {
      var lineIndex = Number(target.getAttribute("data-line-input"));
      if (state.displayLines) {
        state.displayLines[lineIndex] = target.textContent || "";
        updateLineCounts();
        updateHumanBadge();
        updateControls();
      }
      return;
    }
    if (target && target.id === "keyword") {
      state.keyword = target.value;
      publishState();
      var counter = document.querySelector(".input-wrap span");
      setText(counter, String(target.value.length) + "/48");
      setError("");
    }
  }, true);

  window.addEventListener("resize", function () {
    if (!reactReady() && state.haiku) {
      var canvas = document.querySelector(".ink-wash-canvas");
      if (canvas) drawInk(canvas, state.haiku);
    }
  });

  window.__STILLPOINT_INLINE_READY__ = true;
  publishState();
}());
