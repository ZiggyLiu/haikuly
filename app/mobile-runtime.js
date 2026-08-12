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
      pageTitle: "Spring Whispers, Haiku-ly~",
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
      pageTitle: "春风十里，Haiku-ly~",
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
      pageTitle: "春のささやき、Haiku-ly~",
      heroTitle: "春のささやき、", heroTitleAccent: "Haiku-ly~"
    }
  };

  var state = {
    language: "en", mode: "random", keyword: "", error: "", haiku: null,
    haikuLanguage: "en", generating: false
  };

  function publishState() {
    window.__STILLPOINT_FALLBACK_STATE__ = {
      language: state.language,
      mode: state.mode,
      keyword: state.keyword,
      error: state.error,
      haiku: state.haiku,
      haikuLanguage: state.haikuLanguage,
      generating: state.generating
    };
  }

  function reactReady() {
    return window.__STILLPOINT_FALLBACK_ACTIVE__ !== true && window.__STILLPOINT_REACT_READY__ === true;
  }
  function activateFallback() { window.__STILLPOINT_FALLBACK_ACTIVE__ = true; publishState(); }
  function byId(id) { return document.getElementById(id); }
  function copy() { return COPY[state.language]; }
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
    document.title = current.pageTitle;
    setText(byId("hero-title"), current.heroTitle);
    setText(byId("hero-accent"), current.heroTitleAccent);
    var languageButtons = document.querySelectorAll("[data-language]");
    var modeButtons = document.querySelectorAll("[data-mode]");
    var index;
    for (index = 0; index < languageButtons.length; index += 1) {
      var languageActive = languageButtons[index].getAttribute("data-language") === state.language;
      languageButtons[index].className = languageActive ? "active" : "";
      languageButtons[index].setAttribute("aria-pressed", languageActive ? "true" : "false");
    }
    for (index = 0; index < modeButtons.length; index += 1) {
      var modeActive = modeButtons[index].getAttribute("data-mode") === state.mode;
      modeButtons[index].className = modeActive ? "active" : "";
      modeButtons[index].setAttribute("aria-pressed", modeActive ? "true" : "false");
    }

    setText(document.querySelector(".language-label"), current.languageLabel);
    setText(document.querySelector(".language-rule"), current.languageRule);
    var languageGroup = document.querySelector(".language-switch");
    var modeGroup = document.querySelector(".mode-switch");
    if (languageGroup) languageGroup.setAttribute("aria-label", current.languageGroup);
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
    updateGenerateButton();
    publishState();
  }

  function updateGenerateButton() {
    var button = byId("generate-haiku");
    if (!button) return;
    var current = copy();
    button.disabled = state.generating;
    setActionCopy(button, state.generating ? current.generating : (state.mode === "random" ? current.generateRandom : current.generateKeyword));
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
    context.beginPath();
    if (motif === "mountains") {
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
  }

  function renderHaiku(haiku, language) {
    state.haiku = haiku;
    state.haikuLanguage = language;
    publishState();
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
    var lines = byId("poem-lines");
    if (lines) {
      while (lines.firstChild) lines.removeChild(lines.firstChild);
      lines.className = "poem-lines";
      if (language === "en") {
        var longest = Math.max(haiku.lines[0].length, haiku.lines[1].length, haiku.lines[2].length);
        if (longest > 38) lines.className += " lines-extra-tight";
        else if (longest > 27) lines.className += " lines-tight";
      }
      lines.setAttribute("lang", language === "zh" ? "zh-CN" : language);
      for (var index = 0; index < haiku.lines.length; index += 1) {
        var row = document.createElement("div");
        row.className = "poem-line";
        var paragraph = document.createElement("p");
        paragraph.textContent = haiku.lines[index];
        row.appendChild(paragraph);
        lines.appendChild(row);
      }
    }
    var save = byId("save-haiku");
    if (save) save.disabled = false;
    drawInk(canvas, haiku);
  }

  function generate() {
    if (state.generating) return;
    var current = copy();
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
    fetch("/api/haiku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().then(function (result) { return { response: response, result: result }; });
    }).then(function (packet) {
      if (!packet.response.ok || !packet.result.haiku) throw new Error("generation");
      renderHaiku(packet.result.haiku, packet.result.language || state.language);
    }).catch(function (error) {
      setError(error && error.message === "generation" ? current.generationError : current.unreachableError);
    }).then(function () {
      state.generating = false;
      updateGenerateButton();
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
    if (isNaN(date.getTime())) return "stillpoint-haiku.png";
    function pad(value) { return value < 10 ? "0" + value : String(value); }
    return "stillpoint-haiku-" + date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + ".png";
  }

  function imageFromCanvas(canvas, name) {
    var dataUrl = canvas.toDataURL("image/png");
    var binary = window.atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return { dataUrl: dataUrl, file: new File([bytes], name, { type: "image/png", lastModified: Date.now() }) };
  }

  function saveHaiku() {
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

      var date = byId("paper-date");
      if (date) {
        var datePosition = relativePosition(date, bounds);
        canvasFont(context, window.getComputedStyle(date));
        context.fillText(date.textContent || "", datePosition.x, datePosition.y);
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

  document.addEventListener("click", function (event) {
    if (reactReady()) return;
    var languageButton = closestWithAttribute(event.target, "data-language");
    if (languageButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      activateFallback();
      state.language = languageButton.getAttribute("data-language") || "en";
      setError(""); updateControls(); return;
    }
    var modeButton = closestWithAttribute(event.target, "data-mode");
    if (modeButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      activateFallback();
      state.mode = modeButton.getAttribute("data-mode") || "random";
      setError(""); updateControls(); return;
    }
    var saveButton = closestWithAttribute(event.target, "id");
    if (saveButton && saveButton.id === "save-haiku") {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback(); saveHaiku();
    }
  }, true);

  document.addEventListener("submit", function (event) {
    if (reactReady()) return;
    var form = event.target;
    if (form && form.classList && form.classList.contains("generator-form")) {
      event.preventDefault(); event.stopImmediatePropagation(); activateFallback(); generate();
    }
  }, true);

  document.addEventListener("input", function (event) {
    if (reactReady()) return;
    if (event.target && event.target.id === "keyword") {
      state.keyword = event.target.value;
      publishState();
      var counter = document.querySelector(".input-wrap span");
      setText(counter, String(event.target.value.length) + "/48");
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
