// 見本: slides/outline/example.md から作った生成スクリプト
// 実行: npm run example  →  slides/output/example.pptx
const { createDeck } = require("./lib");
const d = createDeck({ title: "Markdownで書いて、AIにスライドを作らせる", event: "SAMPLE — ai-slide-kit" });

d.title({ title: "MDで書いて、\nAIにスライドを\n作らせる", date: "2026.11.30", right: "Markdown → PowerPoint" });
d.agenda(["全体像", "書き方", "使えるレイアウト", "まとめ"]);
d.purpose({
  strong: true,
  text: "スライドは【書く】ものから、\nAIに【書き出させる】ものへ。",
  cols: [
    ["中身はMarkdown", "話したいことを\nテキストで書くだけ"],
    ["見た目はルールで", "色・フォント・配置は\nデザイン定義で統一"],
    ["生成はAIに任せる", "コマンド1つで\nPowerPointが出てくる"],
  ],
});

// 01 全体像
d.section(1, "全体像", "MDファイルからスライドを書き出す流れ");
d.flowCards({
  eyebrow: "全体像", title: "MDを書いて、コマンドを打つだけ",
  lead: "人がやるのは「MDを書く」と「コマンドを打つ」の2つだけ",
  hi: 1,
  steps: [
    { icon: "📝", h: "MDファイルを書く", sub: "slides/outline/*.md", d: "見出しと箇条書きで\nスライドの中身を書く" },
    { icon: "🤖", h: "スキルで変換", sub: "/slide-create", d: "Claude Code が構成を決めて\n生成スクリプトを書く" },
    { icon: "📊", h: "PowerPoint 完成", sub: "slides/output/*.pptx", d: "そのまま発表に使える\n.pptx ができあがる" },
  ],
});

// 02 書き方
d.section(2, "書き方", "見出しの数 = スライドの枚数");
d.code({
  eyebrow: "書き方 ①", title: "アウトラインはこう書く",
  label: "OUTLINE.md", size: 15, sideX: 7.4,
  code:
`# 発表タイトル

## 章のタイトル
//layout: section

### スライドの見出し
//layout: bullets
// ここに作成指示を書く
- 本文の箇条書き`,
  side: ["← 表紙", "", "← 章の扉", "← レイアウト指定", "", "← スライド1枚", "← レイアウト指定", "← AIへの指示（出ない）", "← 本文"],
  note: "「//」で始まる行は AI へのメモ。スライドには出ない",
});
d.chips({
  eyebrow: "書き方 ②", title: "覚えておくルール",
  rules: [
    ["# ## ###", "表紙 / 章の扉 / スライド1枚"],
    ["//layout:", "レイアウトを選ぶ"],
    ["//image:", "貼る画像（なくても仮の枠）"],
    ["//lead:", "上部のオレンジ帯に出す一言"],
    ["// 指示", "AIへの指示（画面に出ない）"],
    ["【 】", "強調（オレンジ色になる）"],
  ],
  note: "レイアウトの一覧は slides/template/_DESIGN.md",
});

// 03 使えるレイアウト
d.section(3, "使えるレイアウト", "よく使うものを抜粋");
d.bullets({
  eyebrow: "使えるレイアウト ①", title: "箇条書き（bullets）",
  items: [
    ["1枚1メッセージにする", ["言いたいことが2つあるなら2枚に分ける"]],
    ["本文は6〜7項目まで", ["1行は全角30文字以内が目安"]],
    ["強調は【】でくくる", ["オレンジにするのは1枚に1〜2語まで"]],
  ],
});
d.imageSide({
  eyebrow: "使えるレイアウト ②", title: "画像と文章（image-right）",
  img: "slides/assets/example-screen.png",
  caption: "画像が無いときは、このようにオレンジの仮枠が入る",
  blocks: [
    { h: "画像の置き場所", items: ["slides/assets/ に置く", "//image: でパスを指定する"] },
    { h: "画像が無くてもOK", items: ["仮枠のまま生成できる", "完了報告で未配置の画像が一覧で出る"] },
  ],
});
d.table({
  eyebrow: "使えるレイアウト ③", title: "比較表（table）",
  head: ["やりたいこと", "手で作る", "このキット"],
  colW: [5.0, 3.4, 3.43], align: ["left", "center", "center"], bold: [0],
  rows: [
    ["見た目をそろえる", "△", "○"],
    ["内容の修正", "○", "○"],
    ["作り直しの速さ", "✕", "○"],
    ["細かい装飾", "○", "△"],
  ],
  note: "細かい装飾は、生成したあとに PowerPoint で直すのが早い",
});
d.compare2({
  eyebrow: "使えるレイアウト ④", title: "AとBの使い分け（compare-2）",
  cards: [
    { name: "MDから作る", sub: "/slide-create", points: ["勉強会・社内共有", "構成から考えたいとき", "毎回同じ見た目にしたい"] },
    { name: "手で作る", sub: "PowerPoint / Keynote", points: ["デザインに凝りたい", "アニメーションを使う", "1〜2枚だけ直したい"] },
  ],
});

// まとめ
d.message("AIで【6割】、人で【4割】。\nそれでも、ゼロから作るよりずっと楽。");
d.closing({ title: "なんでも聞いてください", sub: "このスライドも、同じ方法で作っています" });

d.save("example");
