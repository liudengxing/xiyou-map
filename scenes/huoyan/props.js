// scenes/huoyan/props.js —— P5-9 前景纸件（第 46 轮）。
// 目的：把画面里「干干净净的纸底」填成一片有物件的戈壁。measure.py 里 printDetail / barePct /
// flatPct 三项一直 WARN，原因不是缺大件，而是 sharp band（z -16…8 这段）里没有碎件：
// 空地上只剩纸纹，没有印出来的边缘与暗部。这里按「成组 4–8 片、组间留空」的规律摆四类小件：
//   纸石簇（4 片）、枯草束（5 片）、断旗杆（3 片）、骨片干柴堆（4 片）。
// 全部用直边多边形（纸模硬约束：不许曲线），每片 z 唯一，左右朝向靠 yaw 差一点避免「一排站军姿」。
// 这些是装饰件，不参与寻路、不设 solid，主角可以从中间穿过去。

const T = 0.08;        // 卡厚，与 harness 的 cardOpts 一致
const GAP = 0.09;      // 同簇内相邻卡的 z 间隔，必须 > T 才不会落进 clips()

// 一片纸的通用收尾：贴地接触阴影（暖赭，不用黑）+ 纸边压暗。
function floorContact(P, C, h) {
  P.innerShade(C.shadow, { alpha: 0.22, blurPx: 6 });
  const { g, box } = P;
  g.save();
  g.globalAlpha = 0.28;
  g.fillStyle = C.ochreD;
  g.fillRect(box.x0, box.y1 - Math.max(3, box.h * 0.08), box.w, Math.max(3, box.h * 0.08));
  g.restore();
}

