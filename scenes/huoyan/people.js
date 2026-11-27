// 火焰山纸模 · 三位说话的人（P5-5）
//
// 做法同 wukong.js：每个人都是 5–6 张卡叠出来的纸人（正面卡 + 紧跟其后的侧面卡 + 头部/道具），
// 每张卡有唯一 z；卡躺在地上、开局折起（H.popup 的 hinge 动画），与火墙/洞同一套纸。
//
// 与主角不同的两点：
//   ① 他们不走路 —— 只在原地轻微摆动（popup 的 sway），所以不需要 stride；
//   ② 要能被点到 —— 每个 hinge.group 上盖一个 userData.personId，场景那边 raycast 后就认得是谁。
// 位置都落在 walkArea（x −14..14, z −16..8）里、且离火墙（z −28..−22）够远。
// 台词据第五十九至六十一回情节改写，非原著原文；每句末尾标回目，头上徽标写明「据回目改写」。

import { withPrint } from './print.js?v=5';

const C = {
  page: '#f3e7cd', deep: '#ead8b6', ochre: '#d7bd93', ochreD: '#bfa072',
  burnt: '#8c2b22', ember: '#b03a2e', shadow: '#a0602c', gold: '#b8934a',
  jade: '#3f6b4a', ink: '#2a241c', face: '#efdcc0', faceD: '#dcc39c',
};

/** 一段台词：按回目里这个人当时做的事来写，句末标回目；badge 写明「不是原文」。 */
const PEOPLE = [
  {
    id: 'luocha',
    name: '罗刹女',
    role: '铁扇公主 · 芭蕉洞主',
    badge: '据第59–60回改写，非原文',
    x: -9.2,
    z: -12.0,
    scale: 0.86,
    lines: [
      '你害我孩儿被菩萨收了去，如今倒有脸来借扇。（第59回）',
      '这扇子一扇息火，二扇生风，三扇下雨，是芭蕉洞的根。（第59回）',
      '给了你扇子，你倒越扇火越旺——那是我哄你的。（第60回）',
    ],
  },
  {
    id: 'niujia',
    name: '牛魔王',
    role: '大力王 · 罗刹女之夫',
    badge: '据第60–61回改写，非原文',
    x: -3.4,
    z: -14.6,
    scale: 0.95,
    lines: [
      '碧波潭的宴我还没吃完，你倒闹上门来。（第60回）',
      '你变作我的模样，骗去我那把扇子，这笔账怎么算。（第60回）',
      '哪吒穿了我的鼻，李天王又照住我——扇子，你拿去罢。（第61回）',
    ],
  },
  {
    id: 'bajie',
    name: '猪八戒',
    role: '天蓬元帅 · 唐僧二徒弟',
    badge: '据第59、61回改写，非原文',
    x: 7.4,
    z: -6.2,
    scale: 0.88,
    lines: [
      '猴哥，这火烤得俺老猪的耳朵都要焦了，你倒是快些把扇子弄来。（第59回）',
      '这回俺老猪不躲了，助你打那牛魔王。（第61回）',
      '扇子到手，火息了，好保师父过山。（第61回）',
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
      // 印纹样式：罗刹女/牛魔王/八戒的衣裳与甲用 cloth，金箍棒与钉钯之外的硬件用 metal。
      const style = c.style || 'cloth';
      const h = H.popup(c.pts, withPrint(c.paint, C, style), {
        x: p.x,
        z: p.z + c.dz,           // 同一人的卡只差一点点深度，像一叠纸
        scale: p.scale,
        order: 8,                // 不比火墙（10+）近，比地面高
        sway: 0.012,             // 站着的纸人有一点呼吸
        solid: c.solid || 0,
        // Q3：三人 scale 0.86–0.95，res 0.8 时卡面只有 28 px 级；抬到 2.8
        // （40 × 2.8 ÷ 0.9 ≈ 124 px/单位）才印得出 2 px 的线。
        res: 2.8,
      });
      h.group.userData.personId = p.id;
      h.group.userData.cardIndex = i;
      return h;
    });
    return { ...p, hinges };
  });
}
