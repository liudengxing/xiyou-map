// 火焰山纸模 · 三位说话的人（P5-5）
//
// 做法同 wukong.js：每个人都是 5–6 张卡叠出来的纸人（正面卡 + 紧跟其后的侧面卡 + 头部/道具），
// 每张卡有唯一 z；卡躺在地上、开局折起（H.popup 的 hinge 动画），与火墙/洞同一套纸。
//
// 与主角不同的两点：
//   ① 他们不走路 —— 只在原地轻微摆动（popup 的 sway），所以不需要 stride；
//   ② 要能被点到 —— 每个 hinge.group 上盖一个 userData.personId，场景那边 raycast 后就认得是谁。
// 位置都落在 walkArea（x −14..14, z −16..8）里、且离火墙（z −28..−22）够远。
// 对话文案一律标「示例，待用户确认」，不是原著原文。

const C = {
  page: '#f3e7cd', deep: '#ead8b6', ochre: '#d7bd93', ochreD: '#bfa072',
  burnt: '#8c2b22', ember: '#b03a2e', shadow: '#a0602c', gold: '#b8934a',
  jade: '#3f6b4a', ink: '#2a241c', face: '#efdcc0', faceD: '#dcc39c',
};

/** 一段示例对话：line 必须读起来像「这个人会说的话」，但别冒充原文。 */
const PEOPLE = [
  {
    id: 'luocha',
    name: '罗刹女',
    role: '铁扇公主 · 芭蕉洞主',
    x: -9.2,
    z: -12.0,
    scale: 0.86,
    lines: [
      '又是你。上回借扇，你把我们娘儿俩戏弄得还不够？',
      '这扇子是我芭蕉洞的命根子。要借，先问我手里的剑答不答应。',
      '（示例台词，待用户确认；原著情节见第五十九回至第六十一回。）',
    ],
  },
  {
    id: 'niujia',
    name: '牛魔王',
    role: '大力王 · 罗刹女之夫',
    x: -3.4,
    z: -14.6,
    scale: 0.95,
    lines: [
      '孙悟空？五百年不见，你倒学会来我家里讨东西了。',
      '我与你曾是结拜兄弟，如今你要灭我的火焰山，那就先过我这关。',
      '（示例台词，待用户确认；原著情节见第六十回、第六十一回。）',
    ],
  },
  {
    id: 'bajie',
    name: '猪八戒',
    role: '天蓬元帅 · 唐僧二徒弟',
    x: 7.4,
    z: -6.2,
    scale: 0.88,
    lines: [
      '猴哥，这火烤得俺老猪的耳朵都要焦了，你倒是快些把扇子弄来。',
      '那牛魔王看着凶，真打起来未必有俺老猪这九齿钉耙厉害。',
      '（示例台词，待用户确认；原著情节见第六十一回。）',
    ],
  },
];

/** 罗刹女：石绿长裙 + 朱砂腰带 + 墨髻 + 芭蕉扇。 */
function luochaCards() {
  return [
    {
      name: 'luocha-robe', dz: 0.0, solid: 0.5,
      pts: [[-0.52, 0], [0.52, 0], [0.40, 1.32], [0.46, 1.92], [-0.46, 1.92], [-0.40, 1.32]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.jade);
        // 裙褶：两道墨线从腰垂到脚
        g.strokeStyle = C.ink; g.globalAlpha = 0.34; g.lineWidth = 1.8;
        [0.36, 0.62].forEach((t) => {
          g.beginPath();
          g.moveTo(box.x0 + box.w * t, box.y0 + box.h * 0.52);
          g.lineTo(box.x0 + box.w * (t - 0.06), box.y0 + box.h * 0.04);
          g.stroke();
        });
        g.globalAlpha = 1;
        // 朱砂腰带
        g.fillStyle = C.ember;
        g.fillRect(box.x0 + box.w * 0.02, box.y0 + box.h * 0.50, box.w * 0.96, box.h * 0.07);
        P.innerShade(C.ink, { alpha: 0.30, blurPx: 9 });
      },
    },
    {
      name: 'luocha-robe-side', dz: -0.12,
      pts: [[-0.34, 0.06], [0.34, 0.06], [0.30, 1.86], [-0.30, 1.86]],
      paint: (P) => { P.fill('#35603f'); P.innerShade(C.ink, { alpha: 0.26, blurPx: 8 }); },
    },
    {
      name: 'luocha-head', dz: 0.10,
      pts: [[-0.24, 1.92], [0.24, 1.92], [0.26, 2.46], [0.13, 2.60], [-0.13, 2.60], [-0.26, 2.46]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.face);
        // 眉眼
        g.fillStyle = C.ink;
        g.fillRect(box.x0 + box.w * 0.28, box.y0 + box.h * 0.62, box.w * 0.13, box.h * 0.045);
        g.fillRect(box.x0 + box.w * 0.59, box.y0 + box.h * 0.62, box.w * 0.13, box.h * 0.045);
        // 朱砂唇
        g.fillStyle = C.ember;
        g.fillRect(box.x0 + box.w * 0.44, box.y0 + box.h * 0.30, box.w * 0.14, box.h * 0.05);
        P.innerShade(C.faceD, { alpha: 0.34, blurPx: 7 });
      },
    },
    {
      name: 'luocha-hair', dz: -0.04,
      pts: [[-0.28, 2.34], [0.28, 2.34], [0.22, 2.72], [0.0, 2.80], [-0.22, 2.72]],
      paint: (P) => { P.fill(C.ink); P.innerShade('#000', { alpha: 0.2, blurPx: 6 }); },
    },
    {
      name: 'luocha-hairpin', dz: 0.20,
      pts: [[-0.30, 2.58], [0.30, 2.58], [0.30, 2.66], [-0.30, 2.66]],
      paint: (P) => { P.fill(C.gold); },
    },
    {
      name: 'luocha-fan', dz: 0.26,
      pts: [[-0.62, 0.66], [-0.30, 1.24], [-0.02, 1.46], [0.26, 1.22], [0.58, 0.64], [0.0, 0.48]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.jade);
        // 扇骨：三根金线
        g.strokeStyle = C.gold; g.globalAlpha = 0.9; g.lineWidth = 1.6;
        [0.34, 0.5, 0.66].forEach((t) => {
          g.beginPath();
          g.moveTo(box.x0 + box.w * 0.5, box.y0 + box.h * 0.06);
          g.lineTo(box.x0 + box.w * t, box.y0 + box.h * 0.92);
          g.stroke();
        });
        g.globalAlpha = 1;
        P.innerShade(C.ink, { alpha: 0.24, blurPx: 6 });
      },
    },
  ];
}