// 印花母题：纸件上必须有 ≥2 px、α ≥0.18 的线，否则 1600 宽重采样后整个被糊掉
// （这正是 printDetail 一直上不去的原因）。这里按「横纹 + 散点 + 一道暗缝」三样给。
function printTexture(P, C, seed, { lines = 4, dots = 10 } = {}) {
  const { g, box } = P;
  let s = seed | 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  g.save();
  g.strokeStyle = C.ink;
  g.globalAlpha = 0.22;
  g.lineWidth = 2;
  for (let i = 0; i < lines; i++) {
    const y = box.y0 + box.h * (0.18 + rnd() * 0.66);
    g.beginPath();
    g.moveTo(box.x0 + box.w * (0.08 + rnd() * 0.2), y);
    g.lineTo(box.x0 + box.w * (0.66 + rnd() * 0.3), y + (rnd() - 0.5) * box.h * 0.12);
    g.stroke();
  }
  g.fillStyle = C.deep;
  g.globalAlpha = 0.3;
  for (let i = 0; i < dots; i++) {
    const r = Math.max(1.1, Math.min(2.4, box.w * 0.035));
    g.beginPath();
    g.arc(box.x0 + box.w * (0.1 + rnd() * 0.8), box.y0 + box.h * (0.1 + rnd() * 0.8), r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

// ① 纸石簇：一块大的立卡 + 前面两片小的，读起来是「几层纸叠出来的石头」
const rockBig = [[-0.9, 0], [-0.72, 0.62], [-0.3, 0.92], [0.34, 0.86], [0.86, 0.44], [0.92, 0]];
const rockMid = [[-0.6, 0], [-0.42, 0.4], [0.12, 0.52], [0.6, 0.16], [0.6, 0]];
const rockSml = [[-0.34, 0], [-0.2, 0.22], [0.26, 0.26], [0.4, 0], [0.0, -0.02]];

// ② 枯草束：四根折过两次的草叶（直边折线，不做弧）
const grassBlade = (lean, h) => [
  [-0.06, 0], [-0.06, h * 0.55], [-0.14 - lean * 0.4, h * 0.82], [-0.2 - lean, h],
  [-0.04 - lean, h * 0.9], [0.02, h * 0.55], [0.06, 0],
];

// ③ 断旗杆：一根立卡 + 一截斜插的断头 + 一片挂残的旗角
const pole = (twist) => [
  [-0.08, 0], [-0.06, 2.5], [0.06 + twist, 2.62], [0.08, 2.42], [0.1, 0],
];
const poleHead = [[0.08, 2.4], [0.5, 2.2], [0.62, 2.62], [0.16, 2.66]];
const flagScrap = [[0, 0], [0.9, -0.18], [1.0, 0.5], [0.62, 0.34], [0.3, 0.62], [0, 0.5]];

// ④ 骨片 / 干柴堆：两根斜柴 + 一节断骨 + 一片薄 shadow
const stick = (len, thick) => [[-thick, 0], [0, thick], [len, len * 0.16], [len, len * 0.16 + thick * 0.6], [0, thick * 1.6]];
const bone = [[-0.5, 0.06], [-0.42, 0.22], [0.34, 0.24], [0.5, 0.1], [0.34, 0.0], [-0.4, 0.02]];

export function buildProps(H, C) {
  let cards = 0;
  let seed = 7331;

  const put = (pts, paint, opts) => {
    H.popup(pts, paint, opts);
    cards++;
  };

  // 四组坐标：避开取景正中（主角站 z=3 一带）与走进芭蕉洞那侧，组间至少留 4 个单位空地。
  // z 落在 sharp band（-16…8）；x 分两翼，让画面中间那条走道仍然空。
  const clusters = [
    { kind: 'rock', x: -9.4, z: -13.2, s: 1.5 },
    { kind: 'grass', x: -12.2, z: -5.6, s: 1.3 },
    { kind: 'rock', x: 11.6, z: -12.0, s: 1.15 },
    { kind: 'pole', x: 8.8, z: -7.4, s: 1.0 },
    { kind: 'bone', x: -6.6, z: -1.4, s: 1.0 },
    { kind: 'grass', x: 13.0, z: 1.2, s: 1.15 },
    { kind: 'rock', x: -13.4, z: 4.4, s: 0.95 },
    { kind: 'bone', x: 6.2, z: -15.0, s: 0.9 },
    { kind: 'grass', x: -3.6, z: -16.4, s: 1.0 },
    { kind: 'pole', x: -10.6, z: 7.2, s: 0.8 },
    // 近景一组（第 46 轮第二遍）：sharp band 落在画面下半，也就是相机与主角之间这块近地
    // （z ≈ 7…15）。量完发现远处的十组不进清晰带，barePct 只从 93.9 降到 75.8，
    // 所以在近地再补六组、并放大到 1.5–2.2 倍，让纸件本身也占住清晰带。
    { kind: 'rock', x: -8.2, z: 9.6, s: 1.9 },
    { kind: 'bone', x: 4.6, z: 11.4, s: 1.7 },
    { kind: 'grass', x: -13.4, z: 12.8, s: 1.6 },
    { kind: 'rock', x: 10.8, z: 8.4, s: 1.8 },
    { kind: 'grass', x: 1.2, z: 13.6, s: 1.5 },
    { kind: 'bone', x: -4.0, z: 14.2, s: 1.4 },
  ];

  for (const c of clusters) {
    const base = c.z;
    const sc = c.s;

    if (c.kind === 'rock') {
      // 四片：背板大石、左小石、右中石、压在最前的一片薄石（z 递增，互不压在同一平面）
      put(rockBig, (P) => {
        P.fill(C.ochreD);
        printTexture(P, C, seed++, { lines: 5, dots: 12 });
        floorContact(P, C);
      }, { x: c.x, z: base, scale: sc * 1.35, yaw: -0.06, res: 0.8, order: 40 });
      put(rockMid, (P) => {
        P.fill(C.ochre);
        printTexture(P, C, seed++, { lines: 3, dots: 7 });
        floorContact(P, C);
      }, { x: c.x - 1.05 * sc, z: base + GAP, scale: sc * 0.95, yaw: 0.12, res: 0.9, order: 41 });
      put(rockMid, (P) => {
        P.fill(C.ochre);
        printTexture(P, C, seed++, { lines: 4, dots: 8 });
        floorContact(P, C);
      }, { x: c.x + 1.15 * sc, z: base + GAP * 2, scale: sc * 0.8, yaw: -0.15, res: 0.9, order: 42 });
      put(rockSml, (P) => {
        P.fill(C.deep);
        printTexture(P, C, seed++, { lines: 2, dots: 6 });
        floorContact(P, C);
      }, { x: c.x + 0.35 * sc, z: base + GAP * 3, scale: sc * 0.9, yaw: 0.05, res: 1.0, order: 43 });
    } else if (c.kind === 'grass') {
      // 五片：四根草叶（高处 yaw 差一档、z 各隔一层）+ 一片贴地的碎土
      const leans = [-0.55, -0.1, 0.28, 0.62];
      const heights = [1.15, 1.5, 1.28, 0.95];
      leans.forEach((lean, i) => {
        put(grassBlade(lean, heights[i]), (P) => {
          P.fill(i % 2 ? C.ochre : C.ochreD);
          printTexture(P, C, seed++, { lines: 1, dots: 3 });
          floorContact(P, C);
        }, {
          x: c.x + (i - 1.5) * 0.34 * sc, z: base + i * GAP,
          scale: sc * (0.55 + (i % 3) * 0.08), yaw: (i - 1.5) * 0.16, res: 1.0, order: 44 + i,
        });
      });
      put(rockSml, (P) => {
        P.fill(C.ochreD);
        printTexture(P, C, seed++, { lines: 2, dots: 5 });
        floorContact(P, C);
      }, { x: c.x, z: base + GAP * 5, scale: sc * 1.1, yaw: 0, res: 0.9, order: 49 });
    } else if (c.kind === 'pole') {
      // 三片：杆、断头、旗角（旗角挂在断头下缘，z 再前进一层）
      put(pole(0.1), (P) => {
        P.fill(C.ochreD);
        printTexture(P, C, seed++, { lines: 6, dots: 5 });
        floorContact(P, C);
      }, { x: c.x, z: base, scale: sc * 1.15, yaw: 0.05, res: 1.0, order: 46 });
      put(poleHead, (P) => {
        P.fill(C.ink);
        printTexture(P, C, seed++, { lines: 2, dots: 4 });
      }, { x: c.x, z: base + GAP, scale: sc * 1.15, yaw: 0.05, res: 1.0, order: 47 });
      put(flagScrap, (P) => {
        P.fill(C.burnt);
        printTexture(P, C, seed++, { lines: 3, dots: 6 });
        P.innerShade(C.ink, { alpha: 0.3, blurPx: 5 });
      }, { x: c.x + 0.1, z: base + GAP * 2, scale: sc * 1.15, yaw: 0.05, order: 48 });
    } else {
      // 骨片干柴堆：四片，两柴错向、一骨、一片薄土
      put(stick(1.5, 0.07), (P) => {
        P.fill(C.ochreD);
        printTexture(P, C, seed++, { lines: 4, dots: 6 });
        floorContact(P, C);
      }, { x: c.x, z: base, scale: sc * 1.2, yaw: 0.34, res: 1.0, order: 50 });
      put(stick(1.2, 0.06), (P) => {
        P.fill(C.ochre);
        printTexture(P, C, seed++, { lines: 3, dots: 5 });
        floorContact(P, C);
      }, { x: c.x + 0.2, z: base + GAP, scale: sc * 1.2, yaw: -0.42, res: 1.0, order: 51 });
      put(bone, (P) => {
        P.fill(C.paperL);
        printTexture(P, C, seed++, { lines: 2, dots: 4 });
        P.innerShade(C.ochreD, { alpha: 0.35, blurPx: 5 });
      }, { x: c.x - 0.6, z: base + GAP * 2, scale: sc * 1.25, yaw: 0.08, res: 1.0, order: 52 });
      put(rockSml, (P) => {
        P.fill(C.deep);
        printTexture(P, C, seed++, { lines: 2, dots: 5 });
        floorContact(P, C);
      }, { x: c.x + 0.9, z: base + GAP * 3, scale: sc * 0.9, yaw: 0.2, res: 0.9, order: 53 });
    }
  }

  // 零散小件：单片的碎纸砾，把组与组之间的空地压出几粒暗点（不给 shadow，免得地面脏）
  const pebble = [[-0.16, 0], [-0.1, 0.11], [0.1, 0.13], [0.18, 0]];
  const singles = [
    [-1.8, -9.6], [2.6, -11.4], [-7.4, -8.2], [4.4, -4.6], [9.6, 3.4],
    [-5.0, 6.0], [1.0, -14.2], [-11.0, -0.4], [12.2, -2.0], [-9.0, 2.2],
  ];
  singles.forEach(([x, z], i) => {
    put(pebble, (P) => {
      P.fill(i % 3 ? C.ochreD : C.deep);
      printTexture(P, C, seed++, { lines: 1, dots: 2 });
    }, { x, z, scale: 0.9 + (i % 3) * 0.2, yaw: (i % 5) * 0.3, res: 0.8, order: 39 });
  });

  return { cards, clusters: clusters.length };
}