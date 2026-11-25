// スライド共通部品（slides/template/_DESIGN.md の値をそのまま使う）
// 使い方: npm install のあと  node slides/build/<資料名>.js
// フォントを変えたいとき: createDeck({ font: "Noto Sans JP" }) か 環境変数 SLIDE_FONT
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const C = {
  BG: "F2F0EB", ACCENT: "E8491F", SOFT: "E8825F", INK: "1A1A1A", SUB: "6B6B6B",
  DARK: "1E1E1E", ON_DARK: "EDEDED", WHITE: "FFFFFF", RULE: "C9C5BC",
};
const DEFAULT_FONT = "Hiragino Sans";
const NUM = "Helvetica";
const MONO = "Menlo";
const pad = (n) => String(n).padStart(2, "0");

function createDeck({ title, event, font }) {
  const F = font || process.env.SLIDE_FONT || DEFAULT_FONT;
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = title;
  let page = 0;
  const S = pres.shapes;

  const newSlide = (bg = C.BG) => { const s = pres.addSlide(); s.background = { color: bg }; page++; return s; };
  const pageNum = (s, color = C.SUB) =>
    s.addText(String(page), { x: 12.0, y: 6.95, w: 0.6, h: 0.3, fontFace: NUM, fontSize: 10, color, align: "right", margin: 0 });
  const rect = (s, x, y, w, h, color) => s.addShape(S.RECTANGLE, { x, y, w, h, fill: { color }, line: { color, width: 0 } });
  const hline = (s, x, y, w, color = C.RULE, width = 1, dash) =>
    s.addShape(S.LINE, { x, y, w, h: 0, line: { color, width, ...(dash ? { dashType: "dash" } : {}) } });
  const vline = (s, x, y, h, color = C.RULE) => s.addShape(S.LINE, { x, y, w: 0, h, line: { color, width: 1 } });
  const num = (s, n, x, y, o = {}) =>
    s.addText(pad(n), { x, y, w: 0.9, h: 0.45, fontFace: NUM, fontSize: 24, bold: true, color: C.ACCENT, margin: 0, valign: "middle", ...o });

  // 【】で囲んだ語をアクセント色に
  const accentRuns = (text, base) => {
    const runs = [];
    text.split("\n").forEach((line, li, arr) => {
      const parts = line.split(/(【[^】]+】)/).filter(Boolean);
      parts.forEach((p, pi) => {
        const hit = p.startsWith("【");
        const o = { ...base, color: hit ? C.ACCENT : base.color };
        if (pi === parts.length - 1 && li < arr.length - 1) o.breakLine = true;
        runs.push({ text: hit ? p.slice(1, -1) : p, options: o });
      });
    });
    return runs;
  };
  const header = (s, eyebrow, title) => {
    s.addText(eyebrow, { x: 0.75, y: 0.4, w: 11.8, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: C.ACCENT, margin: 0, charSpacing: 1 });
    s.addText(title, { x: 0.75, y: 0.68, w: 11.8, h: 0.65, fontFace: F, fontSize: 30, bold: true, color: C.INK, margin: 0, valign: "middle" });
    hline(s, 0.75, 1.42, 11.83, C.ACCENT, 3);
    pageNum(s);
  };
  const note = (s, text, y = 6.2) =>
    s.addText([
      { text: "NOTE — ", options: { bold: true, color: C.ACCENT } },
      { text, options: { color: C.SUB } },
    ], { x: 0.75, y, w: 11.8, h: 0.35, fontFace: F, fontSize: 11, margin: 0 });
  const lead = (s, text, y = 1.75) => {
    rect(s, 0.75, y, 11.83, 0.55, C.ACCENT);
    s.addText(text, { x: 1.05, y, w: 11.4, h: 0.55, fontFace: F, fontSize: 16, bold: true, color: C.WHITE, margin: 0, valign: "middle" });
  };
  // 画像があれば枠内に収めて貼る。なければ ACCENT_SOFT のプレースホルダ
  const missing = [];
  const image = (s, rel, x, y, w, h) => {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) { s.addImage({ path: abs, x, y, w, h, sizing: { type: "contain", w, h } }); return; }
    missing.push(rel);
    rect(s, x, y, w, h, C.SOFT);
    s.addText(rel, { x, y, w, h, fontFace: F, fontSize: 12, color: C.WHITE, align: "center", valign: "middle", margin: 0 });
  };
  const sq = (s, x, y) => rect(s, x, y, 0.12, 0.12, C.ACCENT);
  // 白い角丸カード（影は毎回新しいオブジェクトで渡す）
  const card = (s, x, y, w, h, color = C.WHITE) =>
    s.addShape(S.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.14, fill: { color }, line: { color: color === C.WHITE ? "E4E0D8" : color, width: 0.75 },
      shadow: { type: "outer", color: "000000", opacity: 0.08, blur: 6, offset: 2, angle: 90 } });
  // オレンジの丸に番号やアイコン
  const badge = (s, x, y, t) => {
    s.addShape(S.OVAL, { x, y, w: 0.55, h: 0.55, fill: { color: C.ACCENT }, line: { color: C.ACCENT, width: 0 } });
    s.addText(t, { x, y, w: 0.55, h: 0.55, fontFace: NUM, fontSize: /^\d+$/.test(t) ? 15 : 18, bold: true, color: C.WHITE, align: "center", valign: "middle", margin: 0 });
  };
  const bulletList = (s, items, x, y, w, h, size = 15) =>
    s.addText(items.map((t, i) => ({ text: t, options: { bullet: { indent: 16 }, breakLine: i < items.length - 1 } })),
      { x, y, w, h, fontFace: F, fontSize: size, color: C.INK, margin: 0, valign: "top", paraSpaceAfter: 8, lineSpacingMultiple: 1.2 });

  const L = {
    // ---- 汎用レイアウト（_DESIGN.md のカタログ名に対応）----
    // bullets: 1カラム箇条書き。items は文字列、または [見出し, [子項目...]]
    bullets({ eyebrow, title, lead: ld, items, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      let y = 1.9;
      if (ld) { lead(s, ld); y = 2.7; }
      const runs = [];
      items.forEach((it, i) => {
        const [h, kids = []] = Array.isArray(it) ? it : [it];
        runs.push({ text: h, options: { bullet: { indent: 18 }, fontSize: 18, breakLine: true } });
        kids.forEach((k) => runs.push({ text: k, options: { bullet: { indent: 18 }, indentLevel: 1, fontSize: 15, color: C.SUB, breakLine: true } }));
      });
      runs[runs.length - 1].options.breakLine = false;
      s.addText(runs, { x: 0.9, y, w: 11.5, h: 6.1 - y, fontFace: F, color: C.INK, margin: 0, valign: "top", paraSpaceAfter: 10, lineSpacingMultiple: 1.25 });
      if (n) note(s, n, 6.35);
    },
    // imageSide: 画像と文章を左右に。side: "right"（既定・画像が右）| "left"
    // blocks: [{ h: "見出し", items: ["...", "..."] }]
    imageSide({ eyebrow, title, img, caption, blocks, side = "right", note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      const imgX = side === "right" ? 6.9 : 0.75, txtX = side === "right" ? 0.75 : 6.6, txtW = 5.6;
      image(s, img, imgX, 1.85, 5.7, 4.0);
      if (caption) s.addText(caption, { x: imgX, y: 5.95, w: 5.7, h: 0.35, fontFace: F, fontSize: 11, color: C.SUB, margin: 0 });
      let y = 1.9;
      const per = (6.2 - y) / blocks.length;
      blocks.forEach((b) => {
        sq(s, txtX, y + 0.17);
        s.addText(b.h, { x: txtX + 0.25, y, w: txtW - 0.25, h: 0.45, fontFace: F, fontSize: 18, bold: true, color: C.INK, margin: 0, valign: "middle" });
        bulletList(s, b.items, txtX, y + 0.6, txtW, per - 0.7, 15);
        y += per;
      });
      if (n) note(s, n, 6.4);
    },
    // imageFull: スクショ1枚を大きく
    imageFull({ eyebrow, title, img, caption, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      image(s, img, 0.9, 1.75, 11.5, caption ? 4.3 : 4.6);
      if (caption) s.addText(caption, { x: 0.9, y: 6.15, w: 11.5, h: 0.35, fontFace: F, fontSize: 12, color: C.SUB, margin: 0, align: "center" });
      if (n) note(s, n, 6.55);
    },
    // custom: ヘッダーだけ用意して中身は自由に描く。draw(s, { pres, C, F, card, badge, image, note, lead })
    custom({ eyebrow, title }, draw) {
      const s = newSlide();
      if (title) header(s, eyebrow, title); else pageNum(s);
      draw(s, { pres, S, C, F, MONO, NUM, card, badge, image, note, lead, rect, hline, accentRuns });
    },
    title({ eyebrow, title, date, right }) {
      const s = newSlide();
      s.addShape(S.OVAL, { x: 6.55, y: -1.0, w: 9.5, h: 9.5, fill: { color: C.ACCENT }, line: { color: C.ACCENT, width: 0 } });
      s.addText(eyebrow || event, { x: 0.85, y: 0.85, w: 6.5, h: 0.35, fontFace: F, fontSize: 14, bold: true, color: C.INK, margin: 0 });
      s.addText(title, { x: 0.85, y: 1.9, w: 6.6, h: 3.6, fontFace: F, fontSize: 44, bold: true, color: C.INK, margin: 0, valign: "middle", lineSpacingMultiple: 1.15, fit: "shrink" });
      if (date) s.addText(date, { x: 0.85, y: 6.55, w: 5, h: 0.35, fontFace: F, fontSize: 14, bold: true, color: C.INK, margin: 0 });
      if (right) s.addText(right, { x: 7.6, y: 6.55, w: 5.0, h: 0.35, fontFace: F, fontSize: 14, bold: true, color: C.WHITE, margin: 0, align: "right" });
    },
    agenda(items) {
      const s = newSlide();
      s.addText("CONTENTS", { x: 0.75, y: 2.9, w: 3.2, h: 0.6, fontFace: NUM, fontSize: 28, bold: true, color: C.ACCENT, margin: 0 });
      s.addText("目次", { x: 0.75, y: 3.5, w: 3.2, h: 0.3, fontFace: F, fontSize: 11, color: C.SUB, margin: 0 });
      const rowH = Math.min(1.1, 5.7 / items.length), top = 0.85 + (5.7 - rowH * items.length) / 2;
      const size = items.length > 5 ? 20 : 22;
      items.forEach((t, i) => {
        const y = top + i * rowH;
        s.addText(pad(i + 1), { x: 4.2, y, w: 0.8, h: rowH, fontFace: NUM, fontSize: size, bold: true, color: C.ACCENT, margin: 0, valign: "middle" });
        rect(s, 5.0, y + rowH / 2 - 0.2, 0.05, 0.4, C.ACCENT);
        s.addText(t, { x: 5.3, y, w: 7, h: rowH, fontFace: F, fontSize: size, bold: true, color: C.INK, margin: 0, valign: "middle" });
        if (i < items.length - 1) hline(s, 4.2, y + rowH, 8.1, C.RULE, 1, true);
      });
      pageNum(s);
    },
    purpose({ label = "PURPOSE", text, cols, strong }) {
      const s = newSlide();
      s.addShape(S.ROUNDED_RECTANGLE, { x: 0.75, y: 0.62, w: 1.6, h: 0.42, rectRadius: 0.21, fill: { color: C.ACCENT }, line: { color: C.ACCENT, width: 0 } });
      s.addText(label, { x: 0.75, y: 0.62, w: 1.6, h: 0.42, fontFace: NUM, fontSize: 12, bold: true, color: C.WHITE, align: "center", valign: "middle", margin: 0, charSpacing: 1 });
      s.addText(accentRuns(text, { fontFace: F, fontSize: 38, bold: true, color: C.INK }), { x: 0.75, y: 1.3, w: 11.8, h: 2.7, margin: 0, valign: "middle", lineSpacingMultiple: 1.3 });
      hline(s, 0.75, 4.35, 11.83, C.ACCENT, 2);
      const w = 11.8 / cols.length;
      cols.forEach(([h, d], i) => {
        const x = 0.85 + i * w;
        num(s, i + 1, x, 4.7);
        s.addText(h, { x, y: 5.25, w: w - 0.5, h: 0.4, fontFace: F, fontSize: 18, bold: true, color: C.INK, margin: 0 });
        s.addText(d, { x, y: 5.75, w: w - 0.5, h: 0.8, fontFace: F, fontSize: strong ? 15 : 13, color: strong ? C.INK : C.SUB, margin: 0, valign: "top" });
        if (i > 0) vline(s, x - 0.25, 4.7, 1.9);
      });
      pageNum(s);
    },
    message(text, sub) {
      const s = newSlide();
      s.addText(accentRuns(text, { fontFace: F, fontSize: 40, bold: true, color: C.INK }), { x: 0.9, y: 1.9, w: 11.5, h: 2.9, margin: 0, valign: "middle", lineSpacingMultiple: 1.35 });
      if (sub) s.addText(sub, { x: 0.9, y: 5.0, w: 11.5, h: 0.5, fontFace: F, fontSize: 15, color: C.SUB, margin: 0 });
      pageNum(s);
    },
    section(no, title, sub) {
      const s = newSlide(C.ACCENT);
      s.addText(pad(no), { x: 0.9, y: 2.95, w: 1.2, h: 0.9, fontFace: NUM, fontSize: 40, bold: true, color: C.WHITE, margin: 0, valign: "middle" });
      rect(s, 2.15, 3.0, 0.06, 0.8, C.WHITE);
      s.addText(title, { x: 2.5, y: 2.95, w: 10.3, h: 0.9, fontFace: F, fontSize: 36, bold: true, color: C.WHITE, margin: 0, valign: "middle", fit: "shrink" });
      if (sub) s.addText(sub, { x: 2.5, y: 4.0, w: 10, h: 0.5, fontFace: F, fontSize: 16, color: C.WHITE, transparency: 20, margin: 0 });
      s.addText(event, { x: 0.75, y: 6.85, w: 6, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: C.WHITE, margin: 0 });
      pageNum(s, C.WHITE);
    },
    profile({ eyebrow = "SELF INTRODUCTION", title = "自己紹介", img, name, rows }) {
      const s = newSlide();
      header(s, eyebrow, title);
      image(s, img, 0.75, 1.9, 5.4, 4.3);
      sq(s, 6.6, 2.12);
      s.addText(name, { x: 6.85, y: 1.9, w: 5.7, h: 0.55, fontFace: F, fontSize: 26, bold: true, color: C.INK, margin: 0, valign: "middle" });
      rows.forEach(([k, v], i) => {
        const y = 2.85 + i * 0.8;
        s.addText(k, { x: 6.6, y, w: 1.9, h: 0.5, fontFace: F, fontSize: 12, bold: true, color: C.SUB, margin: 0, valign: "middle" });
        s.addText(v, { x: 8.5, y, w: 4.1, h: 0.5, fontFace: F, fontSize: 15, color: C.INK, margin: 0, valign: "middle" });
        hline(s, 6.6, y + 0.62, 6.0, C.RULE, 1, true);
      });
    },
    timeline({ eyebrow, title, steps, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      const x0 = 1.6, span = 10.1, step = span / (steps.length - 1), lineY = 3.05;
      hline(s, x0, lineY, span, C.RULE, 2);
      steps.forEach(([h, d], i) => {
        const cx = x0 + i * step, last = i === steps.length - 1;
        s.addText(pad(i + 1), { x: cx - 0.6, y: 2.0, w: 1.2, h: 0.5, fontFace: NUM, fontSize: 24, bold: true, color: C.ACCENT, align: "center", margin: 0 });
        s.addShape(S.OVAL, { x: cx - 0.16, y: lineY - 0.16, w: 0.32, h: 0.32, fill: { color: last ? C.ACCENT : C.BG }, line: { color: C.ACCENT, width: 2.5 } });
        if (i < steps.length - 1)
          s.addText("→", { x: cx + step / 2 - 0.3, y: lineY - 0.55, w: 0.6, h: 0.4, fontFace: F, fontSize: 18, color: C.RULE, align: "center", margin: 0 });
        s.addText(h, { x: cx - 1.7, y: 3.5, w: 3.4, h: 0.5, fontFace: F, fontSize: 19, bold: true, color: last ? C.ACCENT : C.INK, align: "center", margin: 0 });
        s.addText(d, { x: cx - 1.7, y: 4.1, w: 3.4, h: 1.2, fontFace: F, fontSize: 13, color: C.SUB, align: "center", valign: "top", margin: 0 });
      });
      if (n) note(s, n);
    },
    // 画像付きカード（2〜3枚）
    cards({ eyebrow, title, cards, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      const gap = 0.5, w = (11.83 - gap * (cards.length - 1)) / cards.length, imgH = cards.length === 2 ? 2.7 : 2.4;
      cards.forEach((c, i) => {
        const x = 0.75 + i * (w + gap);
        num(s, i + 1, x, 1.7);
        image(s, c.img, x, 2.25, w, imgH);
        s.addText(c.name, { x, y: 2.25 + imgH + 0.2, w, h: 0.45, fontFace: F, fontSize: 18, bold: true, color: C.INK, margin: 0 });
        bulletList(s, c.points, x, 2.25 + imgH + 0.75, w, 1.3, 13);
        if (i > 0) vline(s, x - gap / 2, 1.75, 4.45);
      });
      if (n) note(s, n, 6.55);
    },
    // 番号 + 見出し + 説明 を横に並べる（3〜4項目）
    points({ eyebrow, title, lead: ld, items, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      let top = 1.85;
      if (ld) { lead(s, ld); top = 2.75; }
      const gap = 0.4, w = (11.83 - gap * (items.length - 1)) / items.length;
      items.forEach(([h, d], i) => {
        const x = 0.75 + i * (w + gap);
        hline(s, x, top, w);
        num(s, i + 1, x, top + 0.25);
        s.addText(h, { x, y: top + 0.85, w, h: 0.8, fontFace: F, fontSize: 18, bold: true, color: C.INK, margin: 0, valign: "top" });
        s.addText(d, { x, y: top + 1.7, w, h: 1.7, fontFace: F, fontSize: 13, color: C.SUB, margin: 0, valign: "top", lineSpacingMultiple: 1.25 });
      });
      if (n) note(s, n);
    },
    grid4({ eyebrow, title, lead: ld, cells, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      if (ld) lead(s, ld);
      cells.forEach(([h, d], i) => {
        const x = 0.75 + (i % 2) * 6.33, y = 2.65 + Math.floor(i / 2) * 1.75;
        hline(s, x, y, 5.5);
        num(s, i + 1, x, y + 0.2, { w: 0.8 });
        s.addText(h, { x: x + 0.85, y: y + 0.2, w: 4.65, h: 0.45, fontFace: F, fontSize: 17, bold: true, color: C.INK, margin: 0, valign: "middle" });
        s.addText(d, { x: x + 0.85, y: y + 0.72, w: 4.65, h: 0.95, fontFace: F, fontSize: 12, color: C.SUB, margin: 0, valign: "top", lineSpacingMultiple: 1.2 });
      });
      if (n) note(s, n, 6.3);
    },
    table({ eyebrow, title, head, rows, colW, bold = [], align = [], note: n, size = 14, rowH = 0.6, lead: ld }) {
      const s = newSlide();
      header(s, eyebrow, title);
      let y = 1.85;
      if (ld) { lead(s, ld); y = 2.55; }
      const none = { type: "none" };
      const hd = head.map((t, j) => ({ text: t, options: { bold: true, color: C.SUB, fontSize: 12, align: align[j] || "left",
        border: [none, none, { pt: 2, color: C.ACCENT }, none] } }));
      const body = rows.map((r, i) => r.map((t, j) => ({ text: t, options: {
        bold: bold.includes(i) || j === 0, color: j === 0 ? C.INK : (bold.includes(i) ? C.ACCENT : C.INK),
        fontSize: j === 0 ? size : size - 1, align: align[j] || "left",
        border: [none, none, { pt: 0.75, color: C.RULE }, none] } })));
      s.addTable([hd, ...body], { x: 0.75, y, w: 11.83, colW, rowH, fontFace: F, valign: "middle", margin: [0.04, 0.1, 0.04, 0.1] });
      if (n) note(s, n, 6.45);
    },
    numbered({ eyebrow, title, items, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      const gap = Math.min(1.5, 4.6 / items.length);
      items.forEach((it, i) => {
        const y = 1.9 + i * gap;
        num(s, i + 1, 0.9, y);
        s.addText(it.h, { x: 1.9, y, w: 10.5, h: 0.45, fontFace: F, fontSize: 18, bold: true, color: C.INK, margin: 0, valign: "middle" });
        s.addText("→ " + it.d, { x: 1.9, y: y + 0.5, w: 10.5, h: 0.4, fontFace: F, fontSize: 14, color: C.SUB, margin: 0, valign: "middle" });
        if (i < items.length - 1) hline(s, 0.9, y + gap - 0.2, 11.5, C.RULE, 1, true);
      });
      if (n) note(s, n, 6.4);
    },
    // side: 行ごとの説明（コードと同じ行数。空文字で説明なし）。右側に揃えて表示
    code({ eyebrow, title, label, code, side, sideX = 7.9, note: n, size = 12 }) {
      const s = newSlide();
      header(s, eyebrow, title);
      s.addShape(S.ROUNDED_RECTANGLE, { x: 0.75, y: 1.8, w: 11.83, h: 4.4, rectRadius: 0.1, fill: { color: C.DARK }, line: { color: C.DARK, width: 0 } });
      s.addText(label, { x: 1.1, y: 2.0, w: 6, h: 0.3, fontFace: NUM, fontSize: 11, bold: true, color: C.ACCENT, margin: 0, charSpacing: 1 });
      const box = { y: 2.4, h: 3.65, fontFace: MONO, fontSize: size, margin: 0, valign: "top", lineSpacing: Math.round(size * 1.55) };
      // 行の高さを左右で揃えるため、固定の行間＋空行は全角スペースで埋める
      const fill = (t) => t.split("\n").map((l) => l || "　").join("\n");
      s.addText(fill(code), { ...box, x: 1.1, w: side ? sideX - 1.2 : 11.2, color: C.ON_DARK });
      if (side) s.addText(fill(side.join("\n")), { ...box, x: sideX, w: 12.4 - sideX, color: C.SOFT });
      if (n) note(s, n, 6.4);
    },
    twoCol({ eyebrow, title, left, right, note: n, lead: ld }) {
      const s = newSlide();
      header(s, eyebrow, title);
      let y = 1.9;
      if (ld) { lead(s, ld); y = 2.7; }
      [[left, 0.75], [right, 6.9]].forEach(([col, x]) => {
        sq(s, x, y + 0.17);
        s.addText(col.h, { x: x + 0.25, y, w: 5.4, h: 0.45, fontFace: F, fontSize: 18, bold: true, color: C.INK, margin: 0, valign: "middle" });
        bulletList(s, col.items, x, y + 0.7, 5.6, 6.0 - y, 15);
      });
      vline(s, 6.6, y, 6.0 - y);
      if (n) note(s, n, 6.35);
    },
    compare2({ eyebrow, title, cards, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      cards.forEach((c, i) => {
        const x = 0.75 + i * 6.5, w = 5.33;
        s.addShape(S.ROUNDED_RECTANGLE, { x, y: 1.85, w, h: 4.3, rectRadius: 0.25, fill: { color: C.BG }, line: { color: C.ACCENT, width: 1.5 } });
        s.addText(c.name, { x: x + 0.4, y: 2.1, w: w - 0.8, h: 0.5, fontFace: F, fontSize: 22, bold: true, color: C.INK, margin: 0 });
        s.addText(c.sub, { x: x + 0.4, y: 2.62, w: w - 0.8, h: 0.35, fontFace: F, fontSize: 12, color: C.SUB, margin: 0 });
        hline(s, x + 0.4, 3.1, 0.8, C.ACCENT, 2);
        s.addText(c.points.map((t, j) => ({ text: "✅  " + t, options: { breakLine: j < c.points.length - 1 } })),
          { x: x + 0.4, y: 3.35, w: w - 0.8, h: 2.6, fontFace: F, fontSize: 14, color: C.INK, margin: 0, valign: "top", paraSpaceAfter: 10, lineSpacingMultiple: 1.2 });
      });
      s.addText("VS", { x: 6.08, y: 3.7, w: 1.17, h: 0.6, fontFace: NUM, fontSize: 20, bold: true, color: C.ACCENT, align: "center", margin: 0 });
      if (n) note(s, n, 6.4);
    },
    // 左から右への処理フロー（3〜4ボックス）
    flow({ eyebrow, title, lead: ld, steps, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      if (ld) lead(s, ld);
      const gap = 0.7, w = (11.83 - gap * (steps.length - 1)) / steps.length, y = 2.85;
      steps.forEach(([h, sub, d], i) => {
        const x = 0.75 + i * (w + gap), main = i === Math.floor(steps.length / 2);
        s.addShape(S.ROUNDED_RECTANGLE, { x, y, w, h: 1.3, rectRadius: 0.12, fill: { color: main ? C.ACCENT : C.WHITE }, line: { color: C.ACCENT, width: 1.5 } });
        s.addText(h, { x: x + 0.15, y: y + 0.18, w: w - 0.3, h: 0.5, fontFace: F, fontSize: 18, bold: true, color: main ? C.WHITE : C.INK, align: "center", margin: 0, valign: "middle" });
        s.addText(sub, { x: x + 0.15, y: y + 0.7, w: w - 0.3, h: 0.4, fontFace: MONO, fontSize: 11, color: main ? C.WHITE : C.SUB, align: "center", margin: 0, valign: "middle" });
        s.addText(d, { x, y: y + 1.55, w, h: 1.4, fontFace: F, fontSize: 13, color: C.SUB, align: "center", margin: 0, valign: "top", lineSpacingMultiple: 1.2 });
        if (i < steps.length - 1)
          s.addShape(S.RIGHT_ARROW, { x: x + w + 0.15, y: y + 0.5, w: 0.4, h: 0.3, fill: { color: C.ACCENT }, line: { color: C.ACCENT, width: 0 } });
      });
      if (n) note(s, n, 6.4);
    },
    // ---- 見やすさ重視のレイアウト（白カード + 濃い大きめの文字）----
    // items: [{ icon?, tag?, h, d }]。cols 列で並べる。d は濃い色の15pt前後
    // stacked: true で番号の下に見出し（細い列向け）。既定は番号の右に見出し
    cardGrid({ eyebrow, title, lead: ld, items, cols = items.length, note: n, dSize = 15, cardH, stacked = cols >= 4, foot }) {
      const s = newSlide();
      header(s, eyebrow, title);
      let top = 1.8;
      if (ld) { lead(s, ld); top = 2.6; }
      const rows = Math.ceil(items.length / cols), gap = 0.3;
      const w = (11.83 - gap * (cols - 1)) / cols, bottom = n ? 6.15 : 6.6;
      const h = cardH || (bottom - top - gap * (rows - 1)) / rows;
      items.forEach((it, i) => {
        const x = 0.75 + (i % cols) * (w + gap), y = top + Math.floor(i / cols) * (h + gap);
        card(s, x, y, w, h);
        badge(s, x + 0.25, y + 0.25, pad(i + 1));
        let dy;
        if (stacked) {
          s.addText(it.h, { x: x + 0.25, y: y + 0.95, w: w - 0.5, h: 0.5, fontFace: F, fontSize: 19, bold: true, color: C.INK, margin: 0, valign: "middle", fit: "shrink" });
          dy = y + 1.55;
        } else {
          if (it.tag) s.addText(it.tag, { x: x + 1.0, y: y + 0.18, w: w - 1.2, h: 0.28, fontFace: F, fontSize: 11, bold: true, color: C.ACCENT, margin: 0, valign: "middle" });
          s.addText(it.h, { x: x + 1.0, y: it.tag ? y + 0.42 : y + 0.25, w: w - 1.2, h: it.tag ? 0.45 : 0.55, fontFace: F, fontSize: 20, bold: true, color: C.INK, margin: 0, valign: "middle", fit: "shrink" });
          dy = y + 1.05;
        }
        s.addText(it.d, { x: x + 0.25, y: dy, w: w - 0.5, h: y + h - dy - 0.15, fontFace: F, fontSize: dSize, color: C.INK, margin: 0, valign: "top", lineSpacingMultiple: 1.3 });
      });
      if (foot) {
        const fy = top + rows * h + gap * (rows - 1) + 0.35;
        s.addText(accentRuns(foot, { fontFace: F, fontSize: 18, bold: true, color: C.INK }), { x: 0.75, y: fy, w: 11.83, h: 0.5, margin: 0, align: "center", valign: "middle" });
      }
      if (n) note(s, n, 6.35);
    },
    // 大きなカードを矢印でつなぐフロー。steps: [{ icon, h, sub, d }]
    flowCards({ eyebrow, title, lead: ld, steps, note: n, hi }) {
      const s = newSlide();
      header(s, eyebrow, title);
      let top = 1.85;
      if (ld) { lead(s, ld); top = 2.65; }
      const gap = 0.55, w = (11.83 - gap * (steps.length - 1)) / steps.length, h = (n ? 6.1 : 6.55) - top;
      steps.forEach((st, i) => {
        const x = 0.75 + i * (w + gap), main = hi === i;
        card(s, x, top, w, h, main ? C.ACCENT : C.WHITE);
        const fg = main ? C.WHITE : C.INK;
        s.addText(st.icon, { x, y: top + 0.25, w, h: 0.7, fontSize: 30, align: "center", margin: 0, valign: "middle" });
        s.addText(st.h, { x: x + 0.15, y: top + 1.0, w: w - 0.3, h: 0.5, fontFace: F, fontSize: 20, bold: true, color: fg, align: "center", margin: 0, valign: "middle", fit: "shrink" });
        if (st.sub) s.addText(st.sub, { x: x + 0.15, y: top + 1.5, w: w - 0.3, h: 0.35, fontFace: MONO, fontSize: 12, color: main ? C.WHITE : C.ACCENT, align: "center", margin: 0, valign: "middle" });
        hline(s, x + w / 2 - 0.3, top + 2.0, 0.6, main ? C.WHITE : C.RULE, 1.5);
        s.addText(st.d, { x: x + 0.25, y: top + 2.2, w: w - 0.5, h: h - 2.35, fontFace: F, fontSize: 15, color: fg, align: "center", margin: 0, valign: "top", lineSpacingMultiple: 1.35 });
        if (i < steps.length - 1)
          s.addShape(S.RIGHT_ARROW, { x: x + w + 0.12, y: top + h / 2 - 0.17, w: 0.32, h: 0.34, fill: { color: C.ACCENT }, line: { color: C.ACCENT, width: 0 } });
      });
      if (n) note(s, n, 6.35);
    },
    // 記法の早見カード。rules: [[コード, 意味]]
    chips({ eyebrow, title, rules, cols = 2, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      const gap = 0.3, rows = Math.ceil(rules.length / cols), top = 1.8;
      const w = (11.83 - gap * (cols - 1)) / cols, h = ((n ? 6.15 : 6.6) - top - gap * (rows - 1)) / rows;
      rules.forEach(([code, mean], i) => {
        const x = 0.75 + (i % cols) * (w + gap), y = top + Math.floor(i / cols) * (h + gap);
        card(s, x, y, w, h);
        s.addShape(S.ROUNDED_RECTANGLE, { x: x + 0.25, y: y + (h - 0.6) / 2, w: 2.0, h: 0.6, rectRadius: 0.08, fill: { color: C.DARK }, line: { color: C.DARK, width: 0 } });
        s.addText(code, { x: x + 0.25, y: y + (h - 0.6) / 2, w: 2.0, h: 0.6, fontFace: MONO, fontSize: 15, bold: true, color: C.SOFT, align: "center", valign: "middle", margin: 0 });
        s.addText(mean, { x: x + 2.5, y, w: w - 2.7, h, fontFace: F, fontSize: 15, color: C.INK, margin: 0, valign: "middle", lineSpacingMultiple: 1.25 });
      });
      if (n) note(s, n, 6.35);
    },
    // 左にスマホ風のチャット画面、右にポイント。chat: [{ who: "me"|"ai", t }]
    phoneChat({ eyebrow, title, chat, tipsTitle, tips, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      const px = 0.95, py = 1.7, pw = 4.1, ph = 4.85;
      s.addShape(S.ROUNDED_RECTANGLE, { x: px, y: py, w: pw, h: ph, rectRadius: 0.35, fill: { color: C.DARK }, line: { color: C.DARK, width: 0 }, shadow: { type: "outer", color: "000000", opacity: 0.25, blur: 10, offset: 3, angle: 90 } });
      s.addShape(S.ROUNDED_RECTANGLE, { x: px + 0.12, y: py + 0.12, w: pw - 0.24, h: ph - 0.24, rectRadius: 0.25, fill: { color: C.WHITE }, line: { color: C.WHITE, width: 0 } });
      s.addText("Claude ─ Code", { x: px + 0.12, y: py + 0.2, w: pw - 0.24, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: C.SUB, align: "center", margin: 0 });
      let y = py + 0.6;
      chat.forEach((m) => {
        const me = m.who === "me", bw = pw - 0.8, lines = Math.ceil(m.t.length / 18), bh = 0.22 + lines * 0.21;
        const bx = me ? px + pw - 0.25 - bw : px + 0.25;
        s.addShape(S.ROUNDED_RECTANGLE, { x: bx, y, w: bw, h: bh, rectRadius: 0.12, fill: { color: me ? C.ACCENT : "EDEAE3" }, line: { color: me ? C.ACCENT : "EDEAE3", width: 0 } });
        s.addText(m.t, { x: bx + 0.12, y, w: bw - 0.24, h: bh, fontFace: F, fontSize: 11, color: me ? C.WHITE : C.INK, margin: 0, valign: "middle", lineSpacingMultiple: 1.1 });
        y += bh + 0.12;
      });
      sq(s, 5.6, 1.97);
      s.addText(tipsTitle, { x: 5.85, y: 1.8, w: 6.7, h: 0.45, fontFace: F, fontSize: 20, bold: true, color: C.INK, margin: 0, valign: "middle" });
      tips.forEach(([h, d], i) => {
        const ty = 2.5 + i * 1.3;
        card(s, 5.6, ty, 6.98, 1.12);
        badge(s, 5.8, ty + 0.28, pad(i + 1));
        s.addText(h, { x: 6.55, y: ty + 0.12, w: 5.9, h: 0.45, fontFace: F, fontSize: 17, bold: true, color: C.INK, margin: 0, valign: "middle" });
        s.addText(d, { x: 6.55, y: ty + 0.55, w: 5.9, h: 0.45, fontFace: F, fontSize: 13, color: C.INK, margin: 0, valign: "middle" });
      });
      if (n) note(s, n, 6.65);
    },
    // 公式ドキュメントのスクショを引用する。shots: [{ img, src: "出典名", says: "要旨", url }]（1〜2件）
    quote({ eyebrow, title, shots }) {
      const s = newSlide();
      header(s, eyebrow, title);
      const gap = 0.45, w = (11.83 - gap * (shots.length - 1)) / shots.length;
      const imgH = shots.length === 1 ? 3.45 : 2.55;
      shots.forEach((q, i) => {
        const x = 0.75 + i * (w + gap), y = 1.8;
        s.addShape(S.RECTANGLE, { x, y, w, h: imgH, fill: { color: C.WHITE }, line: { color: C.RULE, width: 1 } });
        image(s, q.img, x + 0.08, y + 0.08, w - 0.16, imgH - 0.16);
        const ty = y + imgH + 0.25;
        s.addText(q.src, { x, y: ty, w, h: 0.3, fontFace: F, fontSize: 11, bold: true, color: C.ACCENT, margin: 0 });
        s.addText(accentRuns("「" + q.says + "」", { fontFace: F, fontSize: shots.length === 1 ? 20 : 16, bold: true, color: C.INK }),
          { x, y: ty + 0.35, w, h: 1.05, margin: 0, valign: "top", lineSpacingMultiple: 1.2 });
        s.addText([{ text: q.url, options: { hyperlink: { url: q.url } } }],
          { x, y: ty + 1.45, w, h: 0.3, fontFace: MONO, fontSize: 9, color: C.SUB, margin: 0 });
      });
    },
    sources({ eyebrow = "REFERENCES", title = "参考資料", items, note: n }) {
      const s = newSlide();
      header(s, eyebrow, title);
      s.addText(items.flatMap(([label, url], i) => [
        { text: label, options: { bold: true, color: C.INK, breakLine: true } },
        { text: url, options: { color: C.SUB, fontSize: 11, fontFace: MONO, breakLine: i < items.length - 1 } },
      ]), { x: 0.9, y: 1.85, w: 11.5, h: 4.3, fontFace: F, fontSize: 14, margin: 0, valign: "top", paraSpaceAfter: 6 });
      if (n) note(s, n, 6.4);
    },
    closing({ eyebrow = "Q & A", title, sub }) {
      const s = newSlide(C.ACCENT);
      s.addText(eyebrow, { x: 0.9, y: 2.4, w: 11, h: 0.4, fontFace: NUM, fontSize: 16, bold: true, color: C.WHITE, margin: 0, charSpacing: 2 });
      s.addText(title, { x: 0.9, y: 2.9, w: 11.5, h: 0.9, fontFace: F, fontSize: 36, bold: true, color: C.WHITE, margin: 0, valign: "middle" });
      if (sub) s.addText(sub, { x: 0.9, y: 3.95, w: 11.5, h: 0.45, fontFace: F, fontSize: 15, color: C.WHITE, transparency: 15, margin: 0 });
      s.addText(event, { x: 0.75, y: 6.85, w: 6, h: 0.3, fontFace: F, fontSize: 10, bold: true, color: C.WHITE, margin: 0 });
      pageNum(s, C.WHITE);
    },
  };

  const save = async (name) => {
    const dir = path.join(ROOT, "slides/output");
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, name + ".pptx");
    await pres.writeFile({ fileName: out });
    console.log(`wrote ${out} (${page} slides)`);
    if (missing.length) console.log("未配置の画像:", [...new Set(missing)].join(", "));
  };
  return { ...L, save };
}

module.exports = { createDeck };