/** 牛魔王：赭石甲 + 墨色披风 + 一对牛角。 */
function niujiaCards() {
  return [
    {
      name: 'niujia-cape', dz: -0.34,
      pts: [[-0.72, 0.02], [0.72, 0.02], [0.80, 1.86], [0.34, 2.24], [-0.34, 2.24], [-0.80, 1.86]],
      paint: (P) => { P.fill(C.ember); P.innerShade(C.burnt, { alpha: 0.42, blurPx: 10 }); },
    },
    {
      name: 'niujia-armor', dz: 0.0, solid: 0.62,
      pts: [[-0.58, 0.08], [0.58, 0.08], [0.52, 1.30], [0.62, 2.02], [-0.62, 2.02], [-0.52, 1.30]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.ochreD);
        // 甲片：三道墨线横勒
        g.strokeStyle = C.ink; g.globalAlpha = 0.5; g.lineWidth = 2;
        [0.34, 0.52, 0.70].forEach((t) => {
          g.beginPath();
          g.moveTo(box.x0 + box.w * 0.06, box.y0 + box.h * t);
          g.lineTo(box.x0 + box.w * 0.94, box.y0 + box.h * t);
          g.stroke();
        });
        g.globalAlpha = 1;
        // 护心镜
        g.fillStyle = C.gold;
        g.beginPath();
        g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.62, box.w * 0.11, 0, Math.PI * 2);
        g.fill();
        P.innerShade(C.shadow, { alpha: 0.36, blurPx: 9 });
      },
    },
    {
      name: 'niujia-armor-side', dz: -0.14,
      pts: [[-0.32, 0.12], [0.32, 0.12], [0.28, 1.94], [-0.28, 1.94]],
      paint: (P) => { P.fill(C.ochre); P.innerShade(C.burnt, { alpha: 0.26, blurPx: 8 }); },
    },
    {
      name: 'niujia-head', dz: 0.12,
      pts: [[-0.30, 2.02], [0.30, 2.02], [0.32, 2.58], [0.16, 2.74], [-0.16, 2.74], [-0.32, 2.58]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.faceD);
        // 牛鼻与浓眉
        g.fillStyle = C.ink;
        g.fillRect(box.x0 + box.w * 0.40, box.y0 + box.h * 0.30, box.w * 0.20, box.h * 0.10);
        g.fillRect(box.x0 + box.w * 0.20, box.y0 + box.h * 0.66, box.w * 0.20, box.h * 0.06);
        g.fillRect(box.x0 + box.w * 0.60, box.y0 + box.h * 0.66, box.w * 0.20, box.h * 0.06);
        // 胡须
        g.globalAlpha = 0.7;
        g.fillRect(box.x0 + box.w * 0.30, box.y0 + box.h * 0.05, box.w * 0.40, box.h * 0.12);
        g.globalAlpha = 1;
        P.innerShade(C.burnt, { alpha: 0.24, blurPx: 7 });
      },
    },
    {
      name: 'niujia-horn-l', dz: 0.22,
      pts: [[-0.40, 2.60], [-0.14, 2.62], [-0.20, 2.86], [-0.46, 3.02], [-0.54, 2.84]],
      paint: (P) => { P.fill(C.page); P.innerShade(C.ochreD, { alpha: 0.4, blurPx: 5 }); },
    },
    {
      name: 'niujia-horn-r', dz: 0.18,
      pts: [[0.40, 2.60], [0.14, 2.62], [0.20, 2.86], [0.46, 3.02], [0.54, 2.84]],
      paint: (P) => { P.fill(C.deep); P.innerShade(C.ochreD, { alpha: 0.4, blurPx: 5 }); },
    },
  ];
}

/** 猪八戒：灰袍 + 大耳 + 九齿钉耙。 */
function bajieCards() {
  return [
    {
      name: 'bajie-robe', dz: 0.0, solid: 0.56,
      pts: [[-0.56, 0], [0.56, 0], [0.42, 1.24], [0.50, 1.96], [-0.50, 1.96], [-0.42, 1.24]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.deep);
        // 大肚：一道弧线
        g.strokeStyle = C.ink; g.globalAlpha = 0.34; g.lineWidth = 2;
        g.beginPath();
        g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.46, box.w * 0.30, 0.2, Math.PI - 0.2);
        g.stroke();
        g.globalAlpha = 1;
        // 腰带
        g.fillStyle = C.shadow;
        g.fillRect(box.x0 + box.w * 0.04, box.y0 + box.h * 0.28, box.w * 0.92, box.h * 0.06);
        P.innerShade(C.ochreD, { alpha: 0.34, blurPx: 9 });
      },
    },
    {
      name: 'bajie-robe-side', dz: -0.12,
      pts: [[-0.34, 0.04], [0.34, 0.04], [0.30, 1.90], [-0.30, 1.90]],
      paint: (P) => { P.fill(C.ochreD); P.innerShade(C.ink, { alpha: 0.24, blurPx: 8 }); },
    },
    {
      name: 'bajie-head', dz: 0.10,
      pts: [[-0.30, 1.96], [0.30, 1.96], [0.32, 2.54], [0.16, 2.66], [-0.16, 2.66], [-0.32, 2.54]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.faceD);
        // 猪鼻
        g.fillStyle = C.face;
        g.fillRect(box.x0 + box.w * 0.36, box.y0 + box.h * 0.34, box.w * 0.28, box.h * 0.14);
        g.fillStyle = C.ink;
        g.fillRect(box.x0 + box.w * 0.42, box.y0 + box.h * 0.39, box.w * 0.05, box.h * 0.05);
        g.fillRect(box.x0 + box.w * 0.54, box.y0 + box.h * 0.39, box.w * 0.05, box.h * 0.05);
        // 小眼睛
        g.fillRect(box.x0 + box.w * 0.26, box.y0 + box.h * 0.66, box.w * 0.10, box.h * 0.05);
        g.fillRect(box.x0 + box.w * 0.64, box.y0 + box.h * 0.66, box.w * 0.10, box.h * 0.05);
        P.innerShade(C.ochreD, { alpha: 0.3, blurPx: 7 });
      },
    },
    {
      name: 'bajie-ear-l', dz: 0.20,
      pts: [[-0.32, 2.44], [-0.56, 2.56], [-0.60, 2.18], [-0.40, 2.06], [-0.30, 2.18]],
      paint: (P) => { P.fill(C.face); P.innerShade(C.faceD, { alpha: 0.44, blurPx: 6 }); },
    },
    {
      name: 'bajie-ear-r', dz: 0.16,
      pts: [[0.32, 2.44], [0.56, 2.56], [0.60, 2.18], [0.40, 2.06], [0.30, 2.18]],
      paint: (P) => { P.fill(C.face); P.innerShade(C.faceD, { alpha: 0.44, blurPx: 6 }); },
    },
    {
      name: 'bajie-rake', dz: 0.30,
      pts: [[0.46, 0.16], [0.56, 0.16], [0.58, 1.52], [0.86, 1.52], [0.86, 1.62], [0.46, 1.62]],
      paint: (P) => {
        const { g, box } = P;
        P.fill(C.ink);
        // 钉耙齿
        g.fillStyle = C.gold;
        [0.52, 0.60, 0.68, 0.76, 0.84].forEach((t) => {
          g.fillRect(box.x0 + box.w * t, box.y0 + box.h * 0.84, box.w * 0.05, box.h * 0.14);
        });
        P.innerShade(C.burnt, { alpha: 0.2, blurPx: 5 });
      },
    },
  ];
}

const BUILDERS = { luocha: luochaCards, niujia: niujiaCards, bajie: bajieCards };

/**
 * 把三个人摆到场景里。返回 [{ id, name, role, lines, x, z, hinges }]。
 * hinges 供场景做拾取（每张卡的 group 上都有 userData.personId）。
 */
export function buildPeople(H) {
  return PEOPLE.map((p) => {
    const cards = BUILDERS[p.id]();
    const hinges = cards.map((c, i) => {
      const h = H.popup(c.pts, c.paint, {
        x: p.x,
        z: p.z + c.dz,           // 同一人的卡只差一点点深度，像一叠纸
        scale: p.scale,
        order: 8,                // 不比火墙（10+）近，比地面高
        sway: 0.012,             // 站着的纸人有一点呼吸
        solid: c.solid || 0,
        res: 0.8,
      });
      h.group.userData.personId = p.id;
      h.group.userData.cardIndex = i;
      return h;
    });
    return { ...p, hinges };
  });
}
